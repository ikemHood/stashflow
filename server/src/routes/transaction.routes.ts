import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as transactionController from '../controllers/transaction.controller';
import { auth } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

// Validation schemas
const transactionSchema = z.object({
    amount: z.number().positive(),
    walletAddress: z.string().optional(),
    txHash: z.string().optional(),
    metadata: z.record(z.any()).optional()
});

// Create a transaction router
const transactionRouter = new Hono();

// Protected routes - all transaction routes require authentication
transactionRouter.use('*', auth());

// Routes with authorization
transactionRouter.post('/milestones/:milestoneId/deposit',
    authorize(['transaction:create', 'transaction:all']),
    zValidator('json', transactionSchema),
    transactionController.deposit
);

transactionRouter.post('/milestones/:milestoneId/withdraw',
    authorize(['transaction:create', 'transaction:all']),
    zValidator('json', transactionSchema),
    transactionController.withdraw
);

transactionRouter.get('/milestones/:milestoneId/transactions',
    authorize(['transaction:read', 'transaction:all']),
    transactionController.getMilestoneTransactions
);

export default transactionRouter; 