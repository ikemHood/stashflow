import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate } from '@tanstack/react-router';
import { parseApiError, handleAuthError } from '../lib/error-handlers';


interface User {
    id: string;
    name: string;
    email: string;
    address: string;
    balance: string;
    hasSetPin?: boolean;
    isVerified?: boolean;
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
    logout: () => void;
    signup: () => Promise<void>;
    setPin: (pin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    setRefreshToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    // Define API URL
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Check if the user has set a PIN
    const hasSetPin = user?.hasSetPin || false;

    // Simulate token expiration to test PIN verification flow
    useEffect(() => {
        if (user && hasSetPin) {
            // Simulate token expiration after 30 minutes
            const tokenExpirationTimer = setTimeout(() => {
                setIsPinRequired(true);
            }, 15 * 60 * 1000); // 15 minutes

            return () => clearTimeout(tokenExpirationTimer);
        }
    }, [user, hasSetPin]);

    // Update user when wallet connection changes
    useEffect(() => {
        if (isConnected && address) {
            setUser({
                id: '1',
                name: 'User',
                email: 'user@example.com',
                address,
                balance: '0.0',
                hasSetPin: false // By default, new connections haven't set a PIN
            });
        } else {
            setUser(null);
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
            // Make API call to login endpoint
            const apiResponse = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, deviceName: "string" }),
            });

            if (!apiResponse.ok) {
                const error = await parseApiError(apiResponse);
                throw new Error(error.message || 'Failed to login');
            }

            const data = await apiResponse.json();

            // Store tokens
            setAccessToken(data.data.accessToken);
            localStorage.setItem('accessToken', data.data.accessToken);

            setRefreshToken(data.data.refreshToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);

            // Update user state properly
            const newUser = {
                id: data.data.user.id,
                name: data.data.user.name,
                email: data.data.user.email,
                address: data.data.user.address || '',
                balance: data.data.user.balance || '0',
                isVerified: data.data.user.isVerified || false,
                hasSetPin: data.data.user.hasSetPin || false
            };

            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));

        } catch (error) {
            console.error('Login failed:', error);
            handleAuthError(error, 'Login failed');
            throw error; // Ensure error handling in UI
        } finally {
            setIsLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsPinRequired(false);
        disconnect();
        navigate({ to: '/login' });
    };

    // Signup function
    const signup = async (): Promise<void> => {
        setIsLoading(true);

        try {
            // For now we're keeping this simple simulation
            // In a real implementation, you would make an API call like:
            /*
            const apiResponse = await fetch(`${API_BASE_URL}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
    
            if (!apiResponse.ok) {
                const error = await parseApiError(apiResponse);
                throw new Error(error.message || 'Failed to create account');
            }
            
            const data = await apiResponse.json();
            */

            // For demo, simulate API response
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Successfully signed up, simulate user data
            if (address) {
                setUser({
                    id: 'new-user-id',
                    name: 'New User',
                    email: 'newuser@example.com',
                    address,
                    balance: '0',
                    hasSetPin: false,
                    isVerified: false
                });
            }

            // Set simulated tokens - in a real app these would come from the API
            const simulatedAccessToken = 'simulated-access-token-' + Date.now();
            const simulatedRefreshToken = 'simulated-refresh-token-' + Date.now();

            setAccessToken(simulatedAccessToken);
            localStorage.setItem('accessToken', simulatedAccessToken);

            setRefreshToken(simulatedRefreshToken);
            localStorage.setItem('refreshToken', simulatedRefreshToken);
        } catch (error) {
            console.error('Signup failed:', error);
            handleAuthError(error, 'Signup failed');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Set PIN function
    const setPin = async (pin: string): Promise<void> => {
        setIsLoading(true);

        try {
            // TODO: Integrate API to save PIN
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update user with hasSetPin: true
            if (user) {
                const updatedUser = {
                    ...user,
                    hasSetPin: true
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Verify PIN function
    const verifyPin = async (pin: string): Promise<boolean> => {
        setIsLoading(true);

        try {
            // TODO: Integrate API to verify PIN and refresh token
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demo, make sure we have a clean, 6-digit PIN
            const cleanPin = pin.trim();
            const isValid = cleanPin.length === 6 && /^\d+$/.test(cleanPin);

            console.log("PIN validation result:", isValid);

            if (isValid) {
                setIsPinRequired(false);
                return true;
            }

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