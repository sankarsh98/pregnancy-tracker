import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { run, all, get } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

interface TrackerConfig {
    id: string;
    user_id: string;
    name: string;
    emoji: string;
    daily_goal: number | null;
    created_at: string;
}

// Get all trackers for the current user
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const trackers = all<TrackerConfig>(
            'SELECT * FROM tracker_configs WHERE user_id = ? ORDER BY created_at ASC',
            [req.userId]
        );
        res.json(trackers);
    } catch (error) {
        console.error('Error fetching trackers:', error);
        res.status(500).json({ error: 'Failed to fetch trackers' });
    }
});

// Create a new tracker
router.post(
    '/',
    authMiddleware,
    [
        body('name').notEmpty().trim().withMessage('Name is required'),
        body('emoji').notEmpty().trim().withMessage('Emoji is required')
    ],
    async (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, emoji, daily_goal } = req.body;

        try {
            const id = uuidv4();
            run(
                'INSERT INTO tracker_configs (id, user_id, name, emoji, daily_goal) VALUES (?, ?, ?, ?, ?)',
                [id, req.userId, name, emoji, daily_goal || null]
            );

            const newTracker = get<TrackerConfig>('SELECT * FROM tracker_configs WHERE id = ?', [id]);
            res.status(201).json(newTracker);
        } catch (error) {
            console.error('Error creating tracker:', error);
            res.status(500).json({ error: 'Failed to create tracker' });
        }
    }
);

// Delete a tracker
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        // Verify ownership
        const tracker = get<TrackerConfig>(
            'SELECT id FROM tracker_configs WHERE id = ? AND user_id = ?',
            [req.params.id, req.userId]
        );

        if (!tracker) {
            return res.status(404).json({ error: 'Tracker not found' });
        }

        run('DELETE FROM tracker_configs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Tracker deleted' });
    } catch (error) {
        console.error('Error deleting tracker:', error);
        res.status(500).json({ error: 'Failed to delete tracker' });
    }
});

export default router;
