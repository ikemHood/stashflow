// Common response type
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// User types
export interface User {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: string;
}

export interface UserLoginRequest {
    email: string;
    password: string;
    deviceName?: string;
}

export interface UserRegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    isPinRequired: boolean;
}

export interface PinVerificationRequest {
    pin: string;
}

export interface PinSetupRequest {
    pin: string;
    confirmPin: string;
}

// Wallet types
export interface Wallet {
    id: string;
    userId: string;
    address: string;
    balance: string;
    createdAt: string;
    updatedAt: string;
}

// Transaction types
export interface Transaction {
    id: string;
    userId: string;
    walletId: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
    amount: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    txHash?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTransactionRequest {
    milestoneId: string;
    walletAddress: string;
    txHash: string;
    amount: string;
    metadata?: Record<string, any>;
}

// Milestone types
export interface Milestone {
    id: string;
    userId: string;
    name: string;
    description?: string;
    image?: string;
    tokenAddress: string;
    targetAmount: string;
    currentAmount: string;
    savingMethod: 'MANUAL' | 'AUTOMATIC';
    savingFrequency: 'MONTHLY' | 'WEEKLY' | 'DAILY';
    endDate: string;
    startDate: string;
    createdAt: string;
    updatedAt: string;
}

// Contract milestone type
export interface ContractMilestone {
    id: string; // Contract milestone ID
    name: string;
    targetAmount: string;
    currentAmount: string;
    deadline: number; // Timestamp
    completed: boolean;
    fixedAmount?: string; // For automatic savings
    milestoneType: number; // 0 = fixed deposit, 1 = flexible
    tokenAddress: string;
}

// Merged milestone with data from both API and contract
export interface MergedMilestone {
    // Core identifiers
    id: string;
    contractId?: string;

    // Basic info
    name: string;
    description?: string;
    image?: string;

    // Financial details
    tokenAddress: string;
    targetAmount: string;
    currentAmount: string;
    fixedAmount?: string;

    // Saving configuration
    savingMethod: 'MANUAL' | 'AUTOMATIC';
    savingFrequency?: 'MONTHLY' | 'WEEKLY' | 'DAILY';
    milestoneType?: number;

    // Status and dates
    completed: boolean;
    endDate: string;
    startDate: string;
    createdAt: string;
    updatedAt: string;

    // API specific
    userId: string;

    // Additional metadata
    metadata?: Record<string, any>;

    // Contract parameters
    withdrawalPenalty?: number; // In basis points (1% = 100)
}

export interface CreateMilestoneRequest {
    name: string;
    targetAmount: number;
    startDate: string;
    endDate: string;
    description?: string;
    image?: string;
    tokenAddress: string;
    contractMilestoneId?: number;
    currency?: 'USDT' | 'USDC' | 'DAI' | 'BUSD';
    savingMethod?: 'manual' | 'automatic' | 'recurring';
    savingFrequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
}

// Token types
export interface Token {
    id: string;
    symbol: string;
    name: string;
    contractAddress: string;
    decimals: number;
    isActive: boolean;
}

// Role types
export interface Role {
    id: string;
    name: string;
    permissions: string[];
}

// Pagination
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
} 