import type { Context } from 'hono';
import { db } from '../db';
import { milestones, transactions } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Deposit funds to a milestone
 */
export const deposit = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');
        const milestoneId = c.req.param('milestoneId');
        const { amount, walletAddress, txHash, metadata } = await c.req.json();

        // Check if milestone exists and belongs to user
        const milestone = await db.query.milestones.findFirst({
            where: and(
                eq(milestones.id, milestoneId),
                eq(milestones.userId, userId)
            )
        });

        if (!milestone) {
            return c.json({ message: 'Milestone not found' }, 404);
        }

        // Begin transaction
        const result = await db.transaction(async (tx) => {
            // Create transaction record
            const txResult = await tx.insert(transactions).values({
                milestoneId,
                amount,
                transactionType: 'deposit',
                status: 'completed',
                walletAddress,
                txHash,
                metadata
            }).returning();

            // Update milestone amount
            await tx.update(milestones)
                .set({
                    currentAmount: sql`${milestones.currentAmount} + ${amount}`,
                    updatedAt: new Date()
                })
                .where(eq(milestones.id, milestoneId));

            return txResult;
        });

        return c.json({
            message: 'Deposit successful',
            data: result[0]
        }, 201);
    } catch (error) {
        console.error('Error in deposit:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
};

/**
 * Withdraw funds from a milestone
 */
export const withdraw = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');
        const milestoneId = c.req.param('milestoneId');
        const { amount, walletAddress, txHash, metadata } = await c.req.json();

        // Check if milestone exists and belongs to user
        const milestone = await db.query.milestones.findFirst({
            where: and(
                eq(milestones.id, milestoneId),
                eq(milestones.userId, userId)
            )
        });

        if (!milestone) {
            return c.json({ message: 'Milestone not found' }, 404);
        }

        // Check if enough funds
        const currentAmount = milestone.currentAmount ? parseFloat(milestone.currentAmount.toString()) : 0;
        if (currentAmount < parseFloat(amount)) {
            return c.json({ message: 'Insufficient funds' }, 400);
        }

        // Begin transaction
        const result = await db.transaction(async (tx) => {
            // Create transaction record
            const txResult = await tx.insert(transactions).values({
                milestoneId,
                amount,
                transactionType: 'withdrawal',
                status: 'completed',
                walletAddress,
                txHash,
                metadata
            }).returning();

            // Update milestone amount
            await tx.update(milestones)
                .set({
                    currentAmount: sql`${milestones.currentAmount} - ${amount}`,
                    updatedAt: new Date()
                })
                .where(eq(milestones.id, milestoneId));

            return txResult;
        });

        return c.json({
            message: 'Withdrawal successful',
            data: result[0]
        }, 201);
    } catch (error) {
        console.error('Error in withdraw:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
};

/**
 * Get transactions for a milestone
 */
export const getMilestoneTransactions = async (c: Context) => {
    try {
        const { id: userId } = c.get('user');
        const milestoneId = c.req.param('milestoneId');

        // Check if milestone exists and belongs to user
        const milestone = await db.query.milestones.findFirst({
            where: and(
                eq(milestones.id, milestoneId),
                eq(milestones.userId, userId)
            )
        });

        if (!milestone) {
            return c.json({ message: 'Milestone not found' }, 404);
        }

        // Get transactions
        const milestoneTransactions = await db.query.transactions.findMany({
            where: eq(transactions.milestoneId, milestoneId),
            orderBy: (transactions, { desc }) => [desc(transactions.createdAt)]
        });

        return c.json({
            message: 'Transactions retrieved successfully',
            data: milestoneTransactions
        });
    } catch (error) {
        console.error('Error in getMilestoneTransactions:', error);
        return c.json({ message: 'Internal server error' }, 500);
    }
}; 