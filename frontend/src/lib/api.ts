import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { userService } from './api-services';
import { Navigate } from '@tanstack/react-router';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Track if we're refreshing the token to prevent multiple refreshes
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
    config: InternalAxiosRequestConfig;
}> = [];

// Process the failed queue (retry or reject)
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            promise.config.headers.Authorization = `Bearer ${token}`;
            promise.resolve(axios(promise.config));
        }
    });
    failedQueue = [];
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig;

        // Skip this error handling for login/register/refresh endpoints
        const isTokenRefreshRequest = originalRequest.url?.includes('token/refresh');
        const isLoginRequest = originalRequest.url?.includes('/login');
        const isRegisterRequest = originalRequest.url?.includes('/signup');

        if (isTokenRefreshRequest || isLoginRequest || isRegisterRequest) {
            return Promise.reject(error);
        }

        // Handle authentication errors
        if (error.response?.status === 401 && originalRequest && !originalRequest.headers._retry) {
            if (isRefreshing) {
                // If we're already refreshing, add this request to the queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            originalRequest.headers._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    // No refresh token, redirect to login
                    await logout();
                    return Promise.reject(error);
                }

                // Use a direct axios call to avoid interceptors causing a loop
                const response = await axios.post(`${API_URL}/users/token/refresh`, {
                    refreshToken
                });

                if (response.data.success && response.data.data) {
                    const { accessToken, refreshToken: newRefreshToken, isPinRequired } = response.data.data;

                    if (accessToken) {
                        // Update tokens in localStorage
                        localStorage.setItem('access_token', accessToken);
                        if (newRefreshToken) {
                            localStorage.setItem('refresh_token', newRefreshToken);
                        }

                        // Update auth header for the original request
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                        // Process any requests that were waiting
                        processQueue(null, accessToken);

                        // Retry the original request
                        return axios(originalRequest);
                    } else if (isPinRequired) {
                        // Token refresh failed due to PIN requirement
                        redirectToSetupPin();
                        processQueue(new Error('PIN verification required'));
                        return Promise.reject(error);
                    } else {
                        // Token refresh failed for other reasons
                        await logout();
                        processQueue(new Error('Authentication failed'));
                        return Promise.reject(error);
                    }
                } else {
                    // Refresh token rejected
                    await logout();
                    processQueue(new Error('Refresh token rejected'));
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // Refresh token is invalid or expired
                await logout();
                processQueue(new Error('Refresh token failed'));
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle forbidden errors
        if (error.response?.status === 403) {
            toast.error('You do not have permission to access this resource');
            // Handle permission errors
            // You might want to redirect to an "Access Denied" page
        }

        return Promise.reject(error);
    }
);

// Helper functions for redirection
const logout = async () => {
    try {
        const token = localStorage.getItem('access_token');
        if (token) {
            await userService.logout().catch(() => {
                // Ignore errors during logout
            });
        }
    } finally {
        // Always clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Redirect to login
        Navigate({ to: '/login' });
    }
};

const redirectToSetupPin = () => {
    // Navigate to PIN setup screen
    Navigate({ to: '/pin/set' });
}; 