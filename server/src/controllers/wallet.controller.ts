import type { Context } from 'hono';
import { db } from '../db';
import { wallets } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Connect a new wallet
 */
export const connectWallet = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');
        const { walletType, walletAddress, metadata } = await c.req.json();

        // Check if wallet already exists
        const existingWallet = await db.query.wallets.findFirst({
            where: and(
                eq(wallets.userId, userId),
                eq(wallets.walletAddress, walletAddress)
            )
        });

        if (existingWallet) {
            return c.json({ message: 'Wallet already connected' }, 400);
        }

        // Create wallet
        const result = await db.insert(wallets).values({
            userId,
            walletType,
            walletAddress,
            metadata
        }).returning();

        const wallet = result[0];

        return c.json({
            message: 'Wallet connected successfully',
            data: wallet
        }, 201);
    } catch (error) {
        console.error('Error in connectWallet:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
};

/**
 * Get user's wallets
 */
export const getWallets = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');

        const userWallets = await db.query.wallets.findMany({
            where: eq(wallets.userId, userId),
            orderBy: (wallets, { desc }) => [desc(wallets.createdAt)]
        });

        return c.json({
            message: 'Wallets retrieved successfully',
            data: userWallets
        });
    } catch (error) {
        console.error('Error in getWallets:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
};

/**
 * Set default wallet
 */
export const setDefaultWallet = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');
        const id = c.req.param('id');

        // Check if wallet exists and belongs to user
        const existingWallet = await db.query.wallets.findFirst({
            where: and(
                eq(wallets.id, id),
                eq(wallets.userId, userId)
            )
        });

        if (!existingWallet) {
            return c.json({ message: 'Wallet not found' }, 404);
        }

        // Reset all wallets to non-default
        await db.update(wallets)
            .set({ isDefault: false })
            .where(eq(wallets.userId, userId));

        // Set the selected wallet as default
        await db.update(wallets)
            .set({ isDefault: true })
            .where(and(
                eq(wallets.id, id),
                eq(wallets.userId, userId)
            ));

        return c.json({
            message: 'Default wallet updated successfully'
        });
    } catch (error) {
        console.error('Error in setDefaultWallet:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
};

/**
 * Delete a wallet
 */
export const disconnectWallet = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');
        const id = c.req.param('id');

        // Check if wallet exists and belongs to user
        const existingWallet = await db.query.wallets.findFirst({
            where: and(
                eq(wallets.id, id),
                eq(wallets.userId, userId)
            )
        });

        if (!existingWallet) {
            return c.json({ message: 'Wallet not found' }, 404);
        }

        // Delete wallet
        await db.delete(wallets)
            .where(and(
                eq(wallets.id, id),
                eq(wallets.userId, userId)
            ));

        return c.json({
            message: 'Wallet disconnected successfully'
        });
    } catch (error) {
        console.error('Error in disconnectWallet:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
}; 