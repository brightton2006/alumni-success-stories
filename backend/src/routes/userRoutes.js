import express from 'express';
import { usersDb, membersDb } from '../db.js';
import { mysqlDb } from '../mysql.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

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
    role: u.role || 'CUSTOMER',
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

// GET CURRENT USER PROFILE
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    let user = null;

    if (mysqlDb.isAvailable()) {
      user = await mysqlDb.findUserById(req.user.id);
    }
    if (!user) {
      user = usersDb.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const safeUser = await formatSafeUser(user);

    return res.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, error: 'Server error retrieving user profile.' });
  }
});

// UPDATE USER PROFILE
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { fullName, mobile, profileImage } = req.body;
    let updatedUser = null;

    if (mysqlDb.isAvailable()) {
      const updates = {};
      if (fullName !== undefined && fullName.trim() !== '') updates.full_name = fullName.trim();
      if (mobile !== undefined) updates.phone_number = mobile.trim();
      if (profileImage !== undefined) updates.profile_image = profileImage;

      updatedUser = await mysqlDb.updateUser(req.user.id, updates);
    } else {
      const updates = {};
      if (fullName !== undefined && fullName.trim() !== '') updates.fullName = fullName.trim();
      if (mobile !== undefined) updates.mobile = mobile.trim();
      if (profileImage !== undefined) updates.profileImage = profileImage;

      updatedUser = usersDb.updateById(req.user.id, updates);
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const safeUser = await formatSafeUser(updatedUser);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Server error updating user profile.' });
  }
});

export default router;
