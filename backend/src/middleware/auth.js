import jwt from 'jsonwebtoken';
import { usersDb } from '../db.js';
import { mysqlDb } from '../mysql.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'successstory_jwt_secret_key_2026_prod';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required. Missing or invalid token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;

    if (mysqlDb.isAvailable()) {
      user = await mysqlDb.findUserById(decoded.id);
      if (user) {
        // Map database fields to standard camelCase properties
        user = {
          id: user.id,
          role: user.role,
          email: user.email,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          googleId: user.google_id,
          profileImage: user.profile_image,
          authProvider: user.auth_provider,
          isEmailVerified: Boolean(user.is_email_verified),
          isActive: Boolean(user.is_active),
          status: user.status
        };
      }
    }

    if (!user) {
      user = usersDb.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'User account not found.' });
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

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied. You do not have administrator permissions.',
      code: 'ADMIN_ONLY'
    });
  }

  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. ${req.user.role} role does not have permission for this resource.`
      });
    }

    next();
  };
};
