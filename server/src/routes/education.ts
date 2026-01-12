import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import educationData from '../data/education.json';

const router = Router();

// Get all educational content
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
    res.json(educationData);
});

// Get content for specific week
router.get('/week/:week', authMiddleware, (req: AuthRequest, res: Response) => {
    const week = parseInt(req.params.week);

    if (isNaN(week) || week < 1 || week > 42) {
        return res.status(400).json({ error: 'Invalid week number' });
    }

    // Find the closest week content (we don't have content for every week)
    const weekContent = educationData.weeks.find(w => w.week === week);

    if (weekContent) {
        res.json(weekContent);
    } else {
        // Find the previous available week content
        const previousWeek = educationData.weeks
            .filter(w => w.week <= week)
            .sort((a, b) => b.week - a.week)[0];

        if (previousWeek) {
            res.json({ ...previousWeek, note: `Showing content for week ${previousWeek.week}` });
        } else {
            res.status(404).json({ error: 'No content available for this week' });
        }
    }
});

// Get content for specific trimester
router.get('/trimester/:trimester', authMiddleware, (req: AuthRequest, res: Response) => {
    const trimester = parseInt(req.params.trimester);

    if (isNaN(trimester) || trimester < 1 || trimester > 3) {
        return res.status(400).json({ error: 'Invalid trimester (must be 1, 2, or 3)' });
    }

    const trimesterContent = educationData.trimesters.find(t => t.trimester === trimester);
    const weeklyContent = educationData.weeks.filter(w => w.trimester === trimester);

    res.json({
        ...trimesterContent,
        weeks: weeklyContent
    });
});

export default router;
