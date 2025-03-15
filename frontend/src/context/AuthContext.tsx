import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useNavigate } from '@tanstack/react-router';


interface User {
    id: string;
    name: string;
    email: string;
    address: string;
    balance: string;
    isVerified?: boolean;
    hasPin?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    signup: (name: string, email: string, password: string) => Promise<void>;


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
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Update user when wallet connection changes
    useEffect(() => {
        if (isConnected && address) {
            setUser(prevUser => prevUser ? { 
                ...prevUser, 
                address: address 
            } : null); // Keep user if they exist, else return null
        }
    }, [isConnected, address]);


    // Restore user from localStorage when the app starts
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Persist user data when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    // Simulated login function
    const login = async (email: string, password: string): Promise<void> => {
        setIsLoading(true);
    
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password, deviceName: "string" }),
            });

    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to login to account');
            }
    
            const data = await response.json();
    
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
            };
    
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
    
        } catch (error) {
            console.error('Login failed:', error);
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
        disconnect();
        navigate({ to: '/login' });
        // The wallet disconnect will trigger our useEffect
    };

    // Simulated signup function
    const signup = async (name: string, email: string, password: string): Promise<void> => {
        setIsLoading(true);
    
        try {
            const response = await fetch(`${API_BASE_URL}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create account');
            }
    
            const data = await response.json();
    
            // Store access token
            setAccessToken(data.data.accessToken);
            localStorage.setItem('accessToken', data.data.accessToken);
    
            // Store refresh token
            setRefreshToken(data.data.refreshToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
    
            // Update user state
            setUser({
                id: data.data.user.id,
                name: data.data.user.name,
                email: data.data.user.email,
                address: data.data.user.address || '',
                balance: data.data.user.balance || '0',
                isVerified: data.data.user.isVerified || false,
            });
    
        } catch (error) {
            console.error('Signup failed:', error);
            throw error; // ✅ Propagate error so it can be handled in SignupScreen.tsx
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