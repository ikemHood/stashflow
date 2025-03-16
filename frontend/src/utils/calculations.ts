/**
 * Calculates the progress percentage of a milestone
 * @param currentAmount Current amount saved
 * @param targetAmount Target amount to save
 * @returns Progress percentage (0-100)
 */
export const calculateProgressPercentage = (
    currentAmount: number | string,
    targetAmount: number | string
): number => {
    const current = typeof currentAmount === 'string' ? parseFloat(currentAmount) : currentAmount;
    const target = typeof targetAmount === 'string' ? parseFloat(targetAmount) : targetAmount;

    if (target <= 0 || isNaN(target) || isNaN(current)) {
        return 0;
    }

    const percentage = (current / target) * 100;
    return Math.min(Math.max(0, Math.round(percentage)), 100); // Clamp between 0-100 and round
};

/**
 * Calculates the number of days left until a deadline
 * @param deadline Deadline date string
 * @returns Number of days left (0 if deadline has passed)
 */
export const calculateDaysLeft = (deadline: string | Date): number => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    const today = new Date();

    // Reset time components to compare dates only
    today.setHours(0, 0, 0, 0);
    const deadlineCopy = new Date(deadlineDate);
    deadlineCopy.setHours(0, 0, 0, 0);

    const diffTime = deadlineCopy.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // Return 0 if deadline has passed
};

/**
 * Calculates the remaining amount to reach the target
 * @param currentAmount Current amount saved
 * @param targetAmount Target amount to save
 * @returns Remaining amount needed
 */
export const calculateRemainingAmount = (
    currentAmount: number | string,
    targetAmount: number | string
): number => {
    const current = typeof currentAmount === 'string' ? parseFloat(currentAmount) : currentAmount;
    const target = typeof targetAmount === 'string' ? parseFloat(targetAmount) : targetAmount;

    if (isNaN(current) || isNaN(target)) {
        return 0;
    }

    return Math.max(0, target - current);
}; 