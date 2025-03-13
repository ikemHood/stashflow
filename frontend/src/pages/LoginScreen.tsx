import React, { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { useAccount, useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

const LoginScreen: React.FC = () => {
    const { login, isLoading } = useAuth();
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
            navigate({ to: '/home' });
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

                    <div className="space-y-2">
                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            leftIcon={<LockClosedIcon className="w-5 h-5" />}
                        />

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                                    Remember me
                                </label>
                            </div>
                            <div>
                                <button
                                    onClick={() => navigate({ to: '/forgot-password' })}
                                    className="text-sm text-primary font-medium hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleLogin}
                        loading={isLoading}
                        fullWidth
                    >
                        Log In
                    </Button>

                    <div className="flex items-center gap-3 my-4">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-sm text-gray-500">OR</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleConnectWallet}
                        fullWidth
                        disabled={isConnected}
                    >
                        {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                    </Button>
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
    );
};

export default LoginScreen; 