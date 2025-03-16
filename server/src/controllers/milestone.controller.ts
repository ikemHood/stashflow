import type { Context } from 'hono';
import { db } from '../db';
import { milestones } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getValidatedData } from '../utils/validation';

/**
 * Create a new milestone
 */
export const createMilestone = async (c: Context) => {
    try {
        const { name, targetAmount, startDate, endDate, description, tokenAddress, savingMethod, savingFrequency, contractMilestoneId } = getValidatedData<{
            name: string;
            targetAmount: number;
            startDate: string;
            endDate: string;
            description?: string;
            tokenAddress: string;
            contractMilestoneId: number;
            savingMethod?: 'manual' | 'automatic' | 'recurring';
            savingFrequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
        }>(c);
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        const result = await db.insert(milestones).values({
            userId,
            name,
            description,
            targetAmount: targetAmount.toString(),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            tokenAddress,
            savingMethod,
            savingFrequency,
            contractMilestoneId: contractMilestoneId.toString()
        } as any).returning();

        return c.json({
            success: true,
            message: 'Milestone created successfully',
            data: {
                milestone: result[0]
            }
        }, 201);
    } catch (error) {
        console.error('Error in createMilestone:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Get user's milestones
 */
export const getMilestones = async (c: Context) => {
    try {
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Get all milestones for the user
        const allMilestones = await db.query.milestones.findMany({
            where: eq(milestones.userId, userId),
            orderBy: (milestones, { desc }) => [desc(milestones.createdAt)]
        });

        return c.json({
            success: true,
            data: {
                milestones: allMilestones
            }
        });
    } catch (error) {
        console.error('Error in getMilestones:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Get a milestone by ID
 */
export const getMilestone = async (c: Context) => {
    try {
        const userId = c.get('user')?.id;
        const milestoneId = c.req.param('id');

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Get the milestone
        const milestone = await db.query.milestones.findFirst({
            where: (fields, { and, eq }) => and(
                eq(fields.id, milestoneId),
                eq(fields.userId, userId)
            )
        });

        if (!milestone) {
            return c.json({
                success: false,
                message: 'Milestone not found'
            }, 404);
        }

        return c.json({
            success: true,
            data: {
                milestone
            }
        });
    } catch (error) {
        console.error('Error in getMilestone:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Update a milestone
 */
export const updateMilestone = async (c: Context) => {
    try {
        const milestoneId = c.req.param('id');
        const userId = c.get('user')?.id;
        const { name, targetAmount, startDate, endDate, description, tokenAddress, savingMethod, savingFrequency, contractMilestoneId } = getValidatedData<{
            name?: string;
            targetAmount?: number;
            startDate?: string;
            endDate?: string;
            description?: string;
            tokenAddress?: string;
            contractMilestoneId?: number;
            savingMethod?: 'manual' | 'automatic' | 'recurring';
            savingFrequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
        }>(c);

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if milestone exists and belongs to user
        const milestone = await db.query.milestones.findFirst({
            where: (fields, { and, eq }) => and(
                eq(fields.id, milestoneId),
                eq(fields.userId, userId)
            )
        });

        if (!milestone) {
            return c.json({
                success: false,
                message: 'Milestone not found'
            }, 404);
        }

        // Update the milestone
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (targetAmount !== undefined) updateData.targetAmount = targetAmount.toString();
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (description !== undefined) updateData.description = description;
        if (tokenAddress !== undefined) updateData.tokenAddress = tokenAddress;
        if (savingMethod !== undefined) updateData.savingMethod = savingMethod;
        if (savingFrequency !== undefined) updateData.savingFrequency = savingFrequency;
        if (contractMilestoneId !== undefined) updateData.contractMilestoneId = contractMilestoneId.toString();
        const result = await db.update(milestones)
            .set(updateData)
            .where(eq(milestones.id, milestoneId))
            .returning();

        return c.json({
            success: true,
            message: 'Milestone updated successfully',
            data: {
                milestone: result[0]
            }
        });
    } catch (error) {
        console.error('Error in updateMilestone:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
};

/**
 * Delete a milestone
 */
export const deleteMilestone = async (c: Context) => {
    try {
        const milestoneId = c.req.param('id');
        const userId = c.get('user')?.id;

        if (!userId) {
            return c.json({
                success: false,
                message: 'Authentication required'
            }, 401);
        }

        // Check if milestone exists and belongs to user
        const milestone = await db.query.milestones.findFirst({
            where: (fields, { and, eq }) => and(
                eq(fields.id, milestoneId),
                eq(fields.userId, userId)
            )
        });

        if (!milestone) {
            return c.json({
                success: false,
                message: 'Milestone not found'
            }, 404);
        }

        // Delete the milestone
        await db.delete(milestones).where(eq(milestones.id, milestoneId));

        return c.json({
            success: true,
            message: 'Milestone deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteMilestone:', error);
        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
}; 