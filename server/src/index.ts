import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import pregnancyRoutes from './routes/pregnancy';
import logsRoutes from './routes/logs';
import appointmentsRoutes from './routes/appointments';
import educationRoutes from './routes/education';
import exportRoutes from './routes/export';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/export', exportRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function start() {
    try {
        await initDatabase();
        console.log('✓ Database initialized');

        app.listen(PORT, () => {
            console.log(`🤰 Pregnancy Tracker API running on http://localhost:${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();

export default app;
