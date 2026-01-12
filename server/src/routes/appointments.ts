import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

interface Pregnancy {
    id: string;
}

interface Appointment {
    id: string;
    pregnancy_id: string;
    title: string;
    datetime: string;
    location: string;
    notes: string;
    created_at: string;
}

// Helper to get active pregnancy ID
function getActivePregnancyId(userId: string): string | null {
    const pregnancy = get<Pregnancy>(
        'SELECT id FROM pregnancies WHERE user_id = ? AND is_active = 1',
        [userId]
    );
    return pregnancy?.id || null;
}

// Get all appointments
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
    const pregnancyId = getActivePregnancyId(req.userId!);

    if (!pregnancyId) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    const appointments = all<Appointment>(
        'SELECT * FROM appointments WHERE pregnancy_id = ? ORDER BY datetime ASC',
        [pregnancyId]
    );

    res.json(appointments);
});

// Create appointment
router.post(
    '/',
    authMiddleware,
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('datetime').isISO8601().withMessage('Valid datetime required'),
        body('location').optional().isString(),
        body('notes').optional().isString()
    ],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const pregnancyId = getActivePregnancyId(req.userId!);

        if (!pregnancyId) {
            return res.status(404).json({ error: 'No active pregnancy found' });
        }

        const { title, datetime, location, notes } = req.body;
        const appointmentId = uuidv4();

        run(
            'INSERT INTO appointments (id, pregnancy_id, title, datetime, location, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [appointmentId, pregnancyId, title, datetime, location || null, notes || null]
        );

        res.status(201).json({ id: appointmentId, message: 'Appointment created' });
    }
);

// Update appointment
router.put(
    '/:id',
    authMiddleware,
    [
        body('title').optional().notEmpty(),
        body('datetime').optional().isISO8601(),
        body('location').optional().isString(),
        body('notes').optional().isString()
    ],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { title, datetime, location, notes } = req.body;
        const pregnancyId = getActivePregnancyId(req.userId!);

        if (!pregnancyId) {
            return res.status(404).json({ error: 'No active pregnancy found' });
        }

        // Check if appointment exists
        const appointment = get<Appointment>(
            'SELECT id FROM appointments WHERE id = ? AND pregnancy_id = ?',
            [id, pregnancyId]
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Build dynamic update
        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (datetime !== undefined) { updates.push('datetime = ?'); values.push(datetime); }
        if (location !== undefined) { updates.push('location = ?'); values.push(location); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        run(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Appointment updated' });
    }
);

// Delete appointment
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const pregnancyId = getActivePregnancyId(req.userId!);

    if (!pregnancyId) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    // Check if appointment exists
    const appointment = get<Appointment>(
        'SELECT id FROM appointments WHERE id = ? AND pregnancy_id = ?',
        [id, pregnancyId]
    );

    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }

    run('DELETE FROM appointments WHERE id = ?', [id]);

    res.json({ message: 'Appointment deleted' });
});

export default router;
