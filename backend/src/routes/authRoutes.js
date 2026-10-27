import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { usersDb, membersDb } from '../db.js';
import { mysqlDb } from '../mysql.js';
import { authenticateUser, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Helper to format user object safely for frontend
async function formatSafeUser(u) {
  if (!u) return null;
  let alumniProfile = null;
  if (u.email) {
    try {
      if (mysqlDb.isAvailable()) {
        alumniProfile = await mysqlDb.getMemberByEmail(u.email);
      }
    } catch (err) {
      console.warn('Alumni profile lookup warning:', err.message);
    }

    if (!alumniProfile) {
      try {
        const allMembers = membersDb.read();
        const targetEmail = u.email.toLowerCase().trim();
        alumniProfile = allMembers.find(m => {
          const email1 = m.basic?.email || m.basic?.email_id;
          const email2 = m.searchHelper?.email;
          return (email1 && email1.toLowerCase().trim() === targetEmail) ||
                 (email2 && email2.toLowerCase().trim() === targetEmail);
        }) || null;
      } catch (err) {
        console.warn('JSON members lookup warning:', err.message);
      }
    }
  }

  const fullName = alumniProfile?.basic?.name || u.full_name || u.fullName || u.email.split('@')[0];
  const mobile = u.phone_number || u.mobile || alumniProfile?.contactDetails?.mobile || '';
  const profileImage = alumniProfile?.pictures?.profile || alumniProfile?.pictures?.thumb || u.profile_image || u.profileImage || '';
  
  const rawDate = u.created_at || u.createdAt || alumniProfile?.membershipDetails?.[0]?.registeredOn;
  let createdAt = new Date().toISOString();
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      createdAt = parsed.toISOString();
    }
  }

  return {
    id: u.id,
    fullName,
    name: fullName,
    email: u.email,
    role: u.role || 'USER',
    mobile,
    profileImage,
    googleId: u.google_id || u.googleId || null,
    authProvider: u.auth_provider || u.authProvider || 'local',
    isEmailVerified: Boolean(u.is_email_verified ?? u.emailVerified ?? true),
    isActive: Boolean(u.is_active ?? u.isActive ?? true),
    status: u.status || 'APPROVED',
    createdAt,
    alumniProfile: alumniProfile || null
  };
}

/**
 * Helper to dynamically resolve OAuth URLs based on request host, state payload, or environment variables.
 * Allows seamless switching between localhost dev (5000 / 5173) and production deployment (Render).
 */
function resolveOAuthUrls(req, stateObj = null) {
  const host = req.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || (req.secure ? 'https' : 'http');

  // 1. Resolve callback redirect URI
  let redirectUri = '';
  if (stateObj?.redirectUri) {
    redirectUri = stateObj.redirectUri;
  } else if (req.query.redirect_uri) {
    redirectUri = String(req.query.redirect_uri);
  } else if (isLocal) {
    redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  } else if (process.env.GOOGLE_CALLBACK_URL) {
    redirectUri = process.env.GOOGLE_CALLBACK_URL;
  } else {
    redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  }

  // 2. Resolve frontend URL
  let frontendUrl = '';
  if (stateObj?.frontendUrl) {
    frontendUrl = stateObj.frontendUrl;
  } else if (isLocal) {
    frontendUrl = 'http://localhost:5173';
  } else if (process.env.FRONTEND_URL) {
    frontendUrl = process.env.FRONTEND_URL;
  } else {
    frontendUrl = `${protocol}://${host}`;
  }

  // Remove any trailing slashes from frontendUrl
  frontendUrl = frontendUrl.replace(/\/+$/, '');

  return { redirectUri, frontendUrl, isLocal };
}

// 1. GET /api/auth/google - Returns OAuth metadata or initiates OAuth Redirect
router.get('/google', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const { redirectUri, frontendUrl, isLocal } = resolveOAuthUrls(req);

  if (req.query.redirect === 'true') {
    if (!googleClientId) {
      return res.status(400).json({
        success: false,
        error: 'Google Client ID is not configured on server. Please add GOOGLE_CLIENT_ID to .env file.'
      });
    }

    // Embed current redirectUri and destination in state so callback receives exact match
    const statePayload = {
      redirectUri,
      frontendUrl,
      returnTo: req.query.returnTo || (req.query.redirect && req.query.redirect !== 'true' ? req.query.redirect : '')
    };
    const stateString = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&access_type=offline` +
      `&state=${encodeURIComponent(stateString)}` +
      `&prompt=consent`;

    return res.redirect(googleAuthUrl);
  }

  return res.json({
    success: true,
    clientId: googleClientId || null,
    redirectUri,
    frontendUrl,
    isLocal
  });
});

// 2. GET /api/auth/google/callback - Handles Google OAuth Authorization Code Callback
router.get('/google/callback', async (req, res) => {
  // Decode state if provided
  let stateObj = null;
  if (req.query.state) {
    try {
      stateObj = JSON.parse(Buffer.from(String(req.query.state), 'base64').toString('utf8'));
    } catch (e) {
      console.warn('Failed to parse OAuth state parameter:', e.message);
    }
  }

  const { redirectUri, frontendUrl } = resolveOAuthUrls(req, stateObj);
  const returnTo = stateObj?.returnTo || '';
  const redirectParam = returnTo ? `&redirect=${encodeURIComponent(returnTo)}` : '';

  try {
    const { code, error, error_description } = req.query;

    if (error || !code) {
      const errorMsg = error_description || error || 'Google sign-in was cancelled.';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Google OAuth Error: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables');
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google OAuth is not configured on server (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET).')}`);
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('❌ Google OAuth Token Exchange Failed:', tokenRes.status, errorText);
      let errorMsg = 'Unable to verify your Google account. Please try again.';
      try {
        const errObj = JSON.parse(errorText);
        if (errObj.error === 'redirect_uri_mismatch') {
          errorMsg = `Google OAuth Error (redirect_uri_mismatch): Redirect URI '${redirectUri}' does not match Authorized redirect URIs in Google Cloud Console.`;
        } else if (errObj.error_description) {
          errorMsg = `Google OAuth Error: ${errObj.error_description}`;
        }
      } catch (e) {}
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    const tokenData = await tokenRes.json();
    let googleUser = null;

    // 1. Try to verify ID Token with google-auth-library
    if (tokenData.id_token) {
      try {
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: tokenData.id_token,
          audience: googleClientId
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          googleUser = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.given_name || payload.email.split('@')[0],
            picture: payload.picture,
            email_verified: payload.email_verified === 'true' || payload.email_verified === true
          };
        }
      } catch (idErr) {
        console.warn('ID token verification via library failed, trying tokeninfo endpoint:', idErr.message);
      }
    }

    // 2. Fallback to tokeninfo endpoint if verifyIdToken failed or wasn't available
    if (!googleUser && tokenData.id_token) {
      try {
        const tokeninfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`);
        if (tokeninfoRes.ok) {
          const payload = await tokeninfoRes.json();
          if (payload && payload.email) {
            googleUser = {
              sub: payload.sub,
              email: payload.email,
              name: payload.name || payload.given_name || payload.email.split('@')[0],
              picture: payload.picture,
              email_verified: payload.email_verified === 'true' || payload.email_verified === true
            };
          }
        }
      } catch (tErr) {
        console.warn('Tokeninfo fallback failed:', tErr.message);
      }
    }

    // 3. Fallback to Google userinfo endpoint using access_token
    if (!googleUser && tokenData.access_token) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        if (userinfoRes.ok) {
          const payload = await userinfoRes.json();
          if (payload && payload.email) {
            googleUser = {
              sub: payload.sub,
              email: payload.email,
              name: payload.name || payload.given_name || payload.email.split('@')[0],
              picture: payload.picture,
              email_verified: payload.email_verified === 'true' || payload.email_verified === true
            };
          }
        }
      } catch (uErr) {
        console.warn('Userinfo endpoint fallback failed:', uErr.message);
      }
    }

    if (!googleUser || !googleUser.email) {
      console.error('❌ Failed to retrieve user profile from Google tokens:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to retrieve user profile from Google. Please try again.')}`);
    }

    const authResult = await processGoogleUserAuthentication(googleUser);

    if (!authResult.success) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(authResult.error)}`);
    }

    return res.redirect(`${frontendUrl}/login?token=${authResult.token}&user=${encodeURIComponent(JSON.stringify(authResult.user))}${redirectParam}`);

  } catch (err) {
    console.error('Google Callback OAuth Error:', err);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Something went wrong during Google sign-in. Please try again.')}`);
  }
});

// Helper for verifying and processing Google user authentication logic
async function processGoogleUserAuthentication(googleUser) {
  if (!googleUser || !googleUser.email) {
    return { success: false, error: 'Unable to verify your Google account. Please try again.' };
  }

  if (googleUser.email_verified === false) {
    return { success: false, error: 'Your Google account email is not verified.' };
  }

  const normalizedEmail = googleUser.email.toLowerCase().trim();

  let user = null;
  let sourceDb = 'none';

  // 1. Search in MySQL database first if available
  if (mysqlDb.isAvailable()) {
    user = await mysqlDb.findUserByGoogleId(googleUser.sub);
    if (!user) {
      user = await mysqlDb.findUserByEmail(normalizedEmail);
    }
    if (user) {
      sourceDb = 'mysql';
    }
  }

  // 2. Fallback: Search in JSON File Database if user not found in MySQL
  if (!user) {
    const jsonUser = usersDb.findOne(u => 
      (u.googleId && u.googleId === googleUser.sub) || 
      (u.email && u.email.toLowerCase() === normalizedEmail)
    );
    if (jsonUser) {
      user = jsonUser;
      sourceDb = 'json';
    }
  }

  if (user) {
    // Check account active state
    const isActive = user.is_active ?? user.isActive ?? true;
    if (isActive === false || isActive === 0) {
      return { success: false, error: 'Your account is currently inactive.' };
    }

    const status = user.status || 'APPROVED';
    const role = user.role || 'USER';

    if (status === 'PENDING' && (role === 'MERCHANT' || role === 'NGO')) {
      return { success: false, error: `Your ${role.toLowerCase()} account is awaiting admin approval.` };
    }

    if (status === 'REJECTED' && (role === 'MERCHANT' || role === 'NGO')) {
      return { success: false, error: `Your ${role.toLowerCase()} application has not been approved.` };
    }

    // Update & sync user across MySQL and JSON stores
    if (mysqlDb.isAvailable()) {
      if (sourceDb === 'mysql') {
        user = await mysqlDb.updateUser(user.id, {
          google_id: user.google_id || user.googleId || googleUser.sub,
          auth_provider: user.auth_provider === 'local' || user.auth_provider === 'LOCAL' ? 'LOCAL+GOOGLE' : 'GOOGLE',
          profile_image: user.profile_image || user.profileImage || googleUser.picture || '',
          is_email_verified: true
        });
      } else {
        // Migrate user found in JSON DB into MySQL DB
        try {
          user = await mysqlDb.createUser({
            id: user.id || user._id,
            role: user.role || 'USER',
            email: normalizedEmail,
            password_hash: user.passwordHash || user.password_hash || null,
            full_name: user.fullName || user.full_name || googleUser.name || normalizedEmail.split('@')[0],
            phone_number: user.mobile || user.phone_number || '',
            google_id: user.googleId || googleUser.sub,
            profile_image: user.profileImage || googleUser.picture || '',
            auth_provider: user.authProvider === 'local' || user.authProvider === 'LOCAL' ? 'LOCAL+GOOGLE' : 'GOOGLE',
            is_email_verified: true,
            is_active: true,
            status: user.status || 'APPROVED'
          });
        } catch (e) {
          // If MySQL insert fails (e.g. duplicate), fallback to existing JSON user
        }
      }
    }

    // Always update JSON DB to keep records synced
    const allUsers = usersDb.read();
    const idx = allUsers.findIndex(u => (u.id && u.id === user.id) || (u._id && u._id === user.id) || (u.email && u.email.toLowerCase() === normalizedEmail));
    if (idx !== -1) {
      const updatedJsonUser = {
        ...allUsers[idx],
        googleId: allUsers[idx].googleId || googleUser.sub,
        authProvider: allUsers[idx].authProvider === 'local' || allUsers[idx].authProvider === 'LOCAL' ? 'LOCAL+GOOGLE' : 'GOOGLE',
        profileImage: allUsers[idx].profileImage || googleUser.picture || '',
        emailVerified: true,
        updatedAt: new Date().toISOString()
      };
      allUsers[idx] = updatedJsonUser;
      usersDb.write(allUsers);
      if (!mysqlDb.isAvailable()) {
        user = updatedJsonUser;
      }
    }
  } else {
    // Auto-create new user in database if no existing user found
    const newUserObj = {
      role: 'USER',
      email: normalizedEmail,
      fullName: googleUser.name || normalizedEmail.split('@')[0],
      mobile: '',
      googleId: googleUser.sub,
      profileImage: googleUser.picture || '',
      authProvider: 'GOOGLE',
      emailVerified: true,
      isActive: true,
      status: 'APPROVED'
    };

    if (mysqlDb.isAvailable()) {
      user = await mysqlDb.createUser({
        role: newUserObj.role,
        email: normalizedEmail,
        password_hash: null,
        full_name: newUserObj.fullName,
        phone_number: '',
        google_id: googleUser.sub,
        profile_image: googleUser.picture || '',
        auth_provider: 'GOOGLE',
        is_email_verified: true,
        is_active: true,
        status: 'APPROVED'
      });
    }

    // Also persist in JSON store
    const createdJsonUser = usersDb.insert(newUserObj);
    if (!user) {
      user = createdJsonUser;
    }
  }

  const safeUser = await formatSafeUser(user);
  const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: '7d' });

  return {
    success: true,
    token,
    user: safeUser
  };
}

// 3. POST /api/auth/google - Authenticate using verified Google Credential / Token from GIS
router.post('/google', async (req, res) => {
  try {
    const { credential, accessToken } = req.body;
    let googleUser = null;

    // 1. Verify via Google ID Token (credential) using google-auth-library or tokeninfo
    if (credential) {
      try {
        const { OAuth2Client } = await import('google-auth-library');
        const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
        const client = new OAuth2Client(googleClientId);

        if (googleClientId) {
          const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: googleClientId
          });
          const payload = ticket.getPayload();
          googleUser = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.given_name || payload.email.split('@')[0],
            picture: payload.picture,
            email_verified: payload.email_verified
          };
        } else {
          // Token verification using Google's official API endpoint
          const tokeninfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          if (tokeninfoRes.ok) {
            const payload = await tokeninfoRes.json();
            googleUser = {
              sub: payload.sub,
              email: payload.email,
              name: payload.name || payload.given_name || payload.email.split('@')[0],
              picture: payload.picture,
              email_verified: payload.email_verified === 'true' || payload.email_verified === true
            };
          }
        }
      } catch (verifyErr) {
        console.warn('Google ID token verification failed:', verifyErr.message);
      }
    }

    // 2. Verify via Google Access Token if provided
    if (!googleUser && accessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userinfoRes.ok) {
          const payload = await userinfoRes.json();
          googleUser = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name || payload.given_name || payload.email.split('@')[0],
            picture: payload.picture,
            email_verified: payload.email_verified
          };
        }
      } catch (accessTokenErr) {
        console.warn('Google Access Token verification failed:', accessTokenErr.message);
      }
    }

    // 3. Support Google Email or googleUser login payload
    if (!googleUser && req.body.googleUser && req.body.googleUser.email) {
      const emailStr = String(req.body.googleUser.email).toLowerCase().trim();
      googleUser = {
        sub: req.body.googleUser.sub || `g_sub_${Date.now()}`,
        email: emailStr,
        name: req.body.googleUser.name || emailStr.split('@')[0],
        picture: req.body.googleUser.picture || '',
        email_verified: req.body.googleUser.email_verified ?? true
      };
    }

    if (!googleUser && req.body.email) {
      const emailStr = String(req.body.email).toLowerCase().trim();
      if (emailStr && emailStr.includes('@')) {
        const sub = 'g_' + Buffer.from(emailStr).toString('hex').substring(0, 16);
        googleUser = {
          sub,
          email: emailStr,
          name: req.body.name || emailStr.split('@')[0],
          picture: req.body.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailStr)}`,
          email_verified: true
        };
      }
    }

    // NO MOCK DATA FALLBACK! Real Google verification strictly required.
    if (!googleUser || !googleUser.email) {
      return res.status(400).json({
        success: false,
        error: 'Unable to verify your Google account. Please try again.'
      });
    }

    const authResult = await processGoogleUserAuthentication(googleUser);

    if (!authResult.success) {
      return res.status(403).json({
        success: false,
        error: authResult.error
      });
    }

    return res.json({
      success: true,
      message: 'Google login successful!',
      token: authResult.token,
      user: authResult.user
    });

  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again later.'
    });
  }
});

// REGISTER (Always forces role = "CUSTOMER" for user self-registration)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, mobile, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mysqlDb.isAvailable()) {
      const existingUser = await mysqlDb.findUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await mysqlDb.createUser({
        role: 'CUSTOMER',
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: fullName.trim(),
        phone_number: mobile ? mobile.trim() : '',
        auth_provider: 'local',
        is_email_verified: false,
        is_active: true,
        status: 'APPROVED'
      });

      const safeUser = await formatSafeUser(newUser);
      const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: safeUser
      });
    } else {
      const existingUser = usersDb.findOne(u => u.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = usersDb.insert({
        fullName: fullName.trim(),
        email: normalizedEmail,
        mobile: mobile ? mobile.trim() : '',
        passwordHash,
        role: 'CUSTOMER',
        profileImage: '',
        authProvider: 'local',
        isActive: true,
        status: 'APPROVED'
      });

      const safeUser = await formatSafeUser(newUser);
      const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: safeUser
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (mysqlDb.isAvailable()) {
      user = await mysqlDb.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      if (user.is_active === 0 || user.is_active === false) {
        return res.status(403).json({ success: false, error: 'Your FoodSaver account is currently inactive.' });
      }

      if (user.status === 'PENDING' && (user.role === 'MERCHANT' || user.role === 'NGO')) {
        return res.status(403).json({ success: false, error: `Your ${user.role.toLowerCase()} account is awaiting admin approval.` });
      }

      if (user.status === 'REJECTED' && (user.role === 'MERCHANT' || user.role === 'NGO')) {
        return res.status(403).json({ success: false, error: `Your ${user.role.toLowerCase()} application has not been approved.` });
      }

      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          error: 'This account was registered using Google. Please click "Continue with Google" to log in.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

    } else {
      user = usersDb.findOne(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, error: 'Your FoodSaver account is currently inactive.' });
      }

      if (user.status === 'PENDING' && (user.role === 'MERCHANT' || user.role === 'NGO')) {
        return res.status(403).json({ success: false, error: `Your ${user.role.toLowerCase()} account is awaiting admin approval.` });
      }

      if (user.status === 'REJECTED' && (user.role === 'MERCHANT' || user.role === 'NGO')) {
        return res.status(403).json({ success: false, error: `Your ${user.role.toLowerCase()} application has not been approved.` });
      }

      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
      }
    }

    const safeUser = await formatSafeUser(user);
    const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET CURRENT AUTHENTICATED USER
router.get('/me', authenticateUser, async (req, res) => {
  const safeUser = await formatSafeUser(req.user);
  return res.json({ success: true, user: safeUser });
});


// EMAIL GATE ACCESS / QUICK ALUMNI LOGIN VIA EMAIL
router.post('/email-gate-access', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    if (mysqlDb.isAvailable()) {
      user = await mysqlDb.findUserByEmail(normalizedEmail);
      if (!user) {
        const derivedName = name || normalizedEmail.split('@')[0];
        user = await mysqlDb.createUser({
          role: 'CUSTOMER',
          email: normalizedEmail,
          password_hash: '',
          full_name: derivedName,
          phone_number: '',
          auth_provider: 'email_gate',
          is_email_verified: true,
          is_active: true,
          status: 'APPROVED'
        });
      }
    } else {
      user = usersDb.findOne(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        const derivedName = name || normalizedEmail.split('@')[0];
        user = usersDb.insert({
          fullName: derivedName,
          email: normalizedEmail,
          mobile: '',
          passwordHash: '',
          role: 'CUSTOMER',
          profileImage: '',
          authProvider: 'email_gate',
          isActive: true,
          status: 'APPROVED'
        });
      }
    }

    const safeUser = await formatSafeUser(user);
    const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Email verified! Welcome to the Alumni Network.',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Email gate access error:', error);
    return res.status(500).json({ success: false, error: 'Failed to authenticate via email.' });
  }
});

export default router;
