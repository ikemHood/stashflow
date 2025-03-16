import type { Context, Next } from 'hono';
import { db } from '../db';
import { userRoles, rolePermissions, roles, permissions } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Middleware to check if a user has the required permissions
 * @param requiredPermissions Array of permission names the user needs to have at least one of
 * @returns Middleware function
 */
export const authorize = (requiredPermissions: string[]) => {
    return async (c: Context, next: Next) => {
        try {
            // Get the user from the context (set by the authenticate middleware)
            const user = c.get('user');

            if (!user) {
                return c.json({
                    success: false,
                    message: 'Authentication required'
                }, 401);
            }

            // If no permissions are required, allow access
            if (requiredPermissions.length === 0) {
                return await next();
            }

            // Get user roles
            const userRoleEntries = await db.select({
                roleId: userRoles.roleId
            })
                .from(userRoles)
                .where(eq(userRoles.userId, user.id));

            if (userRoleEntries.length === 0) {
                return c.json({
                    success: false,
                    message: 'User has no assigned roles'
                }, 403);
            }

            const roleIds = userRoleEntries.map(entry => entry.roleId);

            // Get permission IDs for the required permissions
            const permissionEntries = await db.select({
                id: permissions.id
            })
                .from(permissions)
                .where(inArray(permissions.name, requiredPermissions));

            if (permissionEntries.length === 0) {
                return c.json({
                    success: false,
                    message: 'Required permissions not found'
                }, 500);
            }

            const permissionIds = permissionEntries.map(entry => entry.id);

            // Check if the user has any of the required permissions through their roles
            const rolePermissionEntries = await db.select({
                roleId: rolePermissions.roleId,
                permissionId: rolePermissions.permissionId
            })
                .from(rolePermissions)
                .where(
                    and(
                        inArray(rolePermissions.roleId, roleIds),
                        inArray(rolePermissions.permissionId, permissionIds)
                    )
                );

            if (rolePermissionEntries.length === 0) {
                return c.json({
                    success: false,
                    message: 'Access denied: Insufficient permissions'
                }, 403);
            }

            // User has at least one of the required permissions
            return await next();
        } catch (error) {
            console.error('Authorization error:', error);
            return c.json({
                success: false,
                message: 'Authorization failed'
            }, 500);
        }
    };
};

/**
 * Checks if a user has the required permissions
 * 
 * @param userId User ID to check
 * @param requiredPermissions Array of permission names required (e.g., ['token:create', 'token:read'])
 * @returns boolean indicating if user has all required permissions
 */
export async function hasPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    // Special case for empty permissions (should never happen but added for safety)
    if (requiredPermissions.length === 0) return true;

    // Get all permissions the user has through their roles
    const userPermissions = await getUserPermissions(userId);

    // Check if user has all required permissions
    return requiredPermissions.every(permission =>
        userPermissions.some(userPerm =>
            userPerm === permission ||
            // Handle wildcard permissions like 'token:*' or '*:*'
            (userPerm.endsWith(':all') && userPerm.split(':')[0] === permission.split(':')[0]) ||
            userPerm === '*'
        )
    );
}

/**
 * Get all permissions a user has through their roles
 * 
 * @param userId User ID to get permissions for
 * @returns Array of permission names
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
    // Get all roles for the user
    const userRoleRecords = await db.select({
        roleId: userRoles.roleId
    })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

    if (userRoleRecords.length === 0) return [];

    const roleIds = userRoleRecords.map(r => r.roleId);

    // Get all permissions for those roles
    const permissionRecords = await db.select({
        permissionName: permissions.name,
        resource: permissions.resource,
        action: permissions.action
    })
        .from(permissions)
        .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));

    // Extract permission names and add 'resource:all' permissions
    const uniquePermissions = new Set<string>();

    permissionRecords.forEach(p => {
        // Add the specific permission
        uniquePermissions.add(p.permissionName);

        // If action is 'all', add 'resource:all'
        if (p.action === 'all') {
            uniquePermissions.add(`${p.resource}:all`);
        }
    });

    return Array.from(uniquePermissions);
}

/**
 * Helper function to check if user has admin role
 * For simpler cases where you just need to check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
    const adminRole = await db.select()
        .from(roles)
        .where(eq(roles.name, 'admin'))
        .limit(1);

    if (adminRole.length === 0) return false;

    const userHasAdminRole = await db.select()
        .from(userRoles)
        .where(and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, adminRole[0].id)
        ))
        .limit(1);

    return userHasAdminRole.length > 0;
}

export default authorize; 