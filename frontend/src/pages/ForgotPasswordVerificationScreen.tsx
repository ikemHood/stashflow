import React, { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import { useNavigate } from '@tanstack/react-router';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { toast } from 'sonner';

const ForgotPasswordVerificationScreen: React.FC = () => {
    const navigate = useNavigate();
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Retrieve email from storage or state management
    const email = localStorage.getItem('resetEmail') || 'your email';

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // TODO: Integrate API to verify the code
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Navigate to reset password screen
            navigate({ to: '/reset-password' });
        } catch (err) {
            setError('Invalid verification code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        // TODO: Integrate API to resend verification code
        toast.success('Verification code resent to your email!');
    };

    const handleGoBack = () => {
        navigate({ to: '/forgot-password' });
    };

    return (
        <div className="flex flex-col min-h-full p-5">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <div className="text-center mb-8">
                    <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify email address</h1>
                    <p className="text-gray-600 mb-1">We sent a verification code to:</p>
                    <p className="text-primary font-medium mb-4">{email}</p>
                    <p className="text-gray-500 text-sm">
                        Please enter the code below to verify your email
                    </p>
                </div>

                <div className="space-y-6">
                    <VerificationCodeInput
                        length={6}
                        value={verificationCode}
                        onChange={setVerificationCode}
                        onComplete={handleVerifyCode}
                        error={error}
                    />

                    <Button
                        onClick={handleVerifyCode}
                        loading={isLoading}
                        fullWidth
                    >
                        Continue
                    </Button>

                    <div className="text-center">
                        <p className="text-gray-600 text-sm">
                            Didn't get the code?{' '}
                            <button
                                onClick={handleResendCode}
                                className="text-primary font-medium hover:underline"
                            >
                                Resend it
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleGoBack}
                        className="text-primary font-medium hover:underline flex items-center justify-center mx-auto text-sm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Go back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordVerificationScreen; 