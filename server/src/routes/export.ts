import { Router, Response } from 'express';
import { get, all } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculatePregnancyWeek, getTrimester, getTrimesterLabel, calculateDaysRemaining } from '../utils/pregnancy';

const router = Router();

interface Pregnancy {
    id: string;
    user_id: string;
    lmp_date: string;
    due_date: string;
    is_active: number;
    created_at: string;
}

interface DailyLog {
    id: string;
    log_date: string;
    symptoms: string;
    mood: string;
    notes: string;
    weight: number;
    blood_pressure: string;
    blood_sugar: number;
}

interface Appointment {
    id: string;
    title: string;
    datetime: string;
    location: string;
    notes: string;
}

// Helper to get active pregnancy
function getActivePregnancy(userId: string): Pregnancy | undefined {
    return get<Pregnancy>(
        'SELECT * FROM pregnancies WHERE user_id = ? AND is_active = 1',
        [userId]
    );
}

// Export CSV of all logs
router.get('/csv', authMiddleware, (req: AuthRequest, res: Response) => {
    const pregnancy = getActivePregnancy(req.userId!);

    if (!pregnancy) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    const logs = all<DailyLog>(
        'SELECT * FROM daily_logs WHERE pregnancy_id = ? ORDER BY log_date ASC',
        [pregnancy.id]
    );

    // Generate CSV
    const headers = ['Date', 'Symptoms', 'Mood', 'Notes', 'Weight', 'Blood Pressure', 'Blood Sugar'];
    const rows = logs.map((log) => [
        log.log_date,
        JSON.parse(log.symptoms || '[]').join('; '),
        log.mood || '',
        (log.notes || '').replace(/"/g, '""'),
        log.weight || '',
        log.blood_pressure || '',
        log.blood_sugar || ''
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pregnancy_logs.csv');
    res.send(csv);
});

// Export PDF summary (returns JSON data for client-side PDF generation)
router.get('/pdf', authMiddleware, (req: AuthRequest, res: Response) => {
    const pregnancy = getActivePregnancy(req.userId!);

    if (!pregnancy) {
        return res.status(404).json({ error: 'No active pregnancy found' });
    }

    const user = get<{ email: string }>('SELECT email FROM users WHERE id = ?', [req.userId!]);

    const logs = all<DailyLog>(
        'SELECT * FROM daily_logs WHERE pregnancy_id = ? ORDER BY log_date DESC LIMIT 30',
        [pregnancy.id]
    );

    const appointments = all<Appointment>(
        'SELECT * FROM appointments WHERE pregnancy_id = ? ORDER BY datetime ASC',
        [pregnancy.id]
    );

    const lmpDate = new Date(pregnancy.lmp_date);
    const dueDate = new Date(pregnancy.due_date);
    const { week, day } = calculatePregnancyWeek(lmpDate, dueDate);
    const trimester = getTrimester(week);
    const daysRemaining = calculateDaysRemaining(dueDate);

    // Return JSON data for client-side PDF generation
    res.json({
        user: { email: user?.email || '' },
        pregnancy: {
            lmpDate: pregnancy.lmp_date,
            dueDate: pregnancy.due_date,
            week,
            day,
            trimester,
            trimesterLabel: getTrimesterLabel(trimester),
            daysRemaining
        },
        logs: logs.map((log) => ({
            ...log,
            symptoms: JSON.parse(log.symptoms || '[]')
        })),
        appointments,
        generatedAt: new Date().toISOString()
    });
});

export default router;
