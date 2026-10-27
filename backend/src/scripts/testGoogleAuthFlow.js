import fetch from 'node-fetch';
import { usersDb } from '../db.js';

const API_BASE = 'http://localhost:5000/api';

async function runGoogleAuthTests() {
  console.log('🧪 Starting Google OAuth & Auth Flow Integration Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ TEST ${total} FAILED: ${message}`);
    }
  }

  try {
    // TEST 1: Local Email/Password Login
    const localLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@successstory.com', password: 'user123' })
    });
    const localLoginData = await localLoginRes.json();
    assert(localLoginRes.ok && localLoginData.token && localLoginData.user.email === 'user@successstory.com', 'Existing local email/password login works normally');

    // TEST 2: Google Authentication - New Google User Creation
    const newGoogleEmail = `google_user_${Date.now()}@gmail.com`;
    const googleLoginRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleUser: {
          sub: `g_sub_${Date.now()}`,
          email: newGoogleEmail,
          name: 'Sarah Connor',
          picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
        }
      })
    });
    const googleLoginData = await googleLoginRes.json();
    assert(googleLoginRes.ok && googleLoginData.token && googleLoginData.user.email === newGoogleEmail, 'Google login successfully creates/logs in new Google user');

    // TEST 3: New Google User Role Security
    assert(googleLoginData.user.role === 'USER', 'New Google account is assigned role "USER"');

    // TEST 4: Database Storage Verification
    const dbUser = usersDb.findOne(u => u.email === newGoogleEmail);
    assert(
      dbUser &&
      dbUser.authProvider === 'GOOGLE' &&
      dbUser.googleId &&
      dbUser.emailVerified === true &&
      dbUser.fullName === 'Sarah Connor',
      'User data correctly stored in database with authProvider, googleId, emailVerified'
    );

    // TEST 5: Existing Account Linking (No Duplicate Account)
    const countBefore = usersDb.count();
    const linkRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleUser: {
          sub: 'g_sub_existing_user',
          email: 'user@successstory.com',
          name: 'Alex Morgan',
          picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
        }
      })
    });
    const linkData = await linkRes.json();
    const countAfter = usersDb.count();
    assert(linkRes.ok && countBefore === countAfter, 'Linking Google auth to existing local email creates NO duplicate account');

    // TEST 6: Linked Account History Preservation
    assert(linkData.user.email === 'user@successstory.com' && linkData.user.googleId === 'g_sub_existing_user', 'Existing user ID and profile data preserved upon Google linking');

    // TEST 7: Role Escalation Prevention (Google Login can NEVER elevate to ADMIN)
    const adminLinkRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleUser: {
          sub: 'g_sub_admin_attempt',
          email: newGoogleEmail,
          name: 'Sarah Connor',
          role: 'ADMIN' // Malicious client attempt
        }
      })
    });
    const adminLinkData = await adminLinkRes.json();
    assert(adminLinkData.user.role === 'USER', 'Client-side role parameter is ignored; Google accounts remain "USER"');

    // TEST 8: Session Token & GET /api/auth/me Verification
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${googleLoginData.token}` }
    });
    const meData = await meRes.json();
    assert(meRes.ok && meData.user.email === newGoogleEmail, 'JWT session token enables session restoration via GET /api/auth/me');

    // TEST 9: Invalid/Empty Google Token Handling
    const invalidRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(invalidRes.status === 400, 'Empty/invalid Google request safely rejected with 400 HTTP status');

    // TEST 10: Deactivated Account Check
    const deactivatedUser = usersDb.insert({
      fullName: 'Deactivated User',
      email: 'deactivated@example.com',
      passwordHash: 'dummy',
      role: 'USER',
      isActive: false
    });
    const deactRes = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleUser: {
          sub: 'g_sub_deact',
          email: 'deactivated@example.com'
        }
      })
    });
    assert(deactRes.status === 403, 'Deactivated accounts blocked with 403 Forbidden status on Google login');

    // TEST 11: GET /api/auth/google metadata & redirect URI resolution
    const metaRes = await fetch(`${API_BASE}/auth/google`);
    const metaData = await metaRes.json();
    assert(metaRes.ok && metaData.success && metaData.redirectUri.includes('/api/auth/google/callback'), 'GET /api/auth/google returns active client config & callback URI');

    // TEST 12: GET /api/auth/google/callback cancelled error handling
    const cancelRes = await fetch(`${API_BASE}/auth/google/callback?error=access_denied`, { redirect: 'manual' });
    const redirectLocation = cancelRes.headers.get('location') || '';
    assert(cancelRes.status >= 300 && cancelRes.status < 400 && redirectLocation.includes('/login?error='), 'OAuth callback cancellation redirects cleanly to /login with error query');

    // TEST 13: GET /api/auth/google/callback missing code handling
    const noCodeRes = await fetch(`${API_BASE}/auth/google/callback`, { redirect: 'manual' });
    const noCodeLocation = noCodeRes.headers.get('location') || '';
    assert(noCodeRes.status >= 300 && noCodeRes.status < 400 && noCodeLocation.includes('/login?error='), 'OAuth callback without code safely redirects to /login with error');

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log(`========================================\n`);

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runGoogleAuthTests();
