import type { Context, Next } from 'hono';
import { authenticate } from '../utils/auth';


/**
 * Middleware to authenticate a user based on JWT
 */
export const auth = () => {
    return async (c: Context, next: Next) => {
        const isAuthenticated = await authenticate(c.req, c);

        if (!isAuthenticated) {
            return c.json({ message: 'Unauthorized: Invalid or expired session' }, 401);
        }

        await next();
    };
};

export default auth; 