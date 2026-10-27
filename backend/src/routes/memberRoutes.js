import express from 'express';
import { membersDb } from '../db.js';
import { mysqlDb } from '../mysql.js';
import { toPublicMemberRecord } from '../models/Member.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/members/filters
 * Returns available search filter options for frontend dropdowns
 */
router.get('/filters', async (req, res) => {
  try {
    if (mysqlDb.isAvailable()) {
      const filters = await mysqlDb.getMemberFilterOptions();
      return res.json({
        success: true,
        filters
      });
    }

    // Fallback: JSON Store
    const members = membersDb.read();

    const streamMap = new Map();
    const yearMap = new Map();
    const courseMap = new Map();
    const cityMap = new Map();
    const companyMap = new Map();

    members.forEach(m => {
      const sh = m.searchHelper || {};
      
      if (sh.stream) {
        streamMap.set(sh.stream, (streamMap.get(sh.stream) || 0) + 1);
      }
      if (sh.endYear) {
        yearMap.set(sh.endYear, (yearMap.get(sh.endYear) || 0) + 1);
      }
      if (sh.course) {
        courseMap.set(sh.course, (courseMap.get(sh.course) || 0) + 1);
      }
      if (sh.city && sh.city !== 'Unknown') {
        cityMap.set(sh.city, (cityMap.get(sh.city) || 0) + 1);
      }
      if (sh.company && sh.company !== 'Not Specified') {
        companyMap.set(sh.company, (companyMap.get(sh.company) || 0) + 1);
      }
    });

    const streams = Array.from(streamMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const graduationYears = Array.from(yearMap.keys())
      .filter(y => typeof y === 'number' && y > 1950 && y <= 2035)
      .sort((a, b) => b - a);

    const courses = Array.from(courseMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const cities = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    const companies = Array.from(companyMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    return res.json({
      success: true,
      filters: {
        streams,
        graduationYears,
        courses,
        cities,
        companies
      }
    });
  } catch (err) {
    console.error('Error fetching member filters:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch member filters' });
  }
});

/**
 * GET /api/members
 * Search & Filter paginated member list
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));

    const search = req.query.search ? String(req.query.search).trim() : '';
    const stream = req.query.stream ? String(req.query.stream).trim() : '';
    const course = req.query.course ? String(req.query.course).trim() : '';
    const endYear = req.query.endYear || req.query.graduationYear ? parseInt(req.query.endYear || req.query.graduationYear) : null;
    const city = req.query.city || req.query.location ? String(req.query.city || req.query.location).trim() : '';
    const company = req.query.company ? String(req.query.company).trim() : '';
    const skill = req.query.skill || req.query.skills ? String(req.query.skill || req.query.skills).trim() : '';

    if (mysqlDb.isAvailable()) {
      const { total, rows } = await mysqlDb.getMembersFiltered({
        page, limit, search, stream, course, endYear, city, company, skill
      });
      const totalPages = Math.ceil(total / limit) || 1;

      const members = rows.map(r => ({
        id: String(r.member_id),
        _id: r.mongo_id || String(r.member_id),
        mongoId: r.mongo_id,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        gender: r.gender || '',
        course: r.course || '',
        stream: r.stream || '',
        institution: r.institution || '',
        graduationYear: parseInt(r.batch_year) || null,
        company: r.company || '',
        position: r.position || '',
        location: r.city && r.country ? `${r.city}, ${r.country}` : (r.city || r.country || ''),
        membershipStatus: r.membership_status || 'Approved',
        chapter: r.chapter || '',
        basic: {
          salutation: r.salutation || '',
          name: r.name || 'Alumni Member',
          email: r.email || '',
          gender: r.gender || '',
          label: r.course ? (r.stream ? `${r.course} • ${r.stream}` : r.course) : 'Alumni'
        },
        pictures: {
          profile: r.profile_url || '',
          thumb: r.thumbnail_url || r.profile_url || '',
          full: r.full_url || r.profile_url || ''
        },
        educationDetails: r.course || r.stream ? [
          {
            course: r.course || '',
            stream: r.stream || '',
            institution: r.institution || '',
            endYear: parseInt(r.batch_year) || null
          }
        ] : [],
        workDetails: r.company || r.position ? [
          {
            company: r.company || '',
            position: r.position || '',
            currentCompany: true
          }
        ] : [],
        contactDetails: {
          currentLocation: {
            city: r.city || '',
            country: r.country || ''
          }
        },
        searchHelper: {
          name: r.name,
          email: r.email,
          course: r.course || '',
          stream: r.stream || '',
          endYear: parseInt(r.batch_year) || null,
          city: r.city || '',
          company: r.company || '',
          position: r.position || ''
        }
      }));

      return res.json({
        success: true,
        members,
        total,
        page,
        limit,
        totalPages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    }

    // Fallback: JSON Store
    const allMembers = membersDb.read();

    const filtered = allMembers.filter(m => {
      const sh = m.searchHelper || {};

      if (search) {
        const matchesName = sh.name?.toLowerCase().includes(search.toLowerCase());
        const matchesEmail = sh.email?.toLowerCase().includes(search.toLowerCase());
        const matchesCourse = sh.course?.toLowerCase().includes(search.toLowerCase());
        const matchesStream = sh.stream?.toLowerCase().includes(search.toLowerCase());
        const matchesCompany = sh.company?.toLowerCase().includes(search.toLowerCase());
        const matchesPosition = sh.position?.toLowerCase().includes(search.toLowerCase());
        const matchesCity = sh.city?.toLowerCase().includes(search.toLowerCase());
        const matchesSkill = Array.isArray(sh.skills) && sh.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));

        if (!matchesName && !matchesEmail && !matchesCourse && !matchesStream && !matchesCompany && !matchesPosition && !matchesCity && !matchesSkill) {
          return false;
        }
      }

      if (stream && !sh.stream?.toLowerCase().includes(stream.toLowerCase())) return false;
      if (course && !sh.course?.toLowerCase().includes(course.toLowerCase())) return false;
      if (endYear && sh.endYear !== endYear) return false;
      if (city && !sh.city?.toLowerCase().includes(city.toLowerCase())) return false;
      if (company && !sh.company?.toLowerCase().includes(company.toLowerCase())) return false;

      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const publicMembers = paginated.map(toPublicMemberRecord);

    return res.json({
      success: true,
      members: publicMembers,
      total,
      page,
      limit,
      totalPages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error listing members:', err);
    return res.status(500).json({ success: false, error: 'Unable to load alumni data. Please try again.' });
  }
});

/**
 * GET /api/members/:id
 * Get single member details
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let member = null;

    if (mysqlDb.isAvailable()) {
      member = await mysqlDb.getMemberById(id);
    }
    if (!member) {
      member = membersDb.findById(id);
    }

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const publicMember = toPublicMemberRecord(member);

    return res.json({
      success: true,
      member: publicMember
    });
  } catch (err) {
    console.error('Error fetching member by id:', err);
    return res.status(500).json({ success: false, error: 'Unable to load alumni data. Please try again.' });
  }
});

/**
 * GET /api/admin/members/stats
 * Detailed admin stats on members dataset
 */
router.get('/admin/stats', authenticateUser, requireAdmin, (req, res) => {
  try {
    const members = membersDb.read();
    const total = members.length;
    let missingEmail = 0;
    let withWork = 0;
    let withEducation = 0;

    const streamCounts = {};
    members.forEach(m => {
      if (!m.basic?.email) missingEmail++;
      if (m.workDetails?.length > 0) withWork++;
      if (m.educationDetails?.length > 0) withEducation++;

      const s = m.searchHelper?.stream;
      if (s) streamCounts[s] = (streamCounts[s] || 0) + 1;
    });

    return res.json({
      success: true,
      stats: {
        totalMembers: total,
        missingEmailCount: missingEmail,
        withWorkExperienceCount: withWork,
        withEducationCount: withEducation,
        topStreams: Object.entries(streamCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    });
  } catch (err) {
    console.error('Error getting member stats:', err);
    return res.status(500).json({ success: false, error: 'Failed to get member stats' });
  }
});

/**
 * POST /api/admin/members/import
 * Admin endpoint to trigger dataset import
 */
router.post('/admin/import', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const summary = await runMemberImport();
    return res.json({
      success: true,
      message: 'Member import process triggered successfully.',
      summary
    });
  } catch (err) {
    console.error('Error running member import:', err);
    return res.status(500).json({ success: false, error: 'Member import failed' });
  }
});

export default router;
