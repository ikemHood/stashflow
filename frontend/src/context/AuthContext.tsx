import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

interface User {
    id: string;
    name: string;
    email: string;
    address: string;
    balance: string;
    hasSetPin?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isPinRequired: boolean;
    hasSetPin: boolean;
    accessToken: string | null;

    login: () => Promise<void>;
    logout: () => void;
    signup: () => Promise<void>;
    setPin: (pin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
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
    const { disconnect } = useDisconnect();

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
                    hasSetPin: false // For demo purposes - in real app would come from API
                });

                // Set simulated access token
                setAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setIsPinRequired(false);
        setAccessToken(null);
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
                    hasSetPin: false
                });
            }
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
                setUser({
                    ...user,
                    hasSetPin: true
                });
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
        login,
        logout,
        signup,
        setPin,
        verifyPin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 