import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

interface User {
    id: string;
    name: string;
    email: string;
    address: string;
    balance: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: () => Promise<void>;
    logout: () => void;
    signup: () => Promise<void>;

    accessToken: string | null;
    setAccessToken: (token: string) => void;
    refreshToken: string | null;
    setRefreshToken: (token: string) => void;
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
    const { disconnect } = useDisconnect();

    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

    // Update user when wallet connection changes
    useEffect(() => {
        if (isConnected && address) {
            setUser({
                id: '1',
                name: 'User',
                email: 'user@example.com',
                address,
                balance: '0.0', // This will be updated with actual balance
            });
        } else {
            setUser(null);
        }
    }, [isConnected, address]);

    // Simulated login function
    const login = async (): Promise<void> => {
        setIsLoading(true);

        try {
            // TODO: Integrate API for user authentication
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Successfully logged in, simulate user data
            if (address) {
                setUser({
                    id: '1',
                    name: 'User',
                    email: 'user@example.com',
                    address,
                    balance: '0.5',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        disconnect();
        // The wallet disconnect will trigger our useEffect
    };

    // Simulated signup function
    const signup = async (): Promise<void> => {
        setIsLoading(true);

        try {
            // TODO: Integrate API for user registration
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Successfully signed up, simulate user data
            if (address) {
                setUser({
                    id: 'new-user-id',
                    name: 'New User',
                    email: 'newuser@example.com',
                    address,
                    balance: '0',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signup,
        accessToken, 
        setAccessToken,
        refreshToken,
        setRefreshToken
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 