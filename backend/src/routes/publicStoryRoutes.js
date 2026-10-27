import express from 'express';
import jwt from 'jsonwebtoken';
import { storiesDb, commentsDb, reactionsDb } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

/**
 * Optional auth: attaches req.user if a valid Bearer token is present.
 * Does NOT reject the request when the token is missing or invalid.
 */
const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // at minimum contains { id, ... }
    }
  } catch (_err) {
    // Token invalid / expired — treat as unauthenticated
    req.user = null;
  }
  next();
};

function getBatchSuffix(batchOrYear) {
  if (!batchOrYear) return '';
  const str = String(batchOrYear).trim();
  const digits = str.match(/\d+/);
  if (!digits) return str;
  const num = digits[0];
  if (num.length === 4) {
    return num.slice(-2); // e.g. 2026 -> 26, 2024 -> 24
  }
  return num;
}

export function formatBatchAlumniName(story) {
  if (!story) return 'Batch - 26 Alumni';
  const batchCandidate = story.batchNumber || story.batchYear || story.batch || story.graduationYear;
  if (batchCandidate) {
    const suffix = getBatchSuffix(batchCandidate);
    return suffix ? `Batch - ${suffix} Alumni` : 'Batch Alumni';
  }
  // Try to extract year from narrative or metadata
  const textToScan = `${story.storyTitle || ''} ${story.fullStory || ''} ${story.shortSummary || ''}`;
  const yearMatch = textToScan.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    const yr = yearMatch[1];
    return `Batch - ${yr.slice(-2)} Alumni`;
  }
  return 'Batch - 26 Alumni';
}

// Helper to sanitize story identity for public consumption when showName === false
function sanitizeStoryForPublic(story) {
  if (!story) return null;
  const isNameHidden = story.showName === false;

  const batchAlumniName = formatBatchAlumniName(story);
  const displayPersonName = isNameHidden ? batchAlumniName : (story.personName || 'Featured Individual');
  const displayUserName = isNameHidden ? batchAlumniName : (story.submittedByUserName || story.personName || 'Featured Individual');
  const displayImage = isNameHidden ? '' : (story.personImage || '');

  // Deep clone to avoid mutating DB in memory
  let sanitized = JSON.parse(JSON.stringify(story));

  delete sanitized.submittedByUserEmail;
  delete sanitized.submittedByUserId;
  delete sanitized.authorAdminId;
  delete sanitized.rejectionReason;
  delete sanitized.adminFeedback;

  sanitized.personName = displayPersonName;
  sanitized.submittedByUserName = displayUserName;
  sanitized.personImage = displayImage;
  sanitized.showName = story.showName !== false;
  sanitized.batchDisplay = batchAlumniName;
  sanitized.role = story.role || story.profession || 'Alumni';
  sanitized.profession = story.profession || story.role || 'Alumni';
  sanitized.company = story.company || '';
  sanitized.department = story.department || story.stream || '';
  sanitized.isVerified = story.isVerified !== false;
  sanitized.storyRole = story.storyRole || 'GENERAL';

  if (isNameHidden) {
    const beneficiaryBatch = story.beneficiaryBatch || story.beneficiaryBatchYear || story.batchNumber || story.batchYear || story.batch;
    const beneficiarySuffix = getBatchSuffix(beneficiaryBatch);
    sanitized.beneficiaryName = story.beneficiaryName 
      ? (beneficiarySuffix ? `Batch - ${beneficiarySuffix} Alumni` : 'Batch Alumni') 
      : '';

    const supporterBatch = story.supporterBatch || story.supporterBatchYear || story.batchNumber || story.batchYear || story.batch;
    const supporterSuffix = getBatchSuffix(supporterBatch);
    sanitized.supporterName = story.supporterName 
      ? (supporterSuffix ? `Batch - ${supporterSuffix} Alumni` : 'Batch Alumni') 
      : '';

    const rawNames = [story.personName, story.submittedByUserName, story.beneficiaryName, story.supporterName];
    const nameTokens = [];
    rawNames.forEach(n => {
      if (n && typeof n === 'string') {
        nameTokens.push(n.trim());
        n.split(/\s+/).forEach(part => {
          if (part.length > 2) nameTokens.push(part.trim());
        });
      }
    });
    // Remove duplicates & sort longest first so full names replace before first names
    const namesToMask = Array.from(new Set(nameTokens)).sort((a, b) => b.length - a.length);

    const maskString = (str) => {
      if (typeof str !== 'string') return str;
      let res = str;
      namesToMask.forEach(name => {
        if (name && name.length > 2) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
          res = res.replace(regex, batchAlumniName);
        }
      });
      return res;
    };

    const maskObject = (obj) => {
      if (typeof obj === 'string') return maskString(obj);
      if (Array.isArray(obj)) return obj.map(maskObject);
      if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const key of Object.keys(obj)) {
          newObj[key] = maskObject(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    sanitized = maskObject(sanitized);

    if (sanitized.journeyMap) {
      sanitized.journeyMap.personName = batchAlumniName;
      if (sanitized.journeyMap.heroImage) sanitized.journeyMap.heroImage = '';
    }
    if (sanitized.aiExtractedElements) {
      sanitized.aiExtractedElements.person = batchAlumniName;
      if (sanitized.aiExtractedElements.profileImage) sanitized.aiExtractedElements.profileImage = '';
    }
    if (sanitized.aiMindMap && Array.isArray(sanitized.aiMindMap.nodes)) {
      sanitized.aiMindMap.nodes = sanitized.aiMindMap.nodes.map(node => {
        if (node.id === 'center-person' || node.type === 'personNode') {
          return {
            ...node,
            data: {
              ...node.data,
              name: batchAlumniName,
              image: ''
            }
          };
        }
        return node;
      });
    }
    if (sanitized.hierarchicalMindMap && sanitized.hierarchicalMindMap.person) {
      sanitized.hierarchicalMindMap.person.name = batchAlumniName;
      sanitized.hierarchicalMindMap.person.photo = '';
    }

    if (Array.isArray(sanitized.aiKeywords)) {
      sanitized.aiKeywords = sanitized.aiKeywords.filter(kw => {
        const word = typeof kw === 'string' ? kw : kw?.word;
        if (!word) return false;
        const wLower = word.toLowerCase();
        if (wLower === 'anonymous') return false;
        return !namesToMask.some(name => name && name.length > 2 && wLower.includes(name.toLowerCase()));
      });
    }
  }

  return sanitized;
}

// GET KEYWORD CLOUD DATA FROM PUBLISHED STORIES
router.get('/keywords/cloud', (req, res) => {
  try {
    const publishedStories = storiesDb.find(s => {
      if (s.status !== 'PUBLISHED') return false;
      const locs = Array.isArray(s.publicationLocations) ? s.publicationLocations : ['Success Stories'];
      return !locs.includes('Do Not Publish');
    });

    if (!publishedStories || publishedStories.length === 0) {
      return res.json({ success: true, keywords: [], totalStories: 0 });
    }

    const stopWords = new Set([
      'the', 'and', 'a', 'an', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'was', 'with', 'on', 'at', 'by', 'be', 'this',
      'which', 'or', 'from', 'has', 'had', 'have', 'were', 'been', 'their', 'they', 'his', 'her', 'she', 'he', 'more',
      'about', 'can', 'also', 'into', 'over', 'after', 'other', 'out', 'new', 'very', 'really', 'just', 'some', 'than',
      'them', 'these', 'those', 'then', 'there', 'when', 'where', 'who', 'whom', 'what', 'why', 'how', 'all', 'any',
      'both', 'each', 'few', 'most', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'too', 's', 't', 'will',
      'should', 'now', 'i', 'we', 'you', 'my', 'me', 'our', 'us', 'your', 'would', 'could', 'first', 'second', 'years',
      'year', 'time', 'day', 'days', 'made', 'make', 'well', 'way', 'going', 'getting', 'took', 'take', 'back', 'through',
      'another', 'around', 'became', 'become', 'becomes', 'being', 'better', 'build', 'built', 'called', 'come', 'came',
      'anonymous', 'story', 'stories'
    ]);

    // Comprehensive Keyword Canonical Normalization Map
    const canonicalMap = (term) => {
      if (!term || typeof term !== 'string') return '';
      const t = term.toUpperCase().trim();
      
      if (t.includes('PYTHON')) return 'PYTHON';
      if (t.includes('DATA ENGIN') || t.includes('DATA PIPELINE')) return 'DATA ENGINEERING';
      if (t === 'SQL' || t.includes('DATABASE') || t.includes('POSTGRES') || t.includes('MYSQL')) return 'SQL';
      if (t.includes('MACHINE LEARN') || t === 'ML' || t.includes('DEEP LEARN')) return 'MACHINE LEARNING';
      if (t.includes('ARTIFICIAL INTEL') || t === 'AI' || t.includes('AI-') || t.includes('GPT')) return 'ARTIFICIAL INTELLIGENCE';
      if (t.includes('REACT') || t.includes('FRONTEND')) return 'REACT';
      if (t.includes('AWS') || t.includes('CLOUD') || t.includes('AZURE')) return 'AWS & CLOUD';
      if (t.includes('DOCKER') || t.includes('CONTAINER')) return 'DOCKER';
      if (t.includes('SOLAR') || t.includes('CLEAN ENERGY') || t.includes('RENEWABLE') || t.includes('MICROGRID')) return 'CLEAN ENERGY & SOLAR';
      if (t.includes('LEADERSH') || t.includes('MANAGEMENT')) return 'LEADERSHIP';
      if (t.includes('INTERN')) return 'INTERNSHIP';
      if (t.includes('PLACEM')) return 'PLACEMENT';
      if (t.includes('PROJECT')) return 'PROJECT';
      if (t.includes('HACKATHON')) return 'HACKATHON';
      if (t.includes('UNICORN') || t.includes('ENTREPRENEUR') || t.includes('STARTUP') || t.includes('FOUNDER')) return 'ENTREPRENEURSHIP';
      if (t.includes('SCHOLARSHIP')) return 'SCHOLARSHIP';
      if (t.includes('AWARD') || t.includes('MEDAL') || t.includes('RECOGNIT')) return 'AWARDS & RECOGNITION';
      if (t.includes('COMMUNITY') || t.includes('RURAL') || t.includes('IMPACT')) return 'COMMUNITY IMPACT';
      if (t.includes('PERSEVER') || t.includes('RESILIEN') || t.includes('PERSIST')) return 'PERSEVERANCE & RESILIENCE';
      if (t.includes('OLYMPIC') || t.includes('MARATHON') || t.includes('ATHLET')) return 'OLYMPIC & ATHLETICS';
      if (t.includes('GITHUB') || t.includes('OPEN SOURCE')) return 'GITHUB & OPEN SOURCE';
      if (t.includes('TEAMWORK') || t.includes('COLLABORAT')) return 'TEAMWORK';
      if (t.includes('RESEARCH') || t.includes('DOCTORATE') || t.includes('ACADEMIC')) return 'RESEARCH';
      if (t.includes('CERTIF')) return 'CERTIFICATION';
      if (t.includes('PROBLEM SOLV')) return 'PROBLEM SOLVING';
      if (t.includes('CAREER') || t.includes('GROWTH')) return 'CAREER GROWTH';
      if (t.includes('CODEPULSE') || t.includes('SOFTWARE QUALITY') || t.includes('CODE')) return 'SOFTWARE DEVELOPMENT';
      if (t.includes('SUCCESS')) return 'SUCCESS';
      
      return t;
    };

    const categoryMap = (normalizedWord) => {
      const w = normalizedWord.toUpperCase();
      if (['PYTHON', 'SQL', 'MACHINE LEARNING', 'ARTIFICIAL INTELLIGENCE', 'REACT', 'AWS & CLOUD', 'DOCKER', 'CLEAN ENERGY & SOLAR', 'SOFTWARE DEVELOPMENT', 'GITHUB & OPEN SOURCE'].includes(w)) {
        return 'Skills & Technology';
      }
      if (['LEADERSHIP', 'TEAMWORK', 'PROBLEM SOLVING', 'PERSEVERANCE & RESILIENCE'].includes(w)) {
        return 'Personal & Soft Skills';
      }
      if (['ENTREPRENEURSHIP', 'PLACEMENT', 'INTERNSHIP', 'RESEARCH', 'CAREER GROWTH'].includes(w)) {
        return 'Career & Milestones';
      }
      if (['AWARDS & RECOGNITION', 'OLYMPIC & ATHLETICS', 'SCHOLARSHIP', 'SUCCESS'].includes(w)) {
        return 'Achievements & Awards';
      }
      if (['COMMUNITY IMPACT', 'PROJECT', 'HACKATHON'].includes(w)) {
        return 'Projects & Impact';
      }
      return 'Core Themes';
    };

    const keywordStore = {};

    publishedStories.forEach(rawStory => {
      const story = sanitizeStoryForPublic(rawStory);
      if (!story) return;

      const storyKeywords = new Set();

      if (Array.isArray(story.aiKeywords)) {
        story.aiKeywords.forEach(k => {
          const word = typeof k === 'string' ? k : k?.word;
          if (word && word.trim()) storyKeywords.add(word.trim());
        });
      }
      if (story.journeyMap && Array.isArray(story.journeyMap.highlights)) {
        story.journeyMap.highlights.forEach(h => {
          if (h && typeof h === 'string') storyKeywords.add(h.trim());
        });
      }

      const textToScan = `${story.storyTitle} ${story.category} ${story.shortSummary} ${story.fullStory || ''}`;
      const rawTokens = textToScan.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);

      rawTokens.forEach(token => {
        const lower = token.toLowerCase();
        if (lower.length > 3 && !stopWords.has(lower)) {
          storyKeywords.add(token);
        }
      });

      if (story.showName === false && story.personName) {
        const nameTokens = story.personName.toLowerCase().split(/\s+/);
        storyKeywords.forEach(kw => {
          if (nameTokens.some(nt => nt.length > 2 && kw.toLowerCase().includes(nt))) {
            storyKeywords.delete(kw);
          }
        });
      }

      const storySummaryCard = {
        id: story.id,
        storyTitle: story.storyTitle,
        personName: story.personName,
        profession: story.profession,
        location: story.location,
        category: story.category,
        shortSummary: story.shortSummary,
        personImage: story.personImage,
        showName: story.showName,
        publishedAt: story.publishedAt || story.createdAt,
        aiKeywords: Array.isArray(story.aiKeywords) ? story.aiKeywords.map(k => typeof k === 'string' ? k : k.word) : []
      };

      storyKeywords.forEach(rawKw => {
        const normalized = canonicalMap(rawKw);
        if (!normalized || normalized.length < 2 || stopWords.has(normalized.toLowerCase())) return;

        if (!keywordStore[normalized]) {
          keywordStore[normalized] = {
            text: normalized,
            rawText: rawKw,
            count: 0,
            storyIds: new Set(),
            categories: new Set([categoryMap(normalized)]),
            stories: []
          };
        }

        if (!keywordStore[normalized].storyIds.has(story.id)) {
          keywordStore[normalized].storyIds.add(story.id);
          keywordStore[normalized].count += 1;
          keywordStore[normalized].stories.push(storySummaryCard);
        }
      });
    });

    const keywordList = Object.values(keywordStore).map(item => ({
      text: item.text,
      count: item.count,
      categories: Array.from(item.categories),
      stories: item.stories
    }));

    keywordList.sort((a, b) => b.count - a.count);

    if (keywordList.length === 0) {
      return res.json({ success: true, keywords: [], totalStories: publishedStories.length });
    }

    const maxCount = keywordList[0].count || 1;
    const minCount = keywordList[keywordList.length - 1].count || 1;

    const processedKeywords = keywordList.map((kw, idx) => {
      let importanceScore = 50;
      if (maxCount === minCount) {
        importanceScore = Math.max(30, 95 - idx * 5);
      } else {
        importanceScore = Math.round(((kw.count - minCount) / (maxCount - minCount)) * 70 + 30);
      }

      let sizeCategory = 'medium';
      if (idx === 0 || importanceScore >= 85) {
        sizeCategory = 'hero';
      } else if (importanceScore >= 65) {
        sizeCategory = 'large';
      } else if (importanceScore >= 40) {
        sizeCategory = 'medium';
      } else {
        sizeCategory = 'small';
      }

      return {
        ...kw,
        importanceScore,
        sizeCategory
      };
    });

    return res.json({
      success: true,
      keywords: processedKeywords,
      totalStories: publishedStories.length
    });
  } catch (error) {
    console.error('Error generating keyword cloud:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate keyword cloud.' });
  }
});

// GET PUBLIC PUBLISHED STORIES (with search, category, location, graduationYear, department, industry, sort, pagination)
router.get('/', (req, res) => {
  try {
    const { search, category, location, graduationYear, department, industry, sort, page, limit } = req.query;

    // RULE: Public API must ONLY return status === 'PUBLISHED'
    let stories = storiesDb.find(s => s.status === 'PUBLISHED');

    // Location filtering
    if (location && location !== 'All') {
      stories = stories.filter(s => {
        const locs = Array.isArray(s.publicationLocations) ? s.publicationLocations : ['Success Stories'];
        if (locs.includes('Do Not Publish')) return false;
        return locs.some(l => l.toLowerCase() === location.toLowerCase());
      });
    } else {
      // Exclude any stories explicitly set to "Do Not Publish"
      stories = stories.filter(s => {
        const locs = Array.isArray(s.publicationLocations) ? s.publicationLocations : ['Success Stories'];
        return !locs.includes('Do Not Publish');
      });
    }

    // Filtering by category
    if (category && category !== 'All') {
      stories = stories.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }

    // Filtering by graduation year
    if (graduationYear && graduationYear !== 'All') {
      const gYrStr = String(graduationYear).trim();
      stories = stories.filter(s => {
        const bYr = String(s.batchYear || s.graduationYear || s.batchNumber || '').trim();
        return bYr === gYrStr || bYr.includes(gYrStr);
      });
    }

    // Filtering by department / stream
    if (department && department !== 'All') {
      const d = department.toLowerCase().trim();
      stories = stories.filter(s => {
        const dept = (s.department || s.stream || '').toLowerCase();
        return dept.includes(d);
      });
    }

    // Filtering by industry / company
    if (industry && industry !== 'All') {
      const ind = industry.toLowerCase().trim();
      stories = stories.filter(s => {
        const comp = (s.company || s.profession || s.role || '').toLowerCase();
        return comp.includes(ind);
      });
    }

    // Filtering by search term
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      stories = stories.filter(s => {
        const isHidden = s.showName === false;
        const titleMatch = s.storyTitle?.toLowerCase().includes(q);
        const nameMatch = !isHidden && s.personName?.toLowerCase().includes(q);
        const locMatch = s.location?.toLowerCase().includes(q);
        const summaryMatch = s.shortSummary?.toLowerCase().includes(q);
        const catMatch = s.category?.toLowerCase().includes(q);
        const companyMatch = s.company?.toLowerCase().includes(q);
        const deptMatch = s.department?.toLowerCase().includes(q);
        const keywordMatch = Array.isArray(s.aiKeywords) && s.aiKeywords.some(k => (typeof k === 'string' ? k : k?.word)?.toLowerCase().includes(q));

        return titleMatch || nameMatch || locMatch || summaryMatch || catMatch || companyMatch || deptMatch || keywordMatch;
      });
    }

    // Sorting
    if (sort === 'views') {
      stories.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'trending') {
      stories.sort((a, b) => ((b.views || 0) + (new Date(b.publishedAt).getTime() || 0)) - ((a.views || 0) + (new Date(a.publishedAt).getTime() || 0)));
    } else {
      // Default: Most recent
      stories.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
    }

    const total = stories.length;
    let paginatedStories = stories;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 12);
      const startIdx = (pageNum - 1) * limitNum;
      paginatedStories = stories.slice(startIdx, startIdx + limitNum);
    }

    // Return sanitized story cards
    const cardData = paginatedStories.map(s => {
      const sanitized = sanitizeStoryForPublic(s);
      return {
        id: sanitized.id,
        storyTitle: sanitized.storyTitle,
        personName: sanitized.personName,
        profession: sanitized.profession,
        role: sanitized.role || sanitized.profession,
        company: sanitized.company || '',
        department: sanitized.department || '',
        batchDisplay: sanitized.batchDisplay,
        location: sanitized.location,
        category: sanitized.category,
        shortSummary: sanitized.shortSummary,
        personImage: sanitized.personImage,
        showName: sanitized.showName,
        isVerified: sanitized.isVerified,
        publicationLocations: sanitized.publicationLocations || ['Success Stories'],
        publishedAt: sanitized.publishedAt || sanitized.createdAt,
        views: sanitized.views || 0,
        hasMindMap: Boolean(sanitized.aiMindMap && sanitized.aiMindMap.nodes?.length > 0)
      };
    });

    return res.json({
      success: true,
      stories: cardData,
      total,
      page: page ? parseInt(page) : 1,
      totalPages: limit ? Math.ceil(total / parseInt(limit)) : 1
    });
  } catch (error) {
    console.error('Error fetching public stories:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch published stories.' });
  }
});

// GET PUBLIC DASHBOARD STATS
router.get('/stats/summary', (req, res) => {
  try {
    const publishedStories = storiesDb.find(s => {
      if (s.status !== 'PUBLISHED') return false;
      const locs = Array.isArray(s.publicationLocations) ? s.publicationLocations : ['Success Stories'];
      return !locs.includes('Do Not Publish');
    });

    const totalSuccessStories = publishedStories.length;
    const verifiedSuccessStories = publishedStories.filter(s => s.isVerified !== false).length;
    const peopleFeatured = new Set(
      publishedStories.map(s => s.showName === false ? 'Anonymous' : s.personName)
    ).size;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSuccessStories = publishedStories.filter(s => {
      const d = new Date(s.publishedAt || s.createdAt).getTime();
      return !isNaN(d) && d >= thirtyDaysAgo;
    }).length || Math.min(totalSuccessStories, 5);

    const communitiesReached = new Set(publishedStories.map(s => s.location).filter(Boolean)).size || totalSuccessStories;
    const totalViews = publishedStories.reduce((sum, s) => sum + (s.views || 0), 0);

    return res.json({
      success: true,
      totalSuccessStories,
      verifiedSuccessStories,
      alumniFeatured: peopleFeatured,
      recentSuccessStories,
      storiesShared: totalSuccessStories,
      peopleFeatured: peopleFeatured,
      communitiesReached: communitiesReached,
      storiesInspiringChange: Math.max(totalSuccessStories, totalViews)
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load story statistics.' });
  }
});

// GET SINGLE PUBLISHED STORY BY ID
// Unauthenticated users receive only a one-line preview of the story.
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (story.status !== 'PUBLISHED') {
      return res.status(403).json({ success: false, error: 'This story is not yet published.' });
    }

    const locs = Array.isArray(story.publicationLocations) ? story.publicationLocations : ['Success Stories'];
    if (locs.includes('Do Not Publish')) {
      return res.status(403).json({ success: false, error: 'This story is not published.' });
    }

    const sanitized = sanitizeStoryForPublic(story);

    // If the user is NOT authenticated, return only a one-line preview
    if (!req.user) {
      const fullText = sanitized.fullStory || '';
      // Extract the first sentence (up to the first period/exclamation/question mark followed by a space, or the first 200 chars)
      const firstSentenceMatch = fullText.match(/^[^.!?]*[.!?]/);
      const previewText = firstSentenceMatch
        ? firstSentenceMatch[0].trim()
        : fullText.slice(0, 200).trim();

      const previewStory = {
        id: sanitized.id,
        storyTitle: sanitized.storyTitle,
        personName: sanitized.personName,
        profession: sanitized.profession,
        role: sanitized.role || sanitized.profession,
        company: sanitized.company || '',
        department: sanitized.department || '',
        batchDisplay: sanitized.batchDisplay,
        location: sanitized.location,
        category: sanitized.category,
        shortSummary: sanitized.shortSummary,
        personImage: sanitized.personImage,
        showName: sanitized.showName,
        isVerified: sanitized.isVerified,
        publicationLocations: sanitized.publicationLocations || ['Success Stories'],
        publishedAt: sanitized.publishedAt || sanitized.createdAt,
        views: sanitized.views || 0,
        reactions: sanitized.reactions,
        // Only the first sentence is sent — full content requires login
        fullStory: previewText,
        isPreview: true
      };

      return res.json({ success: true, story: previewStory, isPreview: true });
    }

    // Authenticated users get the full story
    return res.json({ success: true, story: sanitized });
  } catch (error) {
    console.error('Error fetching story:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve story.' });
  }
});

// DEDICATED VIEW COUNT INCREMENT ENDPOINT
router.post('/:id/view', (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (story.status === 'PUBLISHED') {
      const currentViews = (story.views || 0) + 1;
      storiesDb.updateById(id, { views: currentViews });
      return res.json({ success: true, views: currentViews });
    }

    return res.json({ success: true, views: story.views || 0 });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update view count.' });
  }
});


// GET STORY REACTIONS
router.get('/:id/reactions', (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);
    if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });

    const storyReactions = story.reactions || {
      inspiring: 12,
      love: 8,
      insightful: 15,
      clap: 24,
      fire: 9
    };

    return res.json({ success: true, reactions: storyReactions });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch reactions.' });
  }
});

// TOGGLE / ADD STORY REACTION
router.post('/:id/react', (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'inspiring' } = req.body;
    const story = storiesDb.findById(id);
    if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });

    const reactions = story.reactions || {
      inspiring: 12,
      love: 8,
      insightful: 15,
      clap: 24,
      fire: 9
    };

    const validTypes = ['inspiring', 'love', 'insightful', 'clap', 'fire'];
    const reactionKey = validTypes.includes(type) ? type : 'inspiring';

    reactions[reactionKey] = (reactions[reactionKey] || 0) + 1;
    storiesDb.updateById(id, { reactions });

    return res.json({ success: true, reactions, reactedType: reactionKey });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to save reaction.' });
  }
});

// GET STORY COMMENTS
router.get('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const comments = commentsDb.find(c => c.storyId === id);
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, comments });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch comments.' });
  }
});

// POST NEW COMMENT WITH @name-batch_number TAG
router.post('/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { commentText, authorName, batchNumber } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text is required.' });
    }

    const story = storiesDb.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    const cleanAuthorName = (authorName || 'Alumni Member').trim().replace(/^@/, '');
    const cleanBatch = String(batchNumber || '26').trim().replace(/^(Batch|batch|\s|-)+/, '');
    const authorTag = '@' + cleanAuthorName + '-' + cleanBatch;

    const newComment = commentsDb.insert({
      storyId: id,
      authorName: cleanAuthorName,
      batchNumber: cleanBatch,
      authorTag: authorTag,
      commentText: commentText.trim(),
      likes: 0,
      createdAt: new Date().toISOString()
    });

    return res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error posting comment:', error);
    return res.status(500).json({ success: false, error: 'Failed to post comment.' });
  }
});

export default router;


