import React, { useState } from 'react';
import { EnvelopeIcon, ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import VerificationCodeInput from '../components/VerificationCodeInput';
import {
    useForgotPassword,
    useResetPassword,
    useResendResetCode
} from '../hooks/useAuth';

enum ForgotPasswordStep {
    EMAIL_FORM = 0,
    VERIFICATION = 1,
    NEW_PASSWORD = 2,
    SUCCESS = 3
}

const ForgotPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(ForgotPasswordStep.EMAIL_FORM);

    // Form states
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Validation and loading states
    const [error, setError] = useState('');

    // Hooks
    const forgotPasswordMutation = useForgotPassword();
    const resetPasswordMutation = useResetPassword();
    const resendResetCodeMutation = useResendResetCode();

    // Whether any mutation is loading
    const isLoading =
        forgotPasswordMutation.isPending ||
        resetPasswordMutation.isPending ||
        resendResetCodeMutation.isPending;

    const validateEmail = (): boolean => {
        if (!email.trim()) {
            setError('Email address is required');
            return false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return false;
        }
        return true;
    };

    const validateNewPassword = (): boolean => {
        if (!newPassword) {
            setError('Password is required');
            return false;
        } else if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleRequestReset = async () => {
        if (!validateEmail()) return;

        // Store the email for the verification screen
        localStorage.setItem('resetEmail', email);

        // Call the API to request password reset
        forgotPasswordMutation.mutate(
            { email },
            {
                onSuccess: () => {
                    toast.success('Reset code sent to your email');
                    setCurrentStep(ForgotPasswordStep.VERIFICATION);
                },
                onError: (error) => {
                    if (error instanceof Error) {
                        setError(error.message);
                    } else {
                        setError('Failed to send reset code');
                    }
                }
            }
        );
    };

    const handleResetPassword = async () => {
        if (!validateNewPassword()) return;

        // Call the API to reset the password
        resetPasswordMutation.mutate(
            {
                email,
                code: verificationCode,
                newPassword,
                confirmPassword
            },
            {
                onSuccess: () => {
                    toast.success('Password has been reset successfully');
                    setCurrentStep(ForgotPasswordStep.SUCCESS);

                    // Wait 2 seconds then redirect to login
                    setTimeout(() => {
                        navigate({ to: '/login' });
                    }, 2000);
                },
                onError: (error) => {
                    if (error instanceof Error) {
                        setError(error.message);
                    } else {
                        setError('Failed to reset password');
                    }
                }
            }
        );
    };

    const handleResendCode = () => {
        // Call the API to resend verification code
        resendResetCodeMutation.mutate(email, {
            onError: (error) => {
                if (error instanceof Error) {
                    toast.error(error.message);
                } else {
                    toast.error('Failed to resend code');
                }
            }
        });
    };

    // Render the correct step
    const renderStep = () => {
        switch (currentStep) {
            case ForgotPasswordStep.EMAIL_FORM:
                return (
                    <>
                        <div className="text-center mb-8">
                            <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h1>
                            <p className="text-gray-600">Enter your email and click continue to start the reset process</p>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="Email Address"
                                placeholder="youremail@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                                error={error}
                            />

                            <Button
                                onClick={handleRequestReset}
                                loading={isLoading}
                                fullWidth
                            >
                                Continue
                            </Button>
                        </div>
                    </>
                );

            case ForgotPasswordStep.VERIFICATION:
                return (
                    <>
                        <div className="text-center mb-8">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <EnvelopeIcon className="w-8 h-8 text-primary" />
                            </div>
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
                                onComplete={() => {
                                    setCurrentStep(ForgotPasswordStep.NEW_PASSWORD)
                                }}
                                error={error}
                            />

                            <Button
                                onClick={() => setCurrentStep(ForgotPasswordStep.NEW_PASSWORD)}
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
                    </>
                );

            case ForgotPasswordStep.NEW_PASSWORD:
                return (
                    <>
                        <div className="text-center mb-8">
                            <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Update Password</h1>
                            <p className="text-gray-600">Set a new password and confirm to proceed</p>
                        </div>

                        <div className="space-y-5">
                            <Input
                                label="New Password"
                                placeholder="Create a secure password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setError('');
                                }}
                                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                                error={error && newPassword !== confirmPassword ? '' : error}
                            />

                            <Input
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setError('');
                                }}
                                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                                error={error && newPassword === confirmPassword ? '' : (newPassword !== confirmPassword ? 'Passwords do not match' : '')}
                            />

                            <div className="pt-4">
                                <Button
                                    onClick={handleResetPassword}
                                    loading={isLoading}
                                    fullWidth
                                >
                                    Reset Password
                                </Button>
                            </div>
                        </div>
                    </>
                );

            case ForgotPasswordStep.SUCCESS:
                return (
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-8 h-8 text-green-600"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset</h1>
                        <p className="text-gray-600 mb-8">
                            Your password has been successfully reset. Redirecting you to login...
                        </p>
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-full p-5">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                {renderStep()}
            </div>

            {/* Footer - Only show back button when appropriate */}
            {currentStep !== ForgotPasswordStep.SUCCESS && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => currentStep === ForgotPasswordStep.EMAIL_FORM
                            ? navigate({ to: '/login' })
                            : setCurrentStep(currentStep - 1)
                        }
                        className="flex items-center justify-center text-primary font-medium hover:underline mx-auto"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        {currentStep === ForgotPasswordStep.EMAIL_FORM ? 'Back to Login' : 'Back'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ForgotPasswordScreen; 