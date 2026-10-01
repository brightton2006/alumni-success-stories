import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

