import express from 'express';
import { categoriesDb } from '../db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET PUBLIC/ADMIN CATEGORIES
router.get('/', (req, res) => {
  try {
    const categories = categoriesDb.read();
    categories.sort((a, b) => a.name.localeCompare(b.name));
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// ADMIN CREATE CATEGORY
router.post('/admin', authenticateUser, requireAdmin, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const existing = categoriesDb.findOne(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Category with this name already exists.' });
    }

    const newCat = categoriesDb.insert({
      name: name.trim(),
      description: description ? description.trim() : '',
      isActive: true
    });

    return res.status(201).json({ message: 'Category created.', category: newCat });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

// ADMIN UPDATE CATEGORY
router.put('/admin/:id', authenticateUser, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const cat = categoriesDb.findById(id);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const updated = categoriesDb.updateById(id, {
      name: name ? name.trim() : cat.name,
      description: description !== undefined ? description.trim() : cat.description,
      isActive: isActive !== undefined ? Boolean(isActive) : cat.isActive
    });

    return res.json({ message: 'Category updated.', category: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update category.' });
  }
});

// ADMIN DELETE CATEGORY
router.delete('/admin/:id', authenticateUser, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = categoriesDb.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    return res.json({ message: 'Category deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

export default router;
