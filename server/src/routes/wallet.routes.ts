import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as walletController from '../controllers/wallet.controller';
import { auth } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

// Validation schemas
const connectWalletSchema = z.object({
    walletType: z.string().min(2),
    walletAddress: z.string().min(10),
    metadata: z.record(z.any()).optional()
});

// Create a wallet router
const walletRouter = new Hono();

// Protected routes - all wallet routes require authentication
walletRouter.use('*', auth());

// Routes with authorization
walletRouter.post('/', authorize(['wallet:create', 'wallet:all']), zValidator('json', connectWalletSchema), walletController.connectWallet);
walletRouter.get('/', authorize(['wallet:read', 'wallet:all']), walletController.getWallets);
walletRouter.put('/:id/default', authorize(['wallet:update', 'wallet:all']), walletController.setDefaultWallet);
walletRouter.delete('/:id', authorize(['wallet:delete', 'wallet:all']), walletController.disconnectWallet);

export default walletRouter; 