import { apiClient } from './api';
import type {
    ApiResponse,
    AuthResponse,
    CreateMilestoneRequest,
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
        apiClient.get<ApiResponse<{
            devices: Array<{
                id: string,
                deviceName: string,
                userAgent: string,
                ipAddress: string,
                createdAt: string,
                lastUsedAt: string,
                hasPin: boolean,
                current: boolean
            }>
        }>>('/users/devices'),

    renameDevice: (deviceId: string, name: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/device/rename', { deviceId, name }),

    // Logout related
    logout: () =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/logout'),

    logoutDevice: (deviceId: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>(`/users/device/logout`, { sessionId: deviceId }),

    logoutAll: () =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/logout-all'),

    refreshToken: (refreshToken: string, pin: string) =>
        apiClient.post<ApiResponse<Omit<AuthResponse, 'user'>>>('/users/token/refresh', {
            refreshToken,
            pin
        }),

    forgotPassword: (email: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/password/forgot', { email }),

    resetPassword: (email: string, code: string, newPassword: string, confirmPassword: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/password/reset', {
            email,
            code,
            newPassword,
            confirmPassword
        }),

    resendResetCode: (email: string) =>
        apiClient.post<ApiResponse<{ success: boolean }>>('/users/password/resend', { email }),
};

// Wallet API services
export const walletService = {
    getUserWallets: () =>
        apiClient.get<ApiResponse<Wallet[]>>(`/wallets`),

    getWalletById: (walletId: string) =>
        apiClient.get<ApiResponse<Wallet>>(`/wallets/${walletId}`),
};

// Milestone API services
export const milestoneService = {
    getUserMilestones: () =>
        apiClient.get<ApiResponse<Milestone[]>>(`/milestones`),

    getMilestoneById: (milestoneId: string) =>
        apiClient.get<ApiResponse<Milestone>>(`/milestones/${milestoneId}`),

    createMilestone: (data: CreateMilestoneRequest) =>
        apiClient.post<ApiResponse<Milestone>>(`/milestones/`, data),

    updateMilestone: (milestoneId: string, data: Partial<Milestone>) =>
        apiClient.put<ApiResponse<Milestone>>(`/milestones/${milestoneId}`, data),

    deleteMilestone: (milestoneId: string) =>
        apiClient.delete<ApiResponse<{ success: boolean }>>(`/milestones/${milestoneId}`),
};

// Transaction API services
export const transactionService = {
    getMilestoneTransactions: (milestoneId: string, params?: PaginationParams) =>
        apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(`/milestones/${milestoneId}/transactions`, { params }),

    depositToMilestone: (milestoneId: string, data: { amount: number, walletAddress?: string, txHash?: string, metadata?: Record<string, any> }) =>
        apiClient.post<ApiResponse<Transaction>>(`/transactions/milestones/${milestoneId}/deposit`, data),

    withdrawFromMilestone: (milestoneId: string, data: { amount: number, walletAddress?: string, txHash?: string, metadata?: Record<string, any> }) =>
        apiClient.post<ApiResponse<Transaction>>(`/transactions/milestones/${milestoneId}/withdraw`, data),
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