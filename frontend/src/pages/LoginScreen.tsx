import React, { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { useAccount, useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

const LoginScreen: React.FC = () => {
    const { login, isLoading, hasSetPin } = useAuth();
    const navigate = useNavigate();
    const { isConnected } = useAccount();
    const { connect } = useConnect();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError('');
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setError('');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter your email and password');
            return;
        }

        try {
            await login();

            // Store first name in localStorage for PIN setup screen
            const firstName = email.split('@')[0];
            localStorage.setItem('firstName', firstName);

            // Check if user has set up a PIN
            if (!hasSetPin) {
                // Redirect to PIN setup if not set
                navigate({ to: '/pin/set' });
            } else {
                // Otherwise go to home
                navigate({ to: '/home' });
            }
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    const handleConnectWallet = () => {
        connect({ connector: metaMask() });
    };

    return (
        <div className="flex flex-col min-h-full p-5">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Log in to continue to Stashflow</p>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    <Input
                        label="Email Address"
                        placeholder="youremail@example.com"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                        error={error ? error : undefined}
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        leftIcon={<LockClosedIcon className="w-5 h-5" />}
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>

                        <button
                            onClick={() => navigate({ to: '/forgot-password' })}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        onClick={handleLogin}
                        loading={isLoading}
                        fullWidth
                    >
                        Log In
                    </Button>

                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Button
                                onClick={handleConnectWallet}
                                variant="outline"
                                fullWidth
                            >
                                MetaMask
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate({ to: '/signup' })}
                            className="text-primary font-medium hover:underline"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen; 