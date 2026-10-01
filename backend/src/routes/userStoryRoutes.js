import express from 'express';
import { storiesDb } from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { analyzeStoryWithAI } from '../services/aiStoryAnalyzer.js';

const router = express.Router();

// GET MY STORIES
router.get('/my', authenticateUser, (req, res) => {
  try {
    const stories = storiesDb.find(s => s.submittedByUserId === req.user.id);
    stories.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return res.json({ success: true, stories });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch your stories.' });
  }
});

// GET MY SINGLE STORY BY ID
router.get('/my/:id', authenticateUser, (req, res) => {
  try {
    const story = storiesDb.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }
    if (story.submittedByUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this story.' });
    }
    return res.json({ success: true, story });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch story details.' });
  }
});

// WRITE/SAVE NEW USER STORY
router.post('/', authenticateUser, async (req, res) => {
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
      submitImmediate
    } = req.body;

    if (!personName || !storyTitle || !fullStory) {
      return res.status(400).json({
        success: false,
        error: 'Person name, story title, and complete story text are required.'
      });
    }

    const status = submitImmediate ? 'PENDING_REVIEW' : 'DRAFT';

      const {
        authorMemberId,
        batchYear,
        batchNumber,
        batchDisplay,
        company,
        role,
        department
      } = req.body;

      const newStory = storiesDb.insert({
        submittedByUserId: req.user.id,
        submittedByUserName: req.user.fullName,
        submittedByUserEmail: req.user.email,
        authorAdminId: null,
        authorMemberId: authorMemberId || null,
        personName: personName.trim(),
        storyTitle: storyTitle.trim(),
        profession: profession ? profession.trim() : 'Inspiring Individual',
        role: role || profession || 'Alumni',
        company: company || '',
        department: department || '',
        batchYear: batchYear || null,
        batchNumber: batchNumber || null,
        batchDisplay: batchDisplay || (batchYear ? `Batch - ${String(batchYear).slice(-2)} Alumni` : 'Batch - 26 Alumni'),
        location: location ? location.trim() : 'Global',
        category: category || 'Other',
        shortSummary: shortSummary ? shortSummary.trim() : fullStory.slice(0, 180) + '...',
        fullStory: fullStory.trim(),
        personImage: personImage || '',
        additionalImages: [],
        status,
        showName: true,
        isVerified: true,
        publicationLocations: ['Success Stories'],
        views: 0,
        rejectionReason: null,
        adminFeedback: null,
        aiExtractedElements: null,
        aiKeywords: [],
        aiMindMap: null,
        publishedAt: null
      });

    // If submitted for review immediately, trigger AI Analysis
    if (submitImmediate) {
      try {
        const aiResult = await analyzeStoryWithAI({
          storyTitle: newStory.storyTitle,
          personName: newStory.personName,
          fullStory: newStory.fullStory,
          personImage: newStory.personImage,
          category: newStory.category
        });

        const updatedStory = storiesDb.updateById(newStory.id, {
          journeyMap: aiResult.journeyMap,
          hierarchicalMindMap: aiResult.hierarchicalMindMap,
          aiExtractedElements: aiResult.aiExtractedElements,
          aiKeywords: aiResult.aiKeywords,
          aiMindMap: aiResult.aiMindMap
        });

        return res.status(201).json({
          success: true,
          message: 'Your success story has been submitted and is waiting for admin approval.',
          story: updatedStory
        });
      } catch (aiErr) {
        console.error('Journey analysis failed on submission:', aiErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: submitImmediate ? 'Your success story has been submitted and is waiting for admin approval.' : 'Story saved as draft.',
      story: newStory
    });
  } catch (error) {
    console.error('User story save error:', error);
    return res.status(500).json({ success: false, error: 'Server error saving story.' });
  }
});

// UPDATE USER STORY
router.put('/my/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (story.submittedByUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized to edit this story.' });
    }

    const {
      personName,
      storyTitle,
      profession,
      location,
      category,
      shortSummary,
      fullStory,
      personImage,
      batchYear,
      batchNumber,
      batchDisplay,
      company,
      role,
      department,
      authorMemberId,
      submitImmediate
    } = req.body;

    const updates = {
      personName: personName !== undefined ? personName.trim() : story.personName,
      storyTitle: storyTitle !== undefined ? storyTitle.trim() : story.storyTitle,
      profession: profession !== undefined ? profession.trim() : story.profession,
      role: role !== undefined ? role : (profession || story.role || story.profession),
      company: company !== undefined ? company : story.company,
      department: department !== undefined ? department : story.department,
      batchYear: batchYear !== undefined ? batchYear : story.batchYear,
      batchNumber: batchNumber !== undefined ? batchNumber : story.batchNumber,
      batchDisplay: batchDisplay !== undefined ? batchDisplay : (batchYear ? `Batch - ${String(batchYear).slice(-2)} Alumni` : story.batchDisplay),
      authorMemberId: authorMemberId !== undefined ? authorMemberId : story.authorMemberId,
      location: location !== undefined ? location.trim() : story.location,
      category: category !== undefined ? category : story.category,
      shortSummary: shortSummary !== undefined ? shortSummary.trim() : story.shortSummary,
      fullStory: fullStory !== undefined ? fullStory.trim() : story.fullStory,
      personImage: personImage !== undefined ? personImage : story.personImage
    };

    if (submitImmediate) {
      updates.status = 'PENDING_REVIEW';
      updates.rejectionReason = null;
      updates.adminFeedback = null;
      try {
        const aiResult = await analyzeStoryWithAI({
          storyTitle: updates.storyTitle,
          personName: updates.personName,
          fullStory: updates.fullStory,
          personImage: updates.personImage,
          category: updates.category
        });
        updates.journeyMap = aiResult.journeyMap;
        updates.hierarchicalMindMap = aiResult.hierarchicalMindMap;
        updates.aiExtractedElements = aiResult.aiExtractedElements;
        updates.aiKeywords = aiResult.aiKeywords;
        updates.aiMindMap = aiResult.aiMindMap;
      } catch (aiErr) {
        console.error('Extraction error on update submit:', aiErr);
      }
    }

    const updatedStory = storiesDb.updateById(id, updates);

    return res.json({
      success: true,
      message: submitImmediate ? 'Your success story has been submitted and is waiting for admin approval.' : 'Story updated successfully.',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update story.' });
  }
});

// SUBMIT STORY FOR VERIFICATION (PENDING_REVIEW)
router.post('/:id/submit', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (story.submittedByUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized to submit this story.' });
    }

    if (!story.personName || !story.storyTitle || !story.fullStory) {
      return res.status(400).json({ success: false, error: 'Story must have title, person name, and content.' });
    }

    // Trigger analysis & journey map generation
    let aiFields = {};
    try {
      const aiResult = await analyzeStoryWithAI({
        storyTitle: story.storyTitle,
        personName: story.personName,
        fullStory: story.fullStory,
        personImage: story.personImage,
        category: story.category
      });
      aiFields = {
        journeyMap: aiResult.journeyMap,
        hierarchicalMindMap: aiResult.hierarchicalMindMap,
        aiExtractedElements: aiResult.aiExtractedElements,
        aiKeywords: aiResult.aiKeywords,
        aiMindMap: aiResult.aiMindMap
      };
    } catch (aiErr) {
      console.error('Extraction on submit warning:', aiErr);
    }

    const updatedStory = storiesDb.updateById(id, {
      status: 'PENDING_REVIEW',
      rejectionReason: null,
      adminFeedback: null,
      ...aiFields
    });

    return res.json({
      success: true,
      message: 'Your success story has been submitted and is waiting for admin approval.',
      story: updatedStory
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to submit story for verification.' });
  }
});

// DELETE USER STORY DRAFT
router.delete('/my/:id', authenticateUser, (req, res) => {
  try {
    const { id } = req.params;
    const story = storiesDb.findById(id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found.' });
    }

    if (story.submittedByUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this story.' });
    }

    storiesDb.deleteById(id);
    return res.json({ success: true, message: 'Story deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete story.' });
  }
});

export default router;

