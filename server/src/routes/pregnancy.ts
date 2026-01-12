import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { run, get } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculatePregnancyWeek, calculateDueDate, calculateDaysRemaining, getTrimester, getTrimesterLabel } from '../utils/pregnancy';

const router = Router();

interface Pregnancy {
    id: string;
    user_id: string;
    lmp_date: string;
    due_date: string;
    is_active: number;
    created_at: string;
}

// Get active pregnancy with calculated data
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
    const pregnancy = get<Pregnancy>(
        'SELECT * FROM pregnancies WHERE user_id = ? AND is_active = 1',
        [req.userId!]
    );

    if (!pregnancy) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    const lmpDate = new Date(pregnancy.lmp_date);
    const dueDate = new Date(pregnancy.due_date);
    const { week, day, totalDays } = calculatePregnancyWeek(lmpDate);
    const daysRemaining = calculateDaysRemaining(dueDate);
    const trimester = getTrimester(week);

    res.json({
        id: pregnancy.id,
        lmpDate: pregnancy.lmp_date,
        dueDate: pregnancy.due_date,
        week,
        day,
        totalDays,
        daysRemaining,
        trimester,
        trimesterLabel: getTrimesterLabel(trimester),
        createdAt: pregnancy.created_at
    });
});

// Create pregnancy
router.post(
    '/',
    authMiddleware,
    [
        body('lmpDate').isISO8601().withMessage('Valid LMP date required'),
        body('dueDate').optional().isISO8601()
    ],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { lmpDate, dueDate: customDueDate } = req.body;

        // Deactivate any existing pregnancies
        run('UPDATE pregnancies SET is_active = 0 WHERE user_id = ?', [req.userId!]);

        // Calculate due date if not provided
        const dueDate = customDueDate || calculateDueDate(new Date(lmpDate)).toISOString().split('T')[0];
        const pregnancyId = uuidv4();

        run(
            'INSERT INTO pregnancies (id, user_id, lmp_date, due_date, is_active) VALUES (?, ?, ?, ?, 1)',
            [pregnancyId, req.userId!, lmpDate, dueDate]
        );

        res.status(201).json({ id: pregnancyId, lmpDate, dueDate });
    }
);

// Update pregnancy (due date)
router.put(
    '/:id',
    authMiddleware,
    [body('dueDate').isISO8601().withMessage('Valid due date required')],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { dueDate } = req.body;

        // Check if pregnancy exists
        const pregnancy = get<Pregnancy>(
            'SELECT id FROM pregnancies WHERE id = ? AND user_id = ?',
            [id, req.userId!]
        );

        if (!pregnancy) {
            return res.status(404).json({ error: 'Pregnancy not found' });
        }

        run('UPDATE pregnancies SET due_date = ? WHERE id = ?', [dueDate, id]);

        res.json({ message: 'Due date updated', dueDate });
    }
);

export default router;
