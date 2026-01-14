import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { run, get } from '../config/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

interface User {
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
}

// Signup
router.post(
    '/signup',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            const existingUser = get<User>('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password and create user
            const passwordHash = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            run('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [userId, email, passwordHash]);

            const token = generateToken(userId);
            res.status(201).json({ token, userId });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Failed to create account' });
        }
    }
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const user = get<User>('SELECT id, password_hash FROM users WHERE email = ?', [email]);

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = generateToken(user.id);
            res.json({ token, userId: user.id });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
    const user = get<{ id: string; email: string; created_at: string }>(
        'SELECT id, email, created_at FROM users WHERE id = ?',
        [req.userId!]
    );

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
});

export default router;
