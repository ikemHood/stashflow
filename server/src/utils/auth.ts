import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'stashflow-secret-key';
const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 30; // 30 days

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token
 */
export const generateToken = (userId: number, email: string): string => {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): { userId: number; email: string } | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
        return decoded;
    } catch (error) {
        return null;
    }
};

// Generate tokens for session
export const generateTokens = (userId: string) => {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    return { accessToken, refreshToken };
};

// Create a new session
export const createSession = async (userId: string, userAgent?: string, ipAddress?: string, deviceName?: string) => {
    const { accessToken, refreshToken } = generateTokens(userId);

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY);

    // Create session in database
    const [session] = await db.insert(sessions).values({
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress,
        deviceName
    }).returning();

    return {
        accessToken,
        refreshToken,
        isPinRequired: true,
        expiresAt,
        sessionId: session.id
    };
};

// Find active session by refresh token
export const findSessionByRefreshToken = async (refreshToken: string) => {
    const session = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.refreshToken, refreshToken),
            eq(sessions.isActive, true)
        ),
        with: {
            user: true
        }
    });

    return session;
};

// Refresh a session with PIN verification
export const refreshSession = async (refreshToken: string, pin: string) => {
    // Find the session
    const session = await findSessionByRefreshToken(refreshToken);
    if (!session) {
        throw new Error('Invalid refresh token');
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
        // Deactivate the expired session
        await db.update(sessions)
            .set({ isActive: false })
            .where(eq(sessions.id, session.id));
        throw new Error('Session expired');
    }

    // Verify PIN (now session-specific)
    if (!session.pin) {
        throw new Error('PIN not set for this device');
    }

    const isPinValid = await bcrypt.compare(pin, session.pin);
    if (!isPinValid) {
        throw new Error('Invalid PIN');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.user.id);

    // Update session
    await db.update(sessions)
        .set({
            token: accessToken,
            refreshToken: newRefreshToken,
            lastUsedAt: new Date()
        })
        .where(eq(sessions.id, session.id));

    return {
        accessToken,
        refreshToken: newRefreshToken,
        userId: session.user.id,
        deviceName: session.deviceName
    };
};

// Hash PIN
export const hashPin = async (pin: string) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);
    return hashedPin;
};

// Validate PIN format (must be 6 digits)
export const validatePin = (pin: string) => {
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pin);
};

// Set session PIN
export const setSessionPin = async (sessionId: string, pin: string) => {
    // Validate PIN format
    if (!validatePin(pin)) {
        throw new Error('PIN must be 6 digits');
    }

    // Hash the PIN
    const hashedPin = await hashPin(pin);

    // Update session record with the PIN
    const [updatedSession] = await db.update(sessions)
        .set({ pin: hashedPin })
        .where(eq(sessions.id, sessionId))
        .returning();

    return updatedSession;
};

// Invalidate sessions for a user
export const invalidateUserSessions = async (userId: string) => {
    await db.update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.userId, userId));
};

// Invalidate specific session
export const invalidateSession = async (sessionId: string) => {
    await db.update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.id, sessionId));
};

// Get user's active sessions
export const getUserActiveSessions = async (userId: string) => {
    const userSessions = await db.query.sessions.findMany({
        where: and(
            eq(sessions.userId, userId),
            eq(sessions.isActive, true)
        ),
        orderBy: [sessions.lastUsedAt]
    });

    return userSessions;
};

// Authentication middleware
export const authenticate = async (req: any, ctx: any) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

        // Find active session with this token
        const session = await db.query.sessions.findFirst({
            where: and(
                eq(sessions.token, token),
                eq(sessions.isActive, true)
            ),
            with: {
                user: true
            }
        });

        if (!session) {
            return false;
        }

        // Update last used timestamp
        await db.update(sessions)
            .set({ lastUsedAt: new Date() })
            .where(eq(sessions.id, session.id));

        // Set user and session in context
        ctx.set('user', session.user);
        ctx.set('session', session);

        return true;
    } catch (error) {
        return false;
    }
}; 