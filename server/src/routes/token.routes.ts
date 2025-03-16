import { Hono } from 'hono';
import { getAllTokens, getToken, createToken, updateToken, deleteToken } from '../controllers/token.controller';
import { auth } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

// Create tokens router
const tokenRouter = new Hono();

// Apply authentication to all token routes
tokenRouter.use('*', auth());

// Routes that require specific permissions
tokenRouter.get('/', authorize(['token:read', 'token:all']), getAllTokens);
tokenRouter.get('/:idOrAddress', authorize(['token:read', 'token:all']), getToken);
tokenRouter.post('/', authorize(['token:create', 'token:all']), createToken);
tokenRouter.put('/:id', authorize(['token:update', 'token:all']), updateToken);
tokenRouter.delete('/:id', authorize(['token:delete', 'token:all']), deleteToken);

export default tokenRouter; 