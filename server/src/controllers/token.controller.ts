import type { Context } from 'hono';
import { db } from '../db';
import { tokens } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { getValidatedData } from '../utils/validation';

/**
 * Get all tokens
 */
export const getAllTokens = async (c: Context) => {
    try {
        const { search, limit = 20, offset = 0, active } = c.req.query();

        // Build conditions
        const searchCondition = search
            ? sql`(${tokens.name} ILIKE ${'%' + search + '%'} OR ${tokens.symbol} ILIKE ${'%' + search + '%'})`
            : sql`1=1`;

        const activeCondition = active !== undefined
            ? eq(tokens.isActive, active === 'true')
            : sql`1=1`;

        // Execute query with all conditions
        const result = await db.select()
            .from(tokens)
            .where(and(searchCondition, activeCondition))
            .orderBy(desc(tokens.createdAt))
            .limit(Number(limit))
            .offset(Number(offset));

        // Get total count for pagination
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(tokens);

        return c.json({
            success: true,
            data: {
                tokens: result,
                pagination: {
                    total: countResult[0].count,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllTokens:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve tokens',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Get token by ID or address
 */
export const getToken = async (c: Context) => {
    try {
        const idOrAddress = c.req.param('idOrAddress');

        // Check if this is a UUID (looking for token by ID) or an address
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrAddress);

        let token;
        if (isUuid) {
            token = await db.select().from(tokens).where(eq(tokens.id, idOrAddress)).limit(1);
        } else {
            token = await db.select().from(tokens).where(eq(tokens.address, idOrAddress)).limit(1);
        }

        if (!token.length) {
            return c.json({
                success: false,
                message: 'Token not found'
            }, 404);
        }

        return c.json({
            success: true,
            data: {
                token: token[0]
            }
        });
    } catch (error) {
        console.error('Error in getToken:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve token',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Create a new token
 */
export const createToken = async (c: Context) => {
    try {
        const { address, name, symbol, decimals, image } = getValidatedData<{
            address: string;
            name: string;
            symbol: string;
            decimals: number;
            image?: string;
        }>(c);

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if address already exists
        const existingToken = await db.select()
            .from(tokens)
            .where(eq(tokens.address, address))
            .limit(1);

        if (existingToken.length > 0) {
            return c.json({
                success: false,
                message: 'Token with this address already exists'
            }, 409);
        }

        // Create the token
        const result = await db.insert(tokens).values({
            address,
            name,
            symbol,
            decimals,
            image,
            createdBy: userId,
            isActive: true
        }).returning();

        return c.json({
            success: true,
            message: 'Token created successfully',
            data: {
                token: result[0]
            }
        }, 201);
    } catch (error) {
        console.error('Error in createToken:', error);
        return c.json({
            success: false,
            message: 'Failed to create token',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Update an existing token
 */
export const updateToken = async (c: Context) => {
    try {
        const tokenId = c.req.param('id');
        const { name, symbol, decimals, image, isActive } = getValidatedData<{
            name?: string;
            symbol?: string;
            decimals?: number;
            image?: string;
            isActive?: boolean;
        }>(c);

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if token exists
        const existingToken = await db.select()
            .from(tokens)
            .where(eq(tokens.id, tokenId))
            .limit(1);

        if (existingToken.length === 0) {
            return c.json({
                success: false,
                message: 'Token not found'
            }, 404);
        }

        // Build update data
        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (symbol !== undefined) updateData.symbol = symbol;
        if (decimals !== undefined) updateData.decimals = decimals;
        if (image !== undefined) updateData.image = image;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Add updatedAt
        updateData.updatedAt = new Date();

        // If no fields to update
        if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
            return c.json({
                success: false,
                message: 'No fields to update'
            }, 400);
        }

        // Update the token
        const result = await db.update(tokens)
            .set(updateData)
            .where(eq(tokens.id, tokenId))
            .returning();

        return c.json({
            success: true,
            message: 'Token updated successfully',
            data: {
                token: result[0]
            }
        });
    } catch (error) {
        console.error('Error in updateToken:', error);
        return c.json({
            success: false,
            message: 'Failed to update token',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
};

/**
 * Delete a token (deactivate)
 * Note: We're soft-deleting by setting isActive to false
 */
export const deleteToken = async (c: Context) => {
    try {
        const tokenId = c.req.param('id');

        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if token exists
        const existingToken = await db.select()
            .from(tokens)
            .where(eq(tokens.id, tokenId))
            .limit(1);

        if (existingToken.length === 0) {
            return c.json({
                success: false,
                message: 'Token not found'
            }, 404);
        }

        // Set token as inactive (soft delete)
        await db.update(tokens)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(tokens.id, tokenId));

        return c.json({
            success: true,
            message: 'Token deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteToken:', error);
        return c.json({
            success: false,
            message: 'Failed to delete token',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
}; 