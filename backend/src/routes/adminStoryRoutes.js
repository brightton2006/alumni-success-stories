import express from 'express';
import { storiesDb } from '../db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { analyzeStoryWithAI } from '../services/aiStoryAnalyzer.js';

const router = express.Router();

// Apply auth & admin requirement to ALL admin story routes
router.use(authenticateUser, requireAdmin);

// GET ALL STORIES (ADMIN VIEW)
router.get('/', (req, res) => {
  try {
    const stories = storiesDb.read();
    stories.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return res.json({ success: true, stories });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch admin stories.' });
  }
});

// GET PENDING REVIEWS
router.get('/pending', (req, res) => {
  try {
    const stories = storiesDb.find(s => s.status === 'PENDING_REVIEW');
    stories.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return res.json({ success: true, stories, count: stories.length });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch pending stories for review.' });
  }
});

// CREATE STORY (DRAFT OR PUBLISHED BY ADMIN)
router.post('/', async (req, res) => {
  try {
    const {
      personName,
      storyTitle,
      profession,
      location,
      category,
      shortSummary,
      fullStory,
      personImage,
      additionalImages
    } = req.body;

    if (!personName || !storyTitle || !fullStory) {
      return res.status(400).json({ success: false, error: 'Person name, story title, and complete story text are required.' });
    }

    const aiResult = await analyzeStoryWithAI({
      storyTitle: storyTitle.trim(),
      personName: personName.trim(),
      fullStory: fullStory.trim(),
      personImage: personImage || '',
      category
    });

    const newStory = storiesDb.insert({
      authorAdminId: req.user.id,
      submittedByUserId: null,
      submittedByUserName: req.user.fullName,
      submittedByUserEmail: req.user.email,
      personName: personName.trim(),
      storyTitle: storyTitle.trim(),
      profession: profession ? profession.trim() : 'Inspiring Personality',
      location: location ? location.trim() : 'Global',
      category: category || 'Other',
      shortSummary: shortSummary ? shortSummary.trim() : fullStory.slice(0, 180) + '...',
      fullStory: fullStory.trim(),
      personImage: personImage || '',
      additionalImages: Array.isArray(additionalImages) ? additionalImages : [],
      status: 'DRAFT',
      views: 0,
      rejectionReason: null,
      adminFeedback: null,
      journeyMap: aiResult.journeyMap,
      aiExtractedElements: aiResult.aiExtractedElements,
      aiKeywords: aiResult.aiKeywords,
      aiMindMap: aiResult.aiMindMap,
      publishedAt: null
    });

    return res.status(201).json({
      success: true,
      message: 'Draft story created successfully with keyword cloud.',
      story: newStory
    });
  } catch (error) {
    console.error('Error creating story:', error);
    return res.status(500).json({ success: false, error: 'Server error creating story.' });
  }
});

// GET SINGLE STORY FOR ADMIN
router.get('/:id', (req, res) => {
  try {
    const story = storiesDb.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }
    return res.json({ success: true, story });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch story details.' });
  }
});

// UPDATE STORY OR MIND MAP (WITH AUTOMATIC KEYWORD CLOUD REGENERATION)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    const updatedData = { ...req.body };

    const hasContentChanged = (
      (updatedData.fullStory && updatedData.fullStory.trim() !== story.fullStory) ||
      (updatedData.storyTitle && updatedData.storyTitle.trim() !== story.storyTitle) ||
      (updatedData.personName && updatedData.personName.trim() !== story.personName) ||
      (updatedData.personImage !== undefined && updatedData.personImage !== story.personImage)
    );

    if (hasContentChanged || !story.aiKeywords || story.aiKeywords.length === 0) {
      const fullText = updatedData.fullStory || story.fullStory;
      const title = updatedData.storyTitle || story.storyTitle;
      const name = updatedData.personName || story.personName;
      const image = updatedData.personImage !== undefined ? updatedData.personImage : story.personImage;
      const cat = updatedData.category || story.category;

      if (fullText && fullText.trim().length > 15) {
        const aiResult = await analyzeStoryWithAI({
          storyTitle: title,
          personName: name,
          fullStory: fullText,
          personImage: image,
          category: cat
        });

        updatedData.journeyMap = aiResult.journeyMap;
        updatedData.aiExtractedElements = aiResult.aiExtractedElements;
        updatedData.aiKeywords = aiResult.aiKeywords;
        updatedData.aiMindMap = aiResult.aiMindMap;
      }
    }

    const updatedStory = storiesDb.updateById(id, {
      ...updatedData,
      authorAdminId: story.authorAdminId
    });

    return res.json({
      success: true,
      message: 'Story updated successfully with regenerated keyword cloud.',
      story: updatedStory
    });
  } catch (error) {
    console.error('Error updating story:', error);
    return res.status(500).json({ success: false, error: 'Failed to update story.' });
  }
});

// TRIGGER AI STORY ANALYSIS & MIND MAP GENERATION
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (!story.fullStory || story.fullStory.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Story text is too short for AI analysis. Please provide a complete story.' });
    }

    // Call AI Analyzer Service
    const aiResult = await analyzeStoryWithAI({
      storyTitle: story.storyTitle,
      personName: story.personName,
      fullStory: story.fullStory,
      personImage: story.personImage
    });

    // Save AI output to DB
    const updatedStory = storiesDb.updateById(id, {
      aiExtractedElements: aiResult.aiExtractedElements,
      aiKeywords: aiResult.aiKeywords,
      aiMindMap: aiResult.aiMindMap
    });

    return res.json({
      success: true,
      message: 'AI Story Visualization successfully generated!',
      story: updatedStory
    });
  } catch (error) {
    console.error('AI Analysis API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to generate the story map right now. Your story has been saved. Please try again.'
    });
  }
});

// APPROVE STORY (Status -> APPROVED)
router.post('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    const updatedStory = storiesDb.updateById(id, {
      status: 'APPROVED',
      approvedBy: req.user.fullName || req.user.email,
      approvedAt: new Date().toISOString(),
      rejectionReason: null,
      adminFeedback: null
    });

    return res.json({
      success: true,
      message: 'Story approved successfully!',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to approve story.' });
  }
});

// REJECT STORY (Status -> REJECTED)
router.post('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reason for rejecting the story so the author can understand and revise.'
      });
    }

    const updatedStory = storiesDb.updateById(id, {
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectionReason.trim(),
      adminFeedback: null
    });

    return res.json({
      success: true,
      message: 'Story rejected with reason recorded for the author.',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reject story.' });
  }
});

// REQUEST CHANGES
router.post('/:id/request-changes', (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback comments are required when requesting changes.' });
    }

    const updatedStory = storiesDb.updateById(id, {
      status: 'CHANGES_REQUESTED',
      adminFeedback: feedback.trim()
    });

    return res.json({
      success: true,
      message: 'Change request sent to user.',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to request changes.' });
  }
});

// PUBLISH STORY (Status -> PUBLISHED)
router.post('/:id/publish', (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (!story.personName || !story.storyTitle || !story.category || !story.fullStory) {
      return res.status(400).json({ success: false, error: 'Cannot publish incomplete story. Check title, person name, category, and content.' });
    }

    const updatedStory = storiesDb.updateById(id, {
      status: 'PUBLISHED',
      publishedAt: story.publishedAt || new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Story successfully published!',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to publish story.' });
  }
});

// UNPUBLISH STORY (Status -> UNPUBLISHED)
router.post('/:id/unpublish', (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    const updatedStory = storiesDb.updateById(id, {
      status: 'UNPUBLISHED'
    });

    return res.json({
      success: true,
      message: 'Story unpublished and set to UNPUBLISHED status.',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to unpublish story.' });
  }
});

// TOGGLE / SET NAME VISIBILITY (showName: true/false)
router.put('/:id/name-visibility', (req, res) => {
  try {
    const { id } = req.params;
    const { showName } = req.body;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    // Accept boolean or string ('SHOW_NAME' / 'HIDE_NAME')
    const finalShowName = typeof showName === 'boolean'
      ? showName
      : showName === 'SHOW_NAME' || showName === 'true';

    const updatedStory = storiesDb.updateById(id, {
      showName: finalShowName
    });

    return res.json({
      success: true,
      message: `Name visibility set to ${finalShowName ? 'SHOW_NAME' : 'HIDE_NAME'}.`,
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update name visibility.' });
  }
});

// SET PUBLICATION LOCATIONS
router.put('/:id/publication-locations', (req, res) => {
  try {
    const { id } = req.params;
    const { publicationLocations } = req.body;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (!Array.isArray(publicationLocations)) {
      return res.status(400).json({ success: false, error: 'publicationLocations must be an array of location strings.' });
    }

    const updatedStory = storiesDb.updateById(id, {
      publicationLocations
    });

    return res.json({
      success: true,
      message: 'Publication locations updated successfully.',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update publication locations.' });
  }
});

// DELETE STORY PERMANENTLY
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = storiesDb.deleteById(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    return res.json({ success: true, message: 'Story deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete story.' });
  }
});

export default router;

