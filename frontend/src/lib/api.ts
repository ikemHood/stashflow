import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { router } from '../router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);


const redirectToPath = (path: string) => {
    try {
        router.navigate({ to: path as any });
    } catch (e) {
        window.location.href = path;
    }
};

// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        // If the error is not a 401 Unauthorized, just reject the promise
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Check if we have a refresh token
        const hasRefreshToken = !!localStorage.getItem('refreshToken');

        // Don't redirect if this is already a refresh token request to avoid infinite loops
        const isRefreshRequest =
            error.config?.url?.includes('/users/token/refresh');

        if (hasRefreshToken && !isRefreshRequest) {
            console.log('Redirecting to PIN verification due to 401');
            // Redirect to the PIN verification page
            redirectToPath('/pin/verify');
        } else {
            console.log('Redirecting to login due to 401');
            // Clear tokens since we can't refresh
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Redirect to login
            redirectToPath('/login');
        }

        return Promise.reject(error);
    }
);

export * from './api-services';
