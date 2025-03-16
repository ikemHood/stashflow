import type { Context } from 'hono';
import { db } from '../db';
import { users, sessions, roles, userRoles } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import {
    hashPassword,
    verifyPassword,
    generateToken,
    createSession,
    setSessionPin,
    validatePin,
    refreshSession,
    invalidateSession,
    invalidateUserSessions,
    getUserActiveSessions
} from '../utils/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { randomBytes } from 'crypto';
import { getValidatedData } from '../utils/validation';
import type { z } from 'zod';

/**
 * Generate a random verification code
 */
const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a reset password code (6 digits)
 */
const generateResetCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new user
 */
export const signup = async (c: Context) => {
    try {
        // Get validated data from context
        const { email, name, password } = getValidatedData<{
            email: string;
            name: string;
            password: string;
        }>(c);

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (existingUser) {
            return c.json({
                success: false,
                message: 'User already exists'
            }, 400);
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date();
        verificationCodeExpires.setMinutes(verificationCodeExpires.getMinutes() + 30); // 30 minutes expiry

        // Create user
        const result = await db.insert(users).values({
            email,
            name,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires
        }).returning({ id: users.id, email: users.email, name: users.name });

        const user = result[0];

        // Assign role based on email
        let roleName = 'user';
        if (email.toLowerCase() === 'ikem@ikem.dev' || email.toLowerCase() === 'ikempeter2020@gmail.com') {
            roleName = 'admin';
        }

        // Find and assign role
        const userRole = await db.query.roles.findFirst({
            where: eq(roles.name, roleName)
        });

        if (userRole) {
            await db.insert(userRoles).values({
                userId: user.id,
                roleId: userRole.id,
                assignedBy: user.id // self-assigned
            });
        }

        // Create session
        const userAgent = c.req.header('User-Agent');
        const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP');
        const sessionData = await createSession(user.id, userAgent, ipAddress);

        // Send verification email
        await sendVerificationEmail(email, name, verificationCode);

        return c.json({
            success: true,
            message: 'User created successfully. Please check your email for verification code.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isVerified: false
                },
                accessToken: sessionData.accessToken,
                refreshToken: sessionData.refreshToken,
                isPinRequired: sessionData.isPinRequired
            }
        }, 201);
    } catch (error) {
        console.error('Error in signup:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Verify email with the verification code
 */
export const verifyEmail = async (c: Context) => {
    try {
        const { code } = getValidatedData<{ code: string }>(c);
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Get user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return c.json({
                success: false,
                message: 'User not found'
            }, 404);
        }

        // Check if already verified
        if (user.isVerified) {
            return c.json({
                success: true,
                message: 'Email already verified'
            });
        }

        // Check if code is valid
        if (user.verificationCode !== code) {
            return c.json({
                success: false,
                message: 'Invalid verification code'
            }, 400);
        }

        // Check if code is expired
        if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
            return c.json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            }, 400);
        }

        // Update user as verified
        await db.update(users)
            .set({
                isVerified: true,
                verificationCode: null,
                verificationCodeExpires: null
            })
            .where(eq(users.id, userId));

        return c.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Error in verifyEmail:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Resend verification code
 */
export const resendVerificationCode = async (c: Context) => {
    try {
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Get user
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return c.json({
                success: false,
                message: 'User not found'
            }, 404);
        }

        // Check if already verified
        if (user.isVerified) {
            return c.json({
                success: true,
                message: 'Email already verified'
            });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date();
        verificationCodeExpires.setMinutes(verificationCodeExpires.getMinutes() + 30); // 30 minutes expiry

        // Update user with new verification code
        await db.update(users)
            .set({
                verificationCode,
                verificationCodeExpires
            })
            .where(eq(users.id, userId));

        // Send verification email
        await sendVerificationEmail(user.email, user.name, verificationCode);

        return c.json({
            success: true,
            message: 'Verification code sent successfully. Please check your email.'
        });
    } catch (error) {
        console.error('Error in resendVerificationCode:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Request password reset
 */
export const forgotPassword = async (c: Context) => {
    try {
        const { email } = getValidatedData<{ email: string }>(c);

        // Find user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        // Don't reveal if the user exists or not
        if (!user) {
            return c.json({
                success: true,
                message: 'If your email is registered, you will receive a password reset code'
            });
        }

        // Generate reset code
        const resetCode = generateResetCode();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

        // Update user with reset code
        await db.update(users)
            .set({
                resetPasswordCode: resetCode,
                resetPasswordExpires: resetExpires
            })
            .where(eq(users.id, user.id));

        // Send password reset email
        await sendPasswordResetEmail(user.email, user.name, resetCode);

        return c.json({
            success: true,
            message: 'If your email is registered, you will receive a password reset code'
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Reset password
 */
export const resetPassword = async (c: Context) => {
    try {
        const { email, code, newPassword } = getValidatedData<{
            email: string;
            code: string;
            newPassword: string;
        }>(c);

        // Find user by email first
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user) {
            return c.json({
                success: false,
                message: 'Invalid email or reset code'
            }, 400);
        }

        // Then verify the reset code
        if (user.resetPasswordCode !== code) {
            return c.json({
                success: false,
                message: 'Invalid or expired reset code'
            }, 400);
        }

        // Check if reset code is expired
        if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
            return c.json({
                success: false,
                message: 'Reset code has expired. Please request a new one.'
            }, 400);
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user with new password and clear reset code
        await db.update(users)
            .set({
                password: hashedPassword,
                resetPasswordCode: null,
                resetPasswordExpires: null
            })
            .where(eq(users.id, user.id));

        // Invalidate all user sessions for security
        await invalidateUserSessions(user.id);

        return c.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Login user
 */
export const login = async (c: Context) => {
    try {
        const { email, password, deviceName } = getValidatedData<{
            email: string;
            password: string;
            deviceName?: string;
        }>(c);

        // Find user by email
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user) {
            return c.json({
                success: false,
                message: 'Invalid email or password'
            }, 401);
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return c.json({
                success: false,
                message: 'Invalid email or password'
            }, 401);
        }

        // Check if user has any roles assigned
        const userRolesCount = await db.select({ count: sql<number>`count(*)` })
            .from(userRoles)
            .where(eq(userRoles.userId, user.id));

        if (userRolesCount[0].count === 0) {
            // Assign role based on email
            let roleName = 'user';
            if (email === 'ikem@ikem.dev' || email === 'ikempeter2020@gmail.com') {
                roleName = 'admin';
            }

            // Find and assign role
            const roleToAssign = await db.query.roles.findFirst({
                where: eq(roles.name, roleName)
            });

            if (roleToAssign) {
                await db.insert(userRoles).values({
                    userId: user.id,
                    roleId: roleToAssign.id,
                    assignedBy: user.id // self-assigned
                });
            }
        }

        // Create session
        const userAgent = c.req.header('User-Agent');
        const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP');
        const sessionData = await createSession(user.id, userAgent, ipAddress, deviceName);

        return c.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isVerified: user.isVerified
                },
                accessToken: sessionData.accessToken,
                refreshToken: sessionData.refreshToken,
                isPinRequired: sessionData.isPinRequired
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Get user details
 */
export const getUser = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return c.json({ message: 'User not found' }, 404);
        }

        return c.json({
            message: 'User details retrieved',
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error in getUser:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
};

/**
 * Set device PIN
 */
export const setDevicePin = async (c: Context) => {
    try {
        const { pin } = getValidatedData<{ pin: string }>(c);
        const userId = c.get('user')?.id;
        const sessionId = c.get('session')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        if (!sessionId) {
            return c.json({
                success: false,
                message: 'No active session found'
            }, 401);
        }

        // Set PIN for the session
        await setSessionPin(sessionId, pin);

        return c.json({
            success: true,
            message: 'PIN set successfully for this device'
        });
    } catch (error) {
        console.error('Error in setDevicePin:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Get active devices/sessions
 */
export const getDevices = async (c: Context) => {
    try {
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Get all active sessions for the user
        const activeSessions = await getUserActiveSessions(userId);

        // Format the response
        const devices = activeSessions.map(session => ({
            id: session.id,
            deviceName: session.deviceName || 'Unknown device',
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
            hasPin: !!session.pin,
            current: session.id === c.get('session')?.id
        }));

        return c.json({
            success: true,
            data: {
                devices
            }
        });
    } catch (error) {
        console.error('Error in getDevices:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Rename a device
 */
export const renameDevice = async (c: Context) => {
    try {
        const { sessionId, deviceName } = getValidatedData<{
            sessionId: string;
            deviceName: string;
        }>(c);
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Convert sessionId to number if needed
        const sessionIdNum = sessionId;

        // Find the session
        const session = await db.query.sessions.findFirst({
            where: (fields, { and, eq }) => and(
                eq(sessions.id, sessionIdNum),
                eq(sessions.userId, userId)
            )
        });

        if (!session) {
            return c.json({
                success: false,
                message: 'Session not found'
            }, 404);
        }

        // Update session with new device name
        await db.update(sessions)
            .set({ deviceName })
            .where(eq(sessions.id, sessionIdNum));

        return c.json({
            success: true,
            message: 'Device renamed successfully'
        });
    } catch (error) {
        console.error('Error in renameDevice:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Logout from the current device
 */
export const logout = async (c: Context) => {
    try {
        const sessionId = c.get('session')?.id;

        if (!sessionId) {
            return c.json({
                success: false,
                message: 'No active session found'
            }, 401);
        }

        // Invalidate the session
        await invalidateSession(sessionId);

        return c.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Error in logout:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Logout from a specific device
 */
export const logoutDevice = async (c: Context) => {
    try {
        const { sessionId } = getValidatedData<{ sessionId: string }>(c);
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Convert sessionId to number if needed
        const sessionIdNum = sessionId;

        // Find the session
        const session = await db.query.sessions.findFirst({
            where: (fields, { and, eq }) => and(
                eq(sessions.id, sessionIdNum),
                eq(sessions.userId, userId)
            )
        });

        if (!session) {
            return c.json({
                success: false,
                message: 'Session not found'
            }, 404);
        }

        // Invalidate the session
        await invalidateSession(sessionIdNum);

        return c.json({
            success: true,
            message: 'Device logged out successfully'
        });
    } catch (error) {
        console.error('Error in logoutDevice:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (c: Context) => {
    try {
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Invalidate all sessions for the user
        await invalidateUserSessions(userId);

        return c.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    } catch (error) {
        console.error('Error in logoutAll:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Refresh token
 */
export const refreshToken = async (c: Context) => {
    try {
        const { refreshToken, pin } = getValidatedData<{
            refreshToken: string;
            pin: string;
        }>(c);

        // Refresh session
        const result = await refreshSession(refreshToken, pin);

        return c.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                isPinRequired: false
            }
        });
    } catch (error) {
        console.error('Error in refreshToken:', error);
        if (error instanceof Error) {
            return c.json({
                success: false,
                message: error.message
            }, 401);
        }
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Resend password reset code
 */
export const resendPasswordResetCode = async (c: Context) => {
    try {
        const { email } = getValidatedData<{ email: string }>(c);

        // Find user
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        // Don't reveal if the user exists or not for security
        if (!user) {
            return c.json({
                success: true,
                message: 'If your email is registered, you will receive a password reset code'
            });
        }

        // Generate new reset code
        const resetCode = generateResetCode();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

        // Update user with new reset code
        await db.update(users)
            .set({
                resetPasswordCode: resetCode,
                resetPasswordExpires: resetExpires
            })
            .where(eq(users.id, user.id));

        // Send password reset email
        await sendPasswordResetEmail(user.email, user.name, resetCode);

        return c.json({
            success: true,
            message: 'If your email is registered, you will receive a password reset code'
        });
    } catch (error) {
        console.error('Error in resendPasswordResetCode:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
}; 