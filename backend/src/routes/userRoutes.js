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
  
  const designation = u.designation || (alumniProfile?.workDetails?.[0]?.position) || 'Alumni Member';
  const organization = u.organization || u.company || (alumniProfile?.workDetails?.[0]?.company) || '';
  const department = u.department || u.stream || (alumniProfile?.educationDetails?.[0]?.stream || alumniProfile?.educationDetails?.[0]?.course) || '';
  const graduationYear = u.graduation_year || u.graduationYear || (alumniProfile?.educationDetails?.[0]?.endYear ? parseInt(alumniProfile.educationDetails[0].endYear) : null);
  const location = u.location || (alumniProfile?.contactDetails?.currentLocation?.city ? `${alumniProfile.contactDetails.currentLocation.city}, ${alumniProfile.contactDetails.currentLocation.country || ''}`.replace(/,\s*$/, '') : '');
  const bio = u.bio || '';
  const contactPrivacy = u.contact_privacy || u.contactPrivacy || 'SHOW_ALL';
  
  let achievements = [];
  try {
    if (u.achievements) {
      achievements = typeof u.achievements === 'string' ? JSON.parse(u.achievements) : u.achievements;
    }
  } catch (e) {}

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
    designation,
    organization,
    company: organization,
    department,
    stream: department,
    graduationYear,
    location,
    bio,
    contactPrivacy,
    achievements,
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
    const {
      fullName,
      mobile,
      profileImage,
      designation,
      organization,
      company,
      department,
      stream,
      graduationYear,
      location,
      bio,
      contactPrivacy,
      achievements
    } = req.body;

    let updatedUser = null;

    const payload = {
      full_name: fullName !== undefined ? fullName.trim() : undefined,
      fullName: fullName !== undefined ? fullName.trim() : undefined,
      phone_number: mobile !== undefined ? mobile.trim() : undefined,
      mobile: mobile !== undefined ? mobile.trim() : undefined,
      profile_image: profileImage !== undefined ? profileImage : undefined,
      profileImage: profileImage !== undefined ? profileImage : undefined,
      designation: designation !== undefined ? designation.trim() : undefined,
      organization: (organization || company) !== undefined ? (organization || company).trim() : undefined,
      department: (department || stream) !== undefined ? (department || stream).trim() : undefined,
      graduation_year: graduationYear !== undefined ? parseInt(graduationYear) || null : undefined,
      graduationYear: graduationYear !== undefined ? parseInt(graduationYear) || null : undefined,
      location: location !== undefined ? location.trim() : undefined,
      bio: bio !== undefined ? bio.trim() : undefined,
      contact_privacy: contactPrivacy !== undefined ? contactPrivacy : undefined,
      contactPrivacy: contactPrivacy !== undefined ? contactPrivacy : undefined,
      achievements: achievements !== undefined ? achievements : undefined
    };

    // Remove undefined values
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    if (mysqlDb.isAvailable()) {
      updatedUser = await mysqlDb.updateUser(req.user.id, payload);
    }
    if (!updatedUser) {
      updatedUser = usersDb.updateById(req.user.id, payload);
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
