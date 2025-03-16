import { Milestone, ContractMilestone, MergedMilestone } from '../types/api';

/**
 * Merges milestone data from the contract and API
 * @param apiMilestones Array of milestones from the API
 * @param contractMilestones Array of milestones from the blockchain
 * @returns Array of merged milestones
 */
export const mergeMilestoneData = (
    apiMilestones: Milestone[],
    contractMilestones: ContractMilestone[]
): MergedMilestone[] => {
    // Map by ID for faster lookups
    const contractMilestonesMap = new Map<string, ContractMilestone>();
    contractMilestones.forEach(cm => {
        contractMilestonesMap.set(cm.id, cm);
    });

    // Merge API milestones with corresponding contract data
    return apiMilestones.map(apiMilestone => {
        // Look for a matching contract milestone
        // The ID matching logic might need to be adjusted based on how IDs are stored/mapped
        const contractMilestone = contractMilestonesMap.get(apiMilestone.id);

        if (contractMilestone) {
            // Merge both data sources
            return {
                // Base info from API
                ...apiMilestone,

                // Override with contract data for financial details (more up-to-date)
                contractId: contractMilestone.id,
                currentAmount: contractMilestone.currentAmount,
                targetAmount: contractMilestone.targetAmount,
                fixedAmount: contractMilestone.fixedAmount,

                // Status from contract
                completed: contractMilestone.completed,
                milestoneType: contractMilestone.milestoneType,

                // Convert saving method based on milestone type
                savingMethod: contractMilestone.milestoneType === 0 ? 'AUTOMATIC' : 'MANUAL',
            };
        }

        // If no contract milestone found, use API data with default values
        return {
            ...apiMilestone,
            contractId: undefined,
            completed: parseFloat(apiMilestone.currentAmount) >= parseFloat(apiMilestone.targetAmount),
            milestoneType: apiMilestone.savingMethod === 'AUTOMATIC' ? 0 : 1,
        } as MergedMilestone;
    });
};

/**
 * Determines if a milestone is completed
 * @param milestone The milestone to check
 * @returns True if the milestone is completed
 */
export const isMilestoneCompleted = (milestone: MergedMilestone): boolean => {
    // Check if the milestone is explicitly marked as completed
    if (milestone.completed) {
        return true;
    }

    // Check if the current amount meets or exceeds the target amount
    const currentAmount = parseFloat(milestone.currentAmount);
    const targetAmount = parseFloat(milestone.targetAmount);
    if (currentAmount >= targetAmount) {
        return true;
    }

    // Check if the deadline has passed
    const now = new Date();
    const endDate = new Date(milestone.endDate);
    if (endDate <= now) {
        return true;
    }

    return false;
}; 