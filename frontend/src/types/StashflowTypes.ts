/**
 * Types for the Stashflow application
 */

// Status constants
export const STATUS_INACTIVE = 0;
export const STATUS_ACTIVE = 1;
export const STATUS_COMPLETED = 2;

// Milestone type constants
export const TYPE_FIXED_DEPOSIT = 0;
export const TYPE_FLEXIBLE_DEPOSIT = 1;

// Contract Milestone structure
export interface ContractMilestone {
    name: string; // bytes32
    targetAmount: bigint;
    deadline: bigint;
    currentAmount: bigint;
    completed: boolean;
    active: boolean;
    tokenAddress: string;
    milestoneType: number;
    fixedAmount: bigint;
}

// Frontend Milestone with formatted values
export interface Milestone {
    id: number;
    name: string;
    targetAmount: string;
    currentAmount: string;
    deadline: number; // Unix timestamp
    deadlineFormatted: string; // Human readable deadline
    completed: boolean;
    active: boolean;
    progress: number;
    tokenAddress: string; // '0x0000000000000000000000000000000000000000' for ETH
    milestoneType: number; // 0 for fixed deposits, 1 for flexible
    fixedAmount: string; // Only used for fixed deposits
}

// Token information
export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

// Contract User structure
export interface User {
    exists: boolean;
    totalSavings: bigint;
}

// Create Milestone parameters
export interface CreateMilestoneParams {
    name: string;
    targetAmount: string;
    deadline: number; // Unix timestamp
    tokenAddress: string;
    milestoneType: number;
    fixedAmount: string;
} 