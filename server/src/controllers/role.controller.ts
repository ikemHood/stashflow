import type { Context } from 'hono';
import { db } from '../db';
import { roles, permissions, rolePermissions, userRoles, users } from '../db/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { getValidatedData } from '../utils/validation';

/**
 * Get all roles with optional pagination and filtering
 */
export const getAllRoles = async (c: Context) => {
    try {
        const { search, limit = 20, offset = 0 } = c.req.query();

        // Execute the query with all conditions in a single where clause
        const result = await db.select()
            .from(roles)
            .where(
                search ? sql`${roles.name} ILIKE ${'%' + search + '%'}` : sql`1=1`
            )
            .orderBy(desc(roles.createdAt))
            .limit(Number(limit))
            .offset(Number(offset));

        // Get total count for pagination
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(roles);

        return c.json({
            success: true,
            data: {
                roles: result,
                pagination: {
                    total: countResult[0].count,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllRoles:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve roles',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Get a single role by ID with its permissions
 */
export const getRole = async (c: Context) => {
    try {
        const roleId = c.req.param('id');

        // Get the role
        const role = await db.select()
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (role.length === 0) {
            return c.json({
                success: false,
                message: 'Role not found'
            }, 404);
        }

        // Get all permissions for this role
        const rolePerms = await db.select({
            permission: permissions
        })
            .from(permissions)
            .innerJoin(
                rolePermissions,
                eq(rolePermissions.permissionId, permissions.id)
            )
            .where(eq(rolePermissions.roleId, roleId));

        // Format the permissions
        const formattedPermissions = rolePerms.map(rp => rp.permission);

        return c.json({
            success: true,
            data: {
                role: role[0],
                permissions: formattedPermissions
            }
        });
    } catch (error) {
        console.error('Error in getRole:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve role',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Create a new role
 */
export const createRole = async (c: Context) => {
    try {
        const { name, description, permissionIds } = getValidatedData<{
            name: string;
            description?: string;
            permissionIds?: string[];
        }>(c);

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if role with this name already exists
        const existingRole = await db.select()
            .from(roles)
            .where(eq(roles.name, name))
            .limit(1);

        if (existingRole.length > 0) {
            return c.json({
                success: false,
                message: 'Role with this name already exists'
            }, 409);
        }

        // Start a transaction
        const result = await db.transaction(async (tx) => {
            // Create the role
            const newRole = await tx.insert(roles).values({
                name,
                description,
                isSystem: false
            }).returning();

            const roleId = newRole[0].id;

            // Add permissions if provided
            if (permissionIds && permissionIds.length > 0) {
                // Verify all permissions exist
                const existingPermissions = await tx.select()
                    .from(permissions)
                    .where(inArray(permissions.id, permissionIds));

                if (existingPermissions.length !== permissionIds.length) {
                    throw new Error('One or more permission IDs are invalid');
                }

                // Add each permission to the role
                const rolePermEntries = permissionIds.map(permId => ({
                    roleId,
                    permissionId: permId
                }));

                await tx.insert(rolePermissions).values(rolePermEntries);
            }

            return newRole[0];
        });

        return c.json({
            success: true,
            message: 'Role created successfully',
            data: {
                role: result
            }
        }, 201);
    } catch (error) {
        console.error('Error in createRole:', error);
        return c.json({
            success: false,
            message: 'Failed to create role',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Update an existing role
 */
export const updateRole = async (c: Context) => {
    try {
        const roleId = c.req.param('id');
        const { name, description, permissionIds } = getValidatedData<{
            name?: string;
            description?: string;
            permissionIds?: string[];
        }>(c);

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if role exists and is not a system role
        const existingRole = await db.select()
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (existingRole.length === 0) {
            return c.json({
                success: false,
                message: 'Role not found'
            }, 404);
        }

        // Cannot modify system roles
        if (existingRole[0].isSystem) {
            return c.json({
                success: false,
                message: 'Cannot modify system roles'
            }, 403);
        }

        // Check if new name is already taken by another role
        if (name) {
            const roleWithSameName = await db.select()
                .from(roles)
                .where(and(
                    eq(roles.name, name),
                    sql`${roles.id} != ${roleId}`
                ))
                .limit(1);

            if (roleWithSameName.length > 0) {
                return c.json({
                    success: false,
                    message: 'Another role with this name already exists'
                }, 409);
            }
        }

        // Start a transaction
        const result = await db.transaction(async (tx) => {
            // Update role details if provided
            const updateData: Record<string, any> = { updatedAt: new Date() };
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;

            // Update the role
            const updatedRole = await tx.update(roles)
                .set(updateData)
                .where(eq(roles.id, roleId))
                .returning();

            // Update permissions if provided
            if (permissionIds !== undefined) {
                // First delete all existing permissions for this role
                await tx.delete(rolePermissions)
                    .where(eq(rolePermissions.roleId, roleId));

                // Add new permissions if there are any
                if (permissionIds.length > 0) {
                    // Verify all permissions exist
                    const existingPermissions = await tx.select()
                        .from(permissions)
                        .where(inArray(permissions.id, permissionIds));

                    if (existingPermissions.length !== permissionIds.length) {
                        throw new Error('One or more permission IDs are invalid');
                    }

                    // Add each permission to the role
                    const rolePermEntries = permissionIds.map(permId => ({
                        roleId,
                        permissionId: permId
                    }));

                    await tx.insert(rolePermissions).values(rolePermEntries);
                }
            }

            return updatedRole[0];
        });

        return c.json({
            success: true,
            message: 'Role updated successfully',
            data: {
                role: result
            }
        });
    } catch (error) {
        console.error('Error in updateRole:', error);
        return c.json({
            success: false,
            message: 'Failed to update role',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Delete a role
 */
export const deleteRole = async (c: Context) => {
    try {
        const roleId = c.req.param('id');

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if role exists and is not a system role
        const existingRole = await db.select()
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (existingRole.length === 0) {
            return c.json({
                success: false,
                message: 'Role not found'
            }, 404);
        }

        // Cannot delete system roles
        if (existingRole[0].isSystem) {
            return c.json({
                success: false,
                message: 'Cannot delete system roles'
            }, 403);
        }

        // Delete the role (cascade will handle related records)
        await db.delete(roles).where(eq(roles.id, roleId));

        return c.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteRole:', error);
        return c.json({
            success: false,
            message: 'Failed to delete role',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Get all permissions
 */
export const getAllPermissions = async (c: Context) => {
    try {
        const allPermissions = await db.select().from(permissions);

        return c.json({
            success: true,
            data: {
                permissions: allPermissions
            }
        });
    } catch (error) {
        console.error('Error in getAllPermissions:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve permissions',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Create a new permission
 */
export const createPermission = async (c: Context) => {
    try {
        const { name, resource, action, description } = getValidatedData<{
            name: string;
            resource: string;
            action: string;
            description?: string;
        }>(c);

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if permission already exists
        const existingPermission = await db.select()
            .from(permissions)
            .where(eq(permissions.name, name))
            .limit(1);

        if (existingPermission.length > 0) {
            return c.json({
                success: false,
                message: 'Permission with this name already exists'
            }, 409);
        }

        // Create the permission
        const result = await db.insert(permissions).values({
            name,
            resource,
            action,
            description
        }).returning();

        return c.json({
            success: true,
            message: 'Permission created successfully',
            data: {
                permission: result[0]
            }
        }, 201);
    } catch (error) {
        console.error('Error in createPermission:', error);
        return c.json({
            success: false,
            message: 'Failed to create permission',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Assign a role to a user
 */
export const assignRoleToUser = async (c: Context) => {
    try {
        const { userId, roleId } = getValidatedData<{
            userId: string;
            roleId: string;
        }>(c);

        const adminId = c.get('user')?.id;

        if (!adminId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if user exists
        const userExists = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (userExists.length === 0) {
            return c.json({
                success: false,
                message: 'User not found'
            }, 404);
        }

        // Check if role exists
        const roleExists = await db.select()
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (roleExists.length === 0) {
            return c.json({
                success: false,
                message: 'Role not found'
            }, 404);
        }

        // Check if the user already has this role
        const existingAssignment = await db.select()
            .from(userRoles)
            .where(and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            ))
            .limit(1);

        if (existingAssignment.length > 0) {
            return c.json({
                success: false,
                message: 'User already has this role'
            }, 409);
        }

        // Assign the role to the user
        await db.insert(userRoles).values({
            userId,
            roleId,
            assignedBy: adminId
        });

        return c.json({
            success: true,
            message: 'Role assigned to user successfully'
        });
    } catch (error) {
        console.error('Error in assignRoleToUser:', error);
        return c.json({
            success: false,
            message: 'Failed to assign role to user',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Remove a role from a user
 */
export const removeRoleFromUser = async (c: Context) => {
    try {
        const { userId, roleId } = getValidatedData<{
            userId: string;
            roleId: string;
        }>(c);

        const adminId = c.get('user')?.id;

        if (!adminId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if the assignment exists
        const existingAssignment = await db.select()
            .from(userRoles)
            .where(and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            ))
            .limit(1);

        if (existingAssignment.length === 0) {
            return c.json({
                success: false,
                message: 'User does not have this role'
            }, 404);
        }

        // Remove the role from the user
        await db.delete(userRoles)
            .where(and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            ));

        return c.json({
            success: true,
            message: 'Role removed from user successfully'
        });
    } catch (error) {
        console.error('Error in removeRoleFromUser:', error);
        return c.json({
            success: false,
            message: 'Failed to remove role from user',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Get all roles assigned to a user
 */
export const getUserRoles = async (c: Context) => {
    try {
        const userId = c.req.param('userId');

        // Check if user exists
        const userExists = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (userExists.length === 0) {
            return c.json({
                success: false,
                message: 'User not found'
            }, 404);
        }

        // Get all roles for this user
        const userRolesData = await db.select({
            role: roles
        })
            .from(roles)
            .innerJoin(
                userRoles,
                eq(userRoles.roleId, roles.id)
            )
            .where(eq(userRoles.userId, userId));

        // Format the roles
        const formattedRoles = userRolesData.map(ur => ur.role);

        return c.json({
            success: true,
            data: {
                roles: formattedRoles
            }
        });
    } catch (error) {
        console.error('Error in getUserRoles:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve user roles',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
}; 