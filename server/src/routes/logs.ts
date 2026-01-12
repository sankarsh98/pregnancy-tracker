import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

interface Pregnancy {
    id: string;
}

interface DailyLog {
    id: string;
    pregnancy_id: string;
    log_date: string;
    symptoms: string;
    mood: string;
    notes: string;
    weight: number;
    blood_pressure: string;
    blood_sugar: number;
    created_at: string;
    updated_at: string;
}

// Helper to get active pregnancy ID
function getActivePregnancyId(userId: string): string | null {
    const pregnancy = get<Pregnancy>(
        'SELECT id FROM pregnancies WHERE user_id = ? AND is_active = 1',
        [userId]
    );
    return pregnancy?.id || null;
}

// Get all logs for active pregnancy
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
    const pregnancyId = getActivePregnancyId(req.userId!);

    if (!pregnancyId) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    const logs = all<DailyLog>(
        'SELECT * FROM daily_logs WHERE pregnancy_id = ? ORDER BY log_date DESC',
        [pregnancyId]
    );

    // Parse symptoms JSON
    const parsedLogs = logs.map((log) => ({
        ...log,
        symptoms: JSON.parse(log.symptoms || '[]')
    }));

    res.json(parsedLogs);
});

// Get log for specific date
router.get('/:date', authMiddleware, (req: AuthRequest, res: Response) => {
    const pregnancyId = getActivePregnancyId(req.userId!);

    if (!pregnancyId) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    const { date } = req.params;
    const log = get<DailyLog>(
        'SELECT * FROM daily_logs WHERE pregnancy_id = ? AND log_date = ?',
        [pregnancyId, date]
    );

    if (!log) {
        return res.status(404).json({ error: 'Log not found for this date' });
    }

    res.json({
        ...log,
        symptoms: JSON.parse(log.symptoms || '[]')
    });
});

// Create or update log (upsert)
router.post(
    '/',
    authMiddleware,
    [
        body('logDate').isISO8601().withMessage('Valid date required'),
        body('symptoms').optional().isArray(),
        body('mood').optional().isString(),
        body('notes').optional().isString(),
        body('weight').optional().isNumeric(),
        body('bloodPressure').optional().isString(),
        body('bloodSugar').optional().isNumeric()
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

        const { logDate, symptoms, mood, notes, weight, bloodPressure, bloodSugar } = req.body;

        // Check if log exists for this date
        const existingLog = get<{ id: string }>(
            'SELECT id FROM daily_logs WHERE pregnancy_id = ? AND log_date = ?',
            [pregnancyId, logDate]
        );

        const symptomsJson = JSON.stringify(symptoms || []);

        if (existingLog) {
            // Update existing log
            run(
                `UPDATE daily_logs SET
          symptoms = ?,
          mood = ?,
          notes = ?,
          weight = ?,
          blood_pressure = ?,
          blood_sugar = ?,
          updated_at = datetime('now')
        WHERE id = ?`,
                [symptomsJson, mood || null, notes || null, weight || null, bloodPressure || null, bloodSugar || null, existingLog.id]
            );

            res.json({ id: existingLog.id, message: 'Log updated' });
        } else {
            // Create new log
            const logId = uuidv4();
            run(
                `INSERT INTO daily_logs (id, pregnancy_id, log_date, symptoms, mood, notes, weight, blood_pressure, blood_sugar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [logId, pregnancyId, logDate, symptomsJson, mood || null, notes || null, weight || null, bloodPressure || null, bloodSugar || null]
            );

            res.status(201).json({ id: logId, message: 'Log created' });
        }
    }
);

export default router;
