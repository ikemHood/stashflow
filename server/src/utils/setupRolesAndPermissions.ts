import { db } from '../db';
import { roles, permissions, rolePermissions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Define the system roles
const systemRoles = [
    {
        name: 'admin',
        description: 'Administrator with full system access',
        isSystem: true
    },
    {
        name: 'user',
        description: 'Regular user with limited access',
        isSystem: true
    },
    {
        name: 'token_manager',
        description: 'User who can manage token operations',
        isSystem: true
    }
];

// Define the system permissions
const systemPermissions = [
    // Token permissions
    { name: 'token:create', description: 'Create new tokens', resource: 'token', action: 'create' },
    { name: 'token:read', description: 'View tokens', resource: 'token', action: 'read' },
    { name: 'token:update', description: 'Update existing tokens', resource: 'token', action: 'update' },
    { name: 'token:delete', description: 'Delete tokens', resource: 'token', action: 'delete' },
    { name: 'token:all', description: 'Full access to token operations', resource: 'token', action: 'all' },

    // User permissions
    { name: 'user:create', description: 'Create new users', resource: 'user', action: 'create' },
    { name: 'user:read', description: 'View user information', resource: 'user', action: 'read' },
    { name: 'user:update', description: 'Update user information', resource: 'user', action: 'update' },
    { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },
    { name: 'user:all', description: 'Full access to user operations', resource: 'user', action: 'all' },

    // Role permissions
    { name: 'role:create', description: 'Create new roles', resource: 'role', action: 'create' },
    { name: 'role:read', description: 'View roles', resource: 'role', action: 'read' },
    { name: 'role:update', description: 'Update existing roles', resource: 'role', action: 'update' },
    { name: 'role:delete', description: 'Delete roles', resource: 'role', action: 'delete' },
    { name: 'role:assign', description: 'Assign roles to users', resource: 'role', action: 'assign' },
    { name: 'role:all', description: 'Full access to role operations', resource: 'role', action: 'all' },

    // Permission permissions
    { name: 'permission:create', description: 'Create new permissions', resource: 'permission', action: 'create' },
    { name: 'permission:read', description: 'View permissions', resource: 'permission', action: 'read' },
    { name: 'permission:update', description: 'Update existing permissions', resource: 'permission', action: 'update' },
    { name: 'permission:delete', description: 'Delete permissions', resource: 'permission', action: 'delete' },
    { name: 'permission:all', description: 'Full access to permission operations', resource: 'permission', action: 'all' },

    // Milestone permissions
    { name: 'milestone:create', description: 'Create new milestones', resource: 'milestone', action: 'create' },
    { name: 'milestone:read', description: 'View milestones', resource: 'milestone', action: 'read' },
    { name: 'milestone:update', description: 'Update existing milestones', resource: 'milestone', action: 'update' },
    { name: 'milestone:delete', description: 'Delete milestones', resource: 'milestone', action: 'delete' },
    { name: 'milestone:all', description: 'Full access to milestone operations', resource: 'milestone', action: 'all' },

    // Wallet permissions
    { name: 'wallet:create', description: 'Connect new wallets', resource: 'wallet', action: 'create' },
    { name: 'wallet:read', description: 'View wallet information', resource: 'wallet', action: 'read' },
    { name: 'wallet:update', description: 'Update wallet information', resource: 'wallet', action: 'update' },
    { name: 'wallet:delete', description: 'Disconnect wallets', resource: 'wallet', action: 'delete' },
    { name: 'wallet:all', description: 'Full access to wallet operations', resource: 'wallet', action: 'all' },

    // Transaction permissions
    { name: 'transaction:create', description: 'Create new transactions', resource: 'transaction', action: 'create' },
    { name: 'transaction:read', description: 'View transactions', resource: 'transaction', action: 'read' },
    { name: 'transaction:update', description: 'Update transaction information', resource: 'transaction', action: 'update' },
    { name: 'transaction:delete', description: 'Delete transactions', resource: 'transaction', action: 'delete' },
    { name: 'transaction:all', description: 'Full access to transaction operations', resource: 'transaction', action: 'all' },
];

// Define role-permission mappings
const rolePermissionMappings = [
    // Admin role has all permissions
    { roleName: 'admin', permissions: systemPermissions.map(p => p.name) },

    // Regular user permissions
    {
        roleName: 'user',
        permissions: [
            'milestone:create', 'milestone:read', 'milestone:update', 'milestone:delete',
            'wallet:create', 'wallet:read', 'wallet:update', 'wallet:delete',
            'transaction:create', 'transaction:read',
            'token:read',
            'user:read'
        ]
    },

    // Token manager permissions
    {
        roleName: 'token_manager',
        permissions: [
            'token:create', 'token:read', 'token:update', 'token:delete',
            'user:read'
        ]
    }
];

/**
 * Set up initial system roles and permissions
 */
export async function setupRolesAndPermissions() {
    try {
        console.log('Setting up roles and permissions...');

        // Create roles if they don't exist
        for (const role of systemRoles) {
            const existingRole = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);

            if (existingRole.length === 0) {
                console.log(`Creating role: ${role.name}`);
                await db.insert(roles).values(role);
            }
        }

        // Create permissions if they don't exist
        for (const permission of systemPermissions) {
            const existingPermission = await db.select().from(permissions).where(eq(permissions.name, permission.name)).limit(1);

            if (existingPermission.length === 0) {
                console.log(`Creating permission: ${permission.name}`);
                await db.insert(permissions).values(permission);
            }
        }

        // Create role-permission mappings
        for (const mapping of rolePermissionMappings) {
            // Get role ID
            const role = await db.select().from(roles).where(eq(roles.name, mapping.roleName)).limit(1);

            if (role.length === 0) {
                console.error(`Role '${mapping.roleName}' not found, skipping permission assignments`);
                continue;
            }

            const roleId = role[0].id;

            // Process each permission
            for (const permissionName of mapping.permissions) {
                // Get permission ID
                const permission = await db.select().from(permissions).where(eq(permissions.name, permissionName)).limit(1);

                if (permission.length === 0) {
                    console.error(`Permission '${permissionName}' not found, skipping assignment`);
                    continue;
                }

                const permissionId = permission[0].id;

                // Check if mapping already exists
                const existingMapping = await db.select()
                    .from(rolePermissions)
                    .where(and(
                        eq(rolePermissions.roleId, roleId),
                        eq(rolePermissions.permissionId, permissionId)
                    ))
                    .limit(1);

                if (existingMapping.length === 0) {
                    console.log(`Assigning permission '${permissionName}' to role '${mapping.roleName}'`);
                    await db.insert(rolePermissions).values({
                        roleId,
                        permissionId
                    });
                }
            }
        }

        console.log('Roles and permissions setup completed successfully');
    } catch (error) {
        console.error('Error setting up roles and permissions:', error);
    }
} 