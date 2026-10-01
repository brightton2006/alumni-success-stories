import express from 'express';
import { storiesDb, usersDb, categoriesDb } from '../db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser, requireAdmin);

router.get('/dashboard/stats', (req, res) => {
  try {
    const stories = storiesDb.read();
    const users = usersDb.read();
    const categories = categoriesDb.read();

    const published = stories.filter(s => s.status === 'PUBLISHED');
    const pending = stories.filter(s => s.status === 'PENDING_REVIEW');
    const rejected = stories.filter(s => s.status === 'REJECTED');
    const drafts = stories.filter(s => s.status === 'DRAFT' || s.status === 'CHANGES_REQUESTED');
    const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
    const aiMapsGenerated = stories.filter(s => s.aiMindMap && s.aiMindMap.nodes?.length > 0).length;

    // Most viewed stories
    const mostViewed = [...published]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        storyTitle: s.storyTitle,
        personName: s.personName,
        category: s.category,
        views: s.views || 0,
        publishedAt: s.publishedAt
      }));

    // Stories count by category
    const categoryCounts = {};
    stories.forEach(s => {
      const cat = s.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const storiesByCategory = Object.keys(categoryCounts).map(catName => ({
      category: catName,
      count: categoryCounts[catName]
    }));

    return res.json({
      success: true,
      totalStories: stories.length,
      publishedStories: published.length,
      pendingStories: pending.length,
      rejectedStories: rejected.length,
      draftStories: drafts.length,
      totalUsers: users.length,
      totalCategories: categories.length,
      aiMapsGenerated,
      totalViews,
      mostViewedStories: mostViewed,
      storiesByCategory,
      recentStories: stories.slice(0, 5)
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate admin analytics dashboard data.' });
  }
});

export default router;

