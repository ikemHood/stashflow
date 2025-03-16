import { apiClient } from './api';
import type {
    ApiResponse,
    AuthResponse,
    CreateMilestoneRequest,
    CreateTransactionRequest,
    Milestone,
    PaginatedResponse,
    PaginationParams,
    PinSetupRequest,
    Role,
    Token,
    Transaction,
    User,
    UserLoginRequest,
    UserRegisterRequest,
    Wallet,
} from '../types/api';

// User API services
export const userService = {
    login: (data: UserLoginRequest) =>
        apiClient.post<ApiResponse<AuthResponse>>('/users/login', data),

    register: (data: UserRegisterRequest) =>
        apiClient.post<ApiResponse<AuthResponse>>('/users/signup', data),

    getCurrentUser: () =>
        apiClient.get<ApiResponse<User>>('/users/me'),

    // PIN and verification related
    setDevicePin: (pin: string, confirmPin: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/device/pin', {
            pin,
            confirmPin
        } as PinSetupRequest),

    verifyEmail: (code: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/email/verify', { code }),

    resendVerificationCode: () =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/email/resend'),

    // Device management
    getDevices: () =>
        apiClient.get<ApiResponse<Array<{ id: string, name: string, lastActive: string }>>>('/users/devices'),

    renameDevice: (deviceId: string, name: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/device/rename', { deviceId, name }),

    // Logout related
    logout: () =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/logout'),

    logoutDevice: (deviceId: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/device/logout', { deviceId }),

    logoutAll: () =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/logout-all'),

    refreshToken: (refreshToken: string) =>
        apiClient.post<ApiResponse<Omit<AuthResponse, 'user'>>>('/users/token/refresh', { refreshToken }),
};

// Wallet API services
export const walletService = {
    getUserWallets: () =>
        apiClient.get<ApiResponse<Wallet[]>>(`/wallets`),

    getWalletById: (walletId: string) =>
        apiClient.get<ApiResponse<Wallet>>(`/wallets/${walletId}`),

    connectWallet: (address: string, walletType: string, metadata?: Record<string, any>) =>
        apiClient.post<ApiResponse<Wallet>>('/wallets', { address, walletType, metadata }),
};

// Transaction API services
export const transactionService = {
    getMilestoneTransactions: (milestoneId: string, params?: PaginationParams) =>
        apiClient.get<PaginatedResponse<Transaction>>(`/transactions/milestones/${milestoneId}/transactions`, { params }),

    createDepositTransaction: (data: CreateTransactionRequest) =>
        apiClient.post<ApiResponse<Transaction>>(`/transactions/milestones/${data.milestoneId}/deposit`, data),

    createWithdrawalTransaction: (data: CreateTransactionRequest) =>
        apiClient.post<ApiResponse<Transaction>>(`/transactions/milestones/${data.milestoneId}/withdraw`, data),
};

// Milestone API services
export const milestoneService = {
    getUserMilestones: () =>
        apiClient.get<ApiResponse<Milestone[]>>(`/milestones`),

    getMilestoneById: (milestoneId: string) =>
        apiClient.get<ApiResponse<Milestone>>(`/milestones/${milestoneId}`),

    createMilestone: (data: CreateMilestoneRequest) =>
        apiClient.post<ApiResponse<Milestone>>('/milestones', data),

    updateMilestone: (milestoneId: string, data: Partial<Milestone>) =>
        apiClient.put<ApiResponse<Milestone>>(`/milestones/${milestoneId}`, data),

    deleteMilestone: (milestoneId: string) =>
        apiClient.delete<ApiResponse<null>>(`/milestones/${milestoneId}`),
};

// Token API services
export const tokenService = {
    getAllTokens: () =>
        apiClient.get<ApiResponse<Token[]>>('/tokens'),

    getTokenById: (tokenId: string) =>
        apiClient.get<ApiResponse<Token>>(`/tokens/${tokenId}`),
};

// Role API services
export const roleService = {
    getAllRoles: () =>
        apiClient.get<ApiResponse<Role[]>>('/roles'),

    getRoleById: (roleId: string) =>
        apiClient.get<ApiResponse<Role>>(`/roles/${roleId}`),
}; 