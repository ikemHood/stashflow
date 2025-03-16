import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate } from '@tanstack/react-router';
import { handleAuthError } from '../lib/error-handlers';
import { userService } from '../lib/api-services';
import { User as ApiUser, UserLoginRequest, UserRegisterRequest } from '../types/api';
import axios from 'axios';
import { readContract } from 'wagmi/actions';
import { STASHFLOW_CONTRACT_ABI, STASHFLOW_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, config } from '../lib/web3Config';
import { formatWeiToEth } from '../utils/helpers';
import { getAddress, isAddress } from 'viem';


// Extended User interface that combines the API User type with additional properties we need
interface User extends ApiUser {
    address?: string;
    balance?: string;
    hasSetPin?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isPinRequired: boolean;
    hasSetPin: boolean;
    accessToken: string | null;
    refreshToken: string | null;

    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    setPin: (pin: string, confirmPin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    setRefreshToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { address, isConnected } = useAccount();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPinRequired, setIsPinRequired] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const { disconnect } = useDisconnect();
    const navigate = useNavigate();

    // Check if the user has set a PIN
    const hasSetPin = user?.hasSetPin || false;

    // Refresh token if it exists but access token is missing or expired
    const refreshTokenIfNeeded = async (): Promise<boolean> => {
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
            // No refresh token, nothing we can do
            return false;
        }

        setIsPinRequired(true);
        navigate({ to: '/pin/verify' });
        return false;
    };

    // Token expiration handler
    useEffect(() => {
        if (user && hasSetPin && accessToken) {
            // Set up a timer to check token expiration periodically
            const tokenCheckInterval = setInterval(async () => {
                try {
                    // Try a simple API call to see if the token is still valid
                    await userService.getCurrentUser();
                } catch (error) {
                    if (axios.isAxiosError(error) && error.response?.status === 401) {
                        // If token is expired, try to refresh it
                        const refreshed = await refreshTokenIfNeeded();

                        // If refresh fails, require PIN verification
                        if (!refreshed) {
                            setIsPinRequired(true);
                        }
                    }
                }
            }, 15 * 60 * 1000); // 15 minutes

            return () => clearInterval(tokenCheckInterval);
        }
    }, [user, hasSetPin, accessToken]);

    // Update user when wallet connection changes
    useEffect(() => {
        // When a wallet is connected, update user's address and fetch balance
        if (isConnected && address && user) {
            const fetchUserBalance = async () => {
                try {
                    if (!isAddress(address)) return;
                    // Call the contract to get user's total savings in ETH
                    const totalSavings = await readContract(config, {
                        abi: STASHFLOW_CONTRACT_ABI,
                        address: getAddress(STASHFLOW_CONTRACT_ADDRESS),
                        functionName: 'getUserTokenSavings',
                        args: [getAddress(address), getAddress(TOKEN_CONTRACT_ADDRESS)],
                        account: getAddress(address),
                    });

                    // Format and update user with balance from contract
                    const formattedBalance = formatWeiToEth(totalSavings as bigint);

                    setUser({
                        ...user,
                        address,
                        balance: formattedBalance
                    });
                } catch (error) {
                    console.error('Error fetching user balance:', error);
                    setUser({
                        ...user,
                        address
                    });
                }
            };

            fetchUserBalance();
        }
    }, [isConnected, address]);

    // Restore user from localStorage when the app starts
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        if (storedAccessToken) {
            setAccessToken(storedAccessToken);
        }

        if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
        }
    }, []);

    // Persist user data when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    // Login function
    const login = async (email: string, password: string): Promise<void> => {
        setIsLoading(true);

        try {
            // Collect device information
            const deviceInfo = getDeviceInfo();

            // Use the userService for login
            const loginRequest: UserLoginRequest = {
                email,
                password,
                deviceName: deviceInfo.deviceName,
            };

            const response = await userService.login(loginRequest);

            if (!response.data.success || !response.data.data) {
                throw new Error(response.data.message || 'Login failed');
            }

            const authData = response.data.data;

            // Store tokens
            setAccessToken(authData.accessToken);
            localStorage.setItem('accessToken', authData.accessToken);

            setRefreshToken(authData.refreshToken);
            localStorage.setItem('refreshToken', authData.refreshToken);

            const newUser: User = {
                ...authData.user,
                address: '', // Initialize with empty string since the API User doesn't have this
                balance: '0', // Initialize with zero balance
                hasSetPin: !authData.isPinRequired // If PIN is not required, user has set it
            };

            setIsPinRequired(authData.isPinRequired);
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));

        } catch (error) {
            console.error('Login failed:', error);
            handleAuthError(error, 'Login failed');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to get device information
    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let deviceType = 'desktop';
        let osName = 'Unknown OS';
        let browserName = 'Unknown Browser';

        // Detect device type
        if (/iPad|iPhone|iPod/.test(ua)) {
            deviceType = 'mobile';
        } else if (/Android/.test(ua)) {
            deviceType = /Mobile/.test(ua) ? 'mobile' : 'tablet';
        } else if (/iPad|Android|Touch/.test(ua)) {
            deviceType = 'tablet';
        }

        // Detect OS
        if (ua.indexOf('Windows') > -1) {
            osName = 'Windows';
        } else if (ua.indexOf('Mac') > -1) {
            osName = 'MacOS';
        } else if (ua.indexOf('Linux') > -1) {
            osName = 'Linux';
        } else if (ua.indexOf('Android') > -1) {
            osName = 'Android';
        } else if (/iPad|iPhone|iPod/.test(ua)) {
            osName = 'iOS';
        }

        // Detect browser
        if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
            browserName = 'Chrome';
        } else if (ua.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            browserName = 'Safari';
        } else if (ua.indexOf('Edg') > -1) {
            browserName = 'Edge';
        } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) {
            browserName = 'Internet Explorer';
        }

        return {
            deviceType,
            osName,
            browserName,
            userAgent: ua,
            deviceName: `${osName} - ${browserName}`
        };
    };

    // Logout function
    const logout = async (): Promise<void> => {
        setIsLoading(true);

        try {
            // Call the logout API endpoint
            await userService.logout();

            // Clean up local state regardless of API success
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
            setIsPinRequired(false);

            // Disconnect wallet if connected
            disconnect();

            // Navigate to login page
            navigate({ to: '/login' });
        } catch (error) {
            console.error('Logout error:', error);

            // Even if API call fails, we should still clean up local state
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
            setIsPinRequired(false);

            // Navigate to login page
            navigate({ to: '/login' });
        } finally {
            setIsLoading(false);
        }
    };

    // Signup function
    const signup = async (name: string, email: string, password: string): Promise<void> => {
        setIsLoading(true);

        try {
            // Use the userService for registration
            const registerRequest: UserRegisterRequest = {
                username: name, // API expects username, not name
                email,
                password
            };

            const response = await userService.register(registerRequest);

            if (!response.data.success || !response.data.data) {
                throw new Error(response.data.message || 'Registration failed');
            }

            const authData = response.data.data;

            // Store tokens
            setAccessToken(authData.accessToken);
            localStorage.setItem('accessToken', authData.accessToken);

            setRefreshToken(authData.refreshToken);
            localStorage.setItem('refreshToken', authData.refreshToken);

            // Update user state with the API user and additional properties
            const newUser: User = {
                ...authData.user,
                address: '', // Initialize with empty string
                balance: '0', // Initialize with zero balance
                hasSetPin: !authData.isPinRequired // If PIN is not required, user has set it
            };

            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));

        } catch (error) {
            console.error('Signup failed:', error);
            handleAuthError(error, 'Signup failed');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Set PIN function
    const setPin = async (pin: string, confirmPin: string): Promise<void> => {
        setIsLoading(true);

        try {
            // Use the userService to set the device PIN
            const response = await userService.setDevicePin(pin, confirmPin);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to set PIN');
            }

            // Update user with hasSetPin: true
            if (user) {
                const updatedUser = {
                    ...user,
                    hasSetPin: true
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Setting PIN failed:', error);
            handleAuthError(error, 'Failed to set PIN');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Verify PIN function - used to verify PIN and refresh tokens
    const verifyPin = async (pin: string): Promise<boolean> => {
        setIsLoading(true);

        try {
            const storedRefreshToken = refreshToken || localStorage.getItem('refreshToken');

            if (!storedRefreshToken) {
                throw new Error('No refresh token available');
            }

            // Call refresh token with PIN for verification
            const response = await userService.refreshToken(storedRefreshToken, pin);

            if (response.data.success && response.data.data) {
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

                // Update tokens
                if (newAccessToken) {
                    setAccessToken(newAccessToken);
                    localStorage.setItem('accessToken', newAccessToken);
                }

                if (newRefreshToken) {
                    setRefreshToken(newRefreshToken);
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Reset PIN required flag
                setIsPinRequired(false);
                return true;
            }

            return false;
        } catch (error) {
            console.error('PIN verification failed:', error);
            handleAuthError(error, 'PIN verification failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        isPinRequired,
        hasSetPin,
        accessToken,
        refreshToken,
        login,
        logout,
        signup,
        setPin,
        verifyPin,
        setRefreshToken
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 