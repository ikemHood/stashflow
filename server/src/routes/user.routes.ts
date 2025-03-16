import { Hono } from 'hono';
import { z } from 'zod';
import * as userController from '../controllers/user.controller';
import { auth } from '../middleware/auth';
import { validateRequest } from '../utils/validation';

// Validation schemas
const signupSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(1, { message: "Password is required" }),
    deviceName: z.string().optional()
});

const verifyEmailSchema = z.object({
    code: z.string().length(6, { message: "Verification code must be 6 characters" })
});

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email format" })
});

const resetPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    code: z.string().length(6, { message: "Reset code must be exactly 6 digits" }),
    newPassword: z.string().min(6, { message: "New password must be at least 6 characters" })
});

// Session-based authentication schemas
const setPinSchema = z.object({
    pin: z.string().regex(/^\d{6}$/, { message: "PIN must be exactly 6 digits" })
});

const refreshTokenSchema = z.object({
    refreshToken: z.string({ required_error: "Refresh token is required" }),
    pin: z.string().regex(/^\d{6}$/, { message: "PIN must be exactly 6 digits" })
});

const renameDeviceSchema = z.object({
    sessionId: z.string({ required_error: "Session ID is required" }),
    deviceName: z.string().min(1, { message: "Device name is required" })
});

const logoutDeviceSchema = z.object({
    sessionId: z.string({ required_error: "Session ID is required" })
});

// Create a user router
const userRouter = new Hono();

// Public routes
userRouter.post('/signup', validateRequest(signupSchema), userController.signup);
userRouter.post('/login', validateRequest(loginSchema), userController.login);
userRouter.post('/password/forgot', validateRequest(forgotPasswordSchema), userController.forgotPassword);
userRouter.post('/password/reset', validateRequest(resetPasswordSchema), userController.resetPassword);
userRouter.post('/password/resend', validateRequest(forgotPasswordSchema), userController.resendPasswordResetCode);
userRouter.post('/token/refresh', validateRequest(refreshTokenSchema), userController.refreshToken);

// Protected routes
userRouter.get('/me', auth(), userController.getUser);
userRouter.post('/email/verify', auth(), validateRequest(verifyEmailSchema), userController.verifyEmail);
userRouter.post('/email/resend', auth(), userController.resendVerificationCode);
userRouter.post('/device/pin', auth(), validateRequest(setPinSchema), userController.setDevicePin);
userRouter.get('/devices', auth(), userController.getDevices);
userRouter.post('/device/rename', auth(), validateRequest(renameDeviceSchema), userController.renameDevice);
userRouter.post('/device/logout', auth(), validateRequest(logoutDeviceSchema), userController.logoutDevice);
userRouter.post('/logout', auth(), userController.logout);
userRouter.post('/logout-all', auth(), userController.logoutAll);

export default userRouter; 