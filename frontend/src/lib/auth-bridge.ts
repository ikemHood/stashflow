import { User } from '../types/api';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    isPinRequired?: boolean;
}

// Function to convert localStorage auth data to the expected format for hooks
export const getAuthDataFromStorage = (): ApiResponse<User> | undefined => {
    const user = localStorage.getItem('user');
    if (!user) return undefined;

    try {
        return {
            success: true,
            data: JSON.parse(user) as User
        };
    } catch (e) {
        console.error('Error parsing user data from storage', e);
        return undefined;
    }
};

// Function to check if a user is authenticated based on tokens
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('accessToken') && !!localStorage.getItem('user');
};

// Standardizes auth state between the two approaches
export const getAuthState = () => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    return {
        user: storedUser ? JSON.parse(storedUser) as User : null,
        isAuthenticated: !!accessToken && !!storedUser,
        accessToken,
        refreshToken,
    };
};

// Helper to update auth state in a consistent way
export const updateAuthState = (authResponse: AuthResponse | null) => {
    if (authResponse) {
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
    } else {
        // Clear auth state for logout
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}; 