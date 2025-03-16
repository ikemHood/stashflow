import {
    pgTable,
    text,
    timestamp,
    varchar,
    boolean,
    numeric,
    pgEnum,
    date,
    integer,
    json,
    uuid,
    primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const savingMethodEnum = pgEnum('saving_method', ['manual', 'automatic', 'recurring']);
export const savingFrequencyEnum = pgEnum('saving_frequency', ['daily', 'weekly', 'bi-weekly', 'monthly']);

// Users table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    isVerified: boolean('is_verified').default(false),
    verificationCode: varchar('verification_code', { length: 6 }),
    verificationCodeExpires: timestamp('verification_code_expires'),
    resetPasswordCode: varchar('reset_password_code', { length: 64 }),
    resetPasswordExpires: timestamp('reset_password_expires'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Roles table
export const roles = pgTable('roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    isSystem: boolean('is_system').default(false), // For system-defined roles
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Permissions table
export const permissions = pgTable('permissions', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(), // e.g., "token:create", "token:update"
    description: text('description'),
    resource: varchar('resource', { length: 100 }).notNull(), // e.g., "token", "user"
    action: varchar('action', { length: 100 }).notNull(), // e.g., "create", "read", "update", "delete", "all"
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Role-Permission mapping (many-to-many)
export const rolePermissions = pgTable('role_permissions', {
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] })
]);

// User-Role mapping (many-to-many)
export const userRoles = pgTable('user_roles', {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow(),
    assignedBy: uuid('assigned_by').references(() => users.id),
}, (table) => [
    primaryKey({ columns: [table.userId, table.roleId] })
]);

// Sessions table
export const sessions = pgTable('sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    refreshToken: varchar('refresh_token', { length: 255 }).notNull(),
    pin: varchar('pin', { length: 255 }), // Hashed 6-digit PIN for token refresh - device specific
    deviceName: varchar('device_name', { length: 255 }), // Optional device identifier
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastUsedAt: timestamp('last_used_at').defaultNow(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    isActive: boolean('is_active').default(true),
});

export const tokens = pgTable('tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    address: varchar('address', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    symbol: varchar('symbol', { length: 255 }).notNull(),
    decimals: integer('decimals').notNull(),
    image: varchar('image', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Milestones (Savings Goals) table
export const milestones = pgTable('milestones', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    contractMilestoneId: numeric('contract_milestone_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    image: varchar('image', { length: 255 }),
    tokenAddress: varchar('token_address', { length: 255 }).notNull().references(() => tokens.address, { onDelete: 'cascade' }),
    targetAmount: numeric('target_amount', { precision: 18, scale: 2 }).notNull(),
    currentAmount: numeric('current_amount', { precision: 18, scale: 2 }).default('0'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    savingMethod: savingMethodEnum('saving_method').default('manual'),
    savingFrequency: savingFrequencyEnum('saving_frequency').default('monthly'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Wallet table (connected crypto wallets)
export const wallets = pgTable('wallets', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    walletType: varchar('wallet_type', { length: 50 }).notNull(), // MetaMask, WalletConnect, etc.
    walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
    isDefault: boolean('is_default').default(false),
    metadata: json('metadata'), // Additional wallet data
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Transactions table (deposits and withdrawals)
export const transactions = pgTable('transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    milestoneId: uuid('milestone_id').notNull().references(() => milestones.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    transactionType: varchar('transaction_type', { length: 20 }).notNull(), // deposit, withdrawal
    status: varchar('status', { length: 20 }).notNull().default('completed'), // pending, completed, failed
    txHash: varchar('tx_hash', { length: 255 }), // Blockchain transaction hash
    walletAddress: varchar('wallet_address', { length: 255 }), // Wallet address involved in transaction
    metadata: json('metadata'), // Any additional transaction data
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    milestones: many(milestones),
    wallets: many(wallets),
    sessions: many(sessions),
    userRoles: many(userRoles),
    tokensCreated: many(tokens, { relationName: 'creator' }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
    rolePermissions: many(rolePermissions),
    userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
    permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, { fields: [userRoles.userId], references: [users.id] }),
    role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
    assignedByUser: one(users, { fields: [userRoles.assignedBy], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const tokensRelations = relations(tokens, ({ one, many }) => ({
    creator: one(users, { fields: [tokens.createdBy], references: [users.id] }),
    milestones: many(milestones),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
    user: one(users, { fields: [milestones.userId], references: [users.id] }),
    transactions: many(transactions),
    token: one(tokens, { fields: [milestones.tokenAddress], references: [tokens.address] }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
    user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    milestone: one(milestones, { fields: [transactions.milestoneId], references: [milestones.id] }),
})); 