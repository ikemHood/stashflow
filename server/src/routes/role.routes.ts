import { Hono } from 'hono';
import {
    getAllRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    getAllPermissions,
    createPermission,
    assignRoleToUser,
    removeRoleFromUser,
    getUserRoles
} from '../controllers/role.controller';
import { auth } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

// Create roles router
const roleRouter = new Hono();

// Apply authentication to all role routes
roleRouter.use('*', auth());

// Role routes - only admins or users with specific permissions can access
roleRouter.get('/', authorize(['role:read', 'role:all']), getAllRoles);
roleRouter.get('/:id', authorize(['role:read', 'role:all']), getRole);
roleRouter.post('/', authorize(['role:create', 'role:all']), createRole);
roleRouter.put('/:id', authorize(['role:update', 'role:all']), updateRole);
roleRouter.delete('/:id', authorize(['role:delete', 'role:all']), deleteRole);

// Permission routes
roleRouter.get('/permissions/all', authorize(['permission:read', 'permission:all']), getAllPermissions);
roleRouter.post('/permissions', authorize(['permission:create', 'permission:all']), createPermission);

// User-role management routes
roleRouter.post('/assign', authorize(['role:assign', 'role:all']), assignRoleToUser);
roleRouter.post('/unassign', authorize(['role:assign', 'role:all']), removeRoleFromUser);
roleRouter.get('/user/:userId', authorize(['role:read', 'role:all']), getUserRoles);

export default roleRouter; 