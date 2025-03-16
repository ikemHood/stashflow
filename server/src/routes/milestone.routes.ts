import { Hono } from 'hono';
import { z } from 'zod';
import { validateRequest } from '../utils/validation';
import { auth } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import {
    getMilestones,
    getMilestone,
    createMilestone,
    updateMilestone,
    deleteMilestone
} from '../controllers/milestone.controller';
import { isAddress } from 'viem';

const app = new Hono();

// Milestone validation schemas
const createMilestoneSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    targetAmount: z.number().positive({ message: "Target amount must be positive" }),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date format"
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "End date must be a valid date format"
    }),
    tokenAddress: z.string().refine((address) => isAddress(address), {
        message: "Token address must be a valid Ethereum address"
    }),
    contractMilestoneId: z.number().positive({ message: "Contract milestone ID must be positive" }),
    description: z.string().optional(),
    currency: z.enum(['USDT', 'USDC', 'DAI', 'BUSD']).optional(),
    savingMethod: z.enum(['manual', 'automatic', 'recurring']).optional(),
    savingFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']).optional()
});

const updateMilestoneSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
    targetAmount: z.number().positive({ message: "Target amount must be positive" }).optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Start date must be a valid date format"
    }).optional(),
    contractMilestoneId: z.number().positive({ message: "Contract milestone ID must be positive" }).optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "End date must be a valid date format"
    }).optional(),
    description: z.string().optional(),
    currency: z.enum(['USDT', 'USDC', 'DAI', 'BUSD']).optional(),
    savingMethod: z.enum(['manual', 'automatic', 'recurring']).optional(),
    savingFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']).optional()
});

// Apply auth middleware to all routes
app.use('*', auth());

// Routes with authorization
app.get('/', getMilestones);
app.get('/:id', getMilestone);
app.post('/', validateRequest(createMilestoneSchema), createMilestone);
app.put('/:id', validateRequest(updateMilestoneSchema), updateMilestone);
app.delete('/:id', deleteMilestone);

export default app; 