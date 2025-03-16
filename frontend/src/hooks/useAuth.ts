import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../lib/api-services';
import { User, UserLoginRequest, UserRegisterRequest } from '../types/api';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

// Export the main useAuth hook from the AuthContext
export { useAuth } from '../context/AuthContext';

export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: UserLoginRequest) =>
            userService.login(credentials).then(res => res.data),
        onSuccess: (data) => {
            if (data.success && data.data) {
                // Store the tokens
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);

                // Store user data
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Update current user in the cache
                queryClient.setQueryData(['currentUser'], {
                    success: true,
                    data: data.data.user
                });

                if (data.data.isPinRequired) {
                    Navigate({ to: '/pin/set' });
                }
            }
        },
    });
};

export const useRegister = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: UserRegisterRequest) =>
            userService.register(userData).then(res => res.data),
        onSuccess: (data) => {
            if (data.success && data.data) {
                // Store the tokens
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);

                // Store user data
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Update current user in the cache
                queryClient.setQueryData(['currentUser'], {
                    success: true,
                    data: data.data.user
                });

                // Check if PIN setup is required
                if (data.data.isPinRequired === false) {
                    Navigate({ to: '/pin/set' });
                }
            }
        },
    });
};

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const response = await userService.getCurrentUser();
            return {
                success: response.data.success,
                data: response.data.data as User
            };
        },
        // Don't run the query if there's no token
        enabled: !!localStorage.getItem('accessToken'),
        initialData: () => {
            const user = localStorage.getItem('user');
            if (user) {
                try {
                    return { success: true, data: JSON.parse(user) as User };
                } catch (e) {
                    return undefined;
                }
            }
            return undefined;
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => userService.logout().then(res => res.data),
        onSuccess: () => {
            // Remove tokens and user data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Clear the current user from the cache
            queryClient.setQueryData(['currentUser'], null);

            // Invalidate all queries
            queryClient.invalidateQueries();

            // Redirect to login
            Navigate({ to: '/login' });
        }
    });
};

export const useLogoutAll = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => userService.logoutAll().then(res => res.data),
        onSuccess: () => {
            // Remove tokens and user data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            // Clear the current user from the cache
            queryClient.setQueryData(['currentUser'], null);

            // Invalidate all queries
            queryClient.invalidateQueries();

            // Redirect to login
            Navigate({ to: '/login' });
        }
    });
};

export const useLogoutDevice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: string) =>
            userService.logoutDevice(deviceId).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        }
    });
};

export const useLogoutAllDevices = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            userService.logoutAll().then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        }
    });
};

export const useSetDevicePin = () => {
    return useMutation({
        mutationFn: ({ pin, confirmPin }: { pin: string; confirmPin: string }) =>
            userService.setDevicePin(pin, confirmPin).then(res => res.data),
        onSuccess: (data) => {
            if (data.success) {
                // Redirect to dashboard after successful pin setup
                Navigate({ to: '/home' });
            }
        }
    });
};

export const useVerifyEmail = () => {
    return useMutation({
        mutationFn: (code: string) =>
            userService.verifyEmail(code).then(res => res.data),
    });
};

export const useResendVerificationCode = () => {
    return useMutation({
        mutationFn: () => userService.resendVerificationCode().then(res => res.data),
    });
};

export const useDevices = () => {
    return useQuery({
        queryKey: ['devices'],
        queryFn: () => userService.getDevices().then(res => res.data),
    });
};

export const useRenameDevice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ deviceId, name }: { deviceId: string; name: string }) =>
            userService.renameDevice(deviceId, name).then(res => res.data),
        onSuccess: () => {
            // Invalidate the devices query to refetch the updated list
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        }
    });
};

export const useVerifyPin = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (pin: string) => {
            // Get refresh token
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            try {
                const response = await userService.refreshToken(refreshToken, pin);

                if (response.data.success && response.data.data) {
                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                    if (accessToken) {
                        localStorage.setItem('accessToken', accessToken);
                    }

                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    // Return success result
                    return {
                        success: true,
                        data: response.data.data
                    };
                } else {
                    throw new Error(response.data.message || 'PIN verification failed');
                }
            } catch (error) {
                if (error instanceof Error) {
                    throw error;
                } else {
                    throw new Error('PIN verification failed');
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            navigate({ to: '/home' });
        },
        onError: (error) => {
            console.error('PIN verification error:', error);
            toast.error('PIN verification failed');
        }
    });
};

// Password reset related hooks
export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyResetCodeRequest {
    email: string;
    code: string;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
}

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (data: ForgotPasswordRequest) =>
            userService.forgotPassword(data.email).then(res => res.data),
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data: ResetPasswordRequest) =>
            userService.resetPassword(
                data.email,
                data.code,
                data.newPassword,
                data.confirmPassword
            ).then(res => res.data),
    });
};

export const useResendResetCode = () => {
    return useMutation({
        mutationFn: (email: string) =>
            userService.resendResetCode(email).then(res => res.data),
    });
}; 