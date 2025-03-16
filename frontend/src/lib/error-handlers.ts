import { toast } from 'sonner';

// A type for API errors
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// Format error messages from API responses
export const formatApiError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (typeof error === 'object' && error !== null) {
        const apiError = error as Partial<ApiError>;
        return apiError.message || 'An unknown error occurred';
    }

    return 'An unknown error occurred';
};

// Handle authentication errors consistently
export const handleAuthError = (error: unknown, defaultMessage = 'Authentication failed'): void => {
    const errorMessage = formatApiError(error);
    console.error('Auth error:', error);
    toast.error(errorMessage || defaultMessage);
};

// Parse API error responses consistently
export const parseApiError = async (response: Response): Promise<ApiError> => {
    try {
        const data = await response.json();
        return {
            message: data.message || response.statusText || 'API Error',
            status: response.status,
            code: data.code
        };
    } catch (e) {
        return {
            message: response.statusText || 'Failed to parse error response',
            status: response.status
        };
    }
}; 