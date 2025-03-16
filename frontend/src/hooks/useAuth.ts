import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../lib/api-services';
import { User, UserLoginRequest, UserRegisterRequest } from '../types/api';
import { Navigate } from '@tanstack/react-router';

export const useLogin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: UserLoginRequest) =>
            userService.login(credentials).then(res => res.data),
        onSuccess: (data) => {
            if (data.success && data.data) {
                // Store the tokens
                localStorage.setItem('access_token', data.data.accessToken);
                localStorage.setItem('refresh_token', data.data.refreshToken);

                // Store user data
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Update current user in the cache
                queryClient.setQueryData(['currentUser'], {
                    success: true,
                    data: data.data.user
                });

                // Check if PIN verification is required
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
                localStorage.setItem('access_token', data.data.accessToken);
                localStorage.setItem('refresh_token', data.data.refreshToken);

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
        queryFn: () => userService.getCurrentUser().then(res => res.data),
        // Don't run the query if there's no token
        enabled: !!localStorage.getItem('access_token'),
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
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
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
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
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

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
            userService.updateUser(userId, data).then(res => res.data),
        onSuccess: (data) => {
            if (data.success && data.data) {
                // Update local storage user data
                localStorage.setItem('user', JSON.stringify(data.data));

                // Update current user in the cache
                queryClient.setQueryData(['currentUser'], {
                    success: true,
                    data: data.data
                });
            }
        },
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