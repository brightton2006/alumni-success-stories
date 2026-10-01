import express from 'express';
import { usersDb, storiesDb } from '../db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser, requireAdmin);

// GET USERS LIST (WITH STORIES COUNT)
router.get('/', (req, res) => {
  try {
    const users = usersDb.read();
    const stories = storiesDb.read();

    const userList = users.map(u => {
      const { passwordHash, ...safeUser } = u;
      const userStoriesCount = stories.filter(s => s.authorAdminId === u.id).length;
      return {
        ...safeUser,
        storiesCount: userStoriesCount
      };
    });

    userList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ users: userList });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user list.' });
  }
});

// TOGGLE USER ACTIVE STATUS (With Last Admin Protection)
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = usersDb.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // LAST REMAINING ADMIN PROTECTION RULE
    if (user.role === 'ADMIN' && isActive === false) {
      const activeAdmins = usersDb.find(u => u.role === 'ADMIN' && u.isActive === true);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({
          error: 'Protection rule enforced: Cannot deactivate the last remaining active administrator.'
        });
      }
    }

    const updatedUser = usersDb.updateById(id, { isActive: Boolean(isActive) });
    const { passwordHash, ...safeUser } = updatedUser;

    return res.json({
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

export default router;
