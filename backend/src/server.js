import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load unified .env file from root (or local fallback)
const rootEnvPath = path.resolve(__dirname, '../../.env');
const localEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config({ path: localEnvPath });
}

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import publicStoryRoutes from './routes/publicStoryRoutes.js';
import userStoryRoutes from './routes/userStoryRoutes.js';
import adminStoryRoutes from './routes/adminStoryRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import realtimeRoutes from './routes/realtimeRoutes.js';
import { authenticateUser } from './middleware/auth.js';
import { seedDatabase } from './seed.js';
import { runMemberImport } from './scripts/importMembers.js';
import { initMySQLDatabase } from './mysql.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS & JSON parsing
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// IMAGE UPLOAD API (AUTHENTICATED USERS & ADMINS)
app.post('/api/upload', authenticateUser, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.json({ success: true, imageUrl, message: 'Image uploaded successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Image upload failed.' });
  }
});

import { decryptSSOToken } from 'vaave-sso-sdk';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth.js';
import { usersDb, membersDb } from './db.js';
import { mysqlDb } from './mysql.js';

// API Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', userStoryRoutes);
app.use('/api/stories', publicStoryRoutes);
app.use('/api/admin/stories', adminStoryRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', analyticsRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/alumni', memberRoutes);
app.use('/api/realtime', realtimeRoutes);

// Single Sign-On (SSO) User Lookup for Alumni Success Stories
app.get('/api/user-by-email', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query param is required' });
  }

  let cleanEmail = email;

  // 1. If SEED is configured, attempt vaave-sso-sdk token decryption
  if (process.env.SEED) {
    try {
      const decodedEmail = decodeURIComponent(email);
      const decrypted = await decryptSSOToken(decodedEmail, process.env.SEED);
      if (decrypted && decrypted.details) {
        cleanEmail = decrypted.details.email || decrypted.details.email_id || decrypted.details.sub || decodedEmail;
      }
    } catch (err) {
      console.warn('SSO token decryption warning:', err.message);
    }
  }

  // 2. If it's a base64 encoded email string, decode it
  if (typeof cleanEmail === 'string' && !cleanEmail.includes('@')) {
    try {
      const base64Decoded = Buffer.from(cleanEmail, 'base64').toString('utf8');
      if (base64Decoded.includes('@')) {
        cleanEmail = base64Decoded;
      }
    } catch (e) {}
  }

  cleanEmail = decodeURIComponent(cleanEmail).toLowerCase().trim();

  try {
    // 3. Lookup user in MySQL / MongoDB / JSON Store
    let foundMember = null;
    let foundUser = null;

    if (mysqlDb.isAvailable()) {
      try {
        foundMember = await mysqlDb.getMemberByEmail(cleanEmail);
        foundUser = await mysqlDb.findUserByEmail(cleanEmail);
      } catch (dbErr) {
        console.warn('MySQL lookup warning in user-by-email:', dbErr.message);
      }
    }

    if (!foundMember) {
      try {
        const allMembers = membersDb.read();
        foundMember = allMembers.find(m => {
          const e1 = m.basic?.email || m.basic?.email_id;
          const e2 = m.searchHelper?.email;
          return (e1 && e1.toLowerCase().trim() === cleanEmail) ||
                 (e2 && e2.toLowerCase().trim() === cleanEmail);
        }) || null;
      } catch (jsonErr) {}
    }

    if (!foundUser) {
      foundUser = usersDb.findOne(u => u.email && u.email.toLowerCase().trim() === cleanEmail);
    }

    // Determine Dashboard Role: Admin | Coordinator | Alumni
    let role = 'Alumni';
    const emailLower = cleanEmail.toLowerCase();
    if (foundUser?.role === 'ADMIN' || emailLower.includes('admin') || emailLower.startsWith('admin@')) {
      role = 'Admin';
    } else if (foundUser?.role === 'COORDINATOR' || emailLower.includes('coordinator') || emailLower.startsWith('coord@')) {
      role = 'Coordinator';
    } else if (foundMember?.workDetails?.some(w => w.position?.toLowerCase().includes('coordinator') || w.position?.toLowerCase().includes('director'))) {
      role = 'Coordinator';
    }

    // Format safe verified profile
    const name = foundMember?.basic?.name || foundUser?.fullName || cleanEmail.split('@')[0];
    const userPayload = {
      id: foundUser?.id || foundMember?.id || `usr_sso_${Date.now()}`,
      email: cleanEmail,
      fullName: name,
      name,
      role: role.toUpperCase(),
      dashboardRole: role,
      profileImage: foundMember?.pictures?.profile || foundUser?.profileImage || '',
      designation: foundMember?.workDetails?.[0]?.position || foundUser?.designation || 'Alumni Member',
      company: foundMember?.workDetails?.[0]?.company || foundUser?.company || 'NEC Alumni',
      department: foundMember?.educationDetails?.[0]?.department || foundUser?.department || 'Information Technology',
      graduationYear: foundMember?.educationDetails?.[0]?.endYear || foundUser?.graduationYear || 2024,
      basic: foundMember?.basic || {
        name,
        email_id: cleanEmail,
        mobile: foundUser?.mobile || ''
      },
      alumniProfile: foundMember
    };

    const token = jwt.sign(
      { id: userPayload.id, email: userPayload.email, role: userPayload.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      role,
      user: userPayload,
      ...userPayload
    });
  } catch (err) {
    console.error('❌ DB Error in /api/user-by-email:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Success Story API', time: new Date().toISOString() });
});

// Serve frontend dist bundle in production if built
const distDir = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: 'SERVER_ERROR'
  });
});

// Start Server and Seed Database
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Success Story Backend Server running on http://0.0.0.0:${PORT} (listening on all interfaces)`);
  await initMySQLDatabase();
  await seedDatabase();
  await runMemberImport();
});

