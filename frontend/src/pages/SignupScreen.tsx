import React, { useEffect, useState } from 'react';
import {
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon,
    CheckIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useVerifyEmail, useResendVerificationCode } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import VerificationCodeInput from '../components/VerificationCodeInput';

enum SignupStep {
    INITIAL_FORM = 0,
    EMAIL_VERIFICATION = 1,
    SUCCESS = 2
}

// Define password requirements
const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', validate: (pass: string) => pass.length >= 8 },
    { id: 'uppercase', label: 'Must contain uppercase letter', validate: (pass: string) => /[A-Z]/.test(pass) },
    { id: 'lowercase', label: 'Must contain lowercase letter', validate: (pass: string) => /[a-z]/.test(pass) },
    { id: 'number', label: 'Must contain a number', validate: (pass: string) => /\d/.test(pass) },
    { id: 'special', label: 'Must contain a special character', validate: (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) },
];

const SignupScreen: React.FC = () => {
    const { signup, isLoading } = useAuth();
    const verifyEmailMutation = useVerifyEmail();
    const resendCodeMutation = useResendVerificationCode();

    const navigate = useNavigate();

    // State for the current step in the signup flow
    const [currentStep, setCurrentStep] = useState<SignupStep>(SignupStep.INITIAL_FORM);

    // User information state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Redirect authenticated users to home
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            navigate({ to: '/home' });
        }
    }, [navigate]);

    // Error states
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: '',
        verificationCode: ''
    });

    // Check password requirements
    const getPasswordStrength = (): number => {
        const metRequirements = passwordRequirements.filter(req => req.validate(password)).length;
        return Math.min(100, (metRequirements / passwordRequirements.length) * 100);
    };

    const passwordStrength = getPasswordStrength();

    const validateInitialForm = (): boolean => {
        let isValid = true;
        const newErrors = {
            ...errors,
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: ''
        };

        // Validate name
        if (!name.trim()) {
            newErrors.name = 'Full name is required';
            isValid = false;
        }

        // Validate email
        if (!email.trim()) {
            newErrors.email = 'Email address is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            isValid = false;
        }

        // Validate password
        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (passwordStrength < 100) {
            newErrors.password = 'Password does not meet all requirements';
            isValid = false;
        }

        // Validate confirm password
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        // Validate terms
        if (!acceptTerms) {
            newErrors.terms = 'You must accept the terms to continue';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const validateVerificationCode = (): boolean => {
        let isValid = true;
        const newErrors = { ...errors, verificationCode: '' };

        if (!verificationCode.trim() || verificationCode.length !== 6) {
            newErrors.verificationCode = 'Please enter a valid 6-digit verification code';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleInitialSubmit = async () => {
        if (!validateInitialForm()) return;

        try {
            await signup(name, email, password);
            setCurrentStep(SignupStep.EMAIL_VERIFICATION);
        } catch (error) {
            setErrors({
                ...errors,
                email: error instanceof Error ? error.message : 'Failed to create account',
            });
        }
    };

    const handleVerificationSubmit = async () => {
        if (!validateVerificationCode()) return;

        try {
            // Use the verification API
            await verifyEmailMutation.mutateAsync(verificationCode);

            // Store first name in localStorage for PIN setup screen
            const firstName = name.split(' ')[0];
            localStorage.setItem('firstName', firstName);

            // Navigate to PIN setup screen
            navigate({ to: '/pin/set' });
        } catch (error) {
            console.error('Error completing signup:', error);
            setErrors({
                ...errors,
                verificationCode: error instanceof Error ? error.message : 'Invalid verification code'
            });
        }
    };

    const handleResendCode = async () => {
        try {
            await resendCodeMutation.mutateAsync();
            toast.success('Verification code resent to your email!');
        } catch (error) {
            console.error('Error resending verification code:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to resend verification code');
        }
    };

    // Render the correct step
    const renderStep = () => {
        switch (currentStep) {
            case SignupStep.INITIAL_FORM:
                return (
                    <>
                        <div className="text-center mb-8">
                            <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
                            <p className="text-gray-600">Join Stashflow and start saving smarter</p>
                        </div>

                        <div className="space-y-5">
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                leftIcon={<UserIcon className="w-5 h-5" />}
                                error={errors.name}
                            />

                            <Input
                                label="Email Address"
                                placeholder="youremail@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                                error={errors.email}
                            />

                            <div className="space-y-2">
                                <Input
                                    label="Password"
                                    placeholder="Create a secure password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (!isPasswordFocused && e.target.value) {
                                            setIsPasswordFocused(true);
                                        }
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    onFocus={() => setIsPasswordFocused(true)}
                                    leftIcon={<LockClosedIcon className="w-5 h-5" />}
                                    error={errors.password}
                                />

                                {/* Password strength indicator - only show when password field is focused or has value */}
                                {isPasswordFocused && (
                                    <div className="space-y-2 mt-1">
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength >= 100 ? 'bg-green-500' :
                                                    passwordStrength >= 60 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                                style={{ width: `${passwordStrength}%` }}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            {passwordRequirements.map((req) => (
                                                <div key={req.id} className="flex items-center text-sm">
                                                    <CheckIcon
                                                        className={`w-4 h-4 mr-2 ${req.validate(password)
                                                            ? 'text-green-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                    <span className={`${req.validate(password)
                                                        ? 'text-gray-700'
                                                        : 'text-gray-500'
                                                        }`}>
                                                        {req.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Input
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                }}
                                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                                error={errors.confirmPassword}
                            />

                            <div className="flex items-start mt-4">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => {
                                            setAcceptTerms(e.target.checked);
                                            if (errors.terms) setErrors({ ...errors, terms: '' });
                                        }}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="terms" className="text-gray-600">
                                        I agree to the <button className="text-primary font-medium hover:underline">Terms of Service</button> and <button className="text-primary font-medium hover:underline">Privacy Policy</button>
                                    </label>
                                    {errors.terms && (
                                        <p className="mt-1 text-danger text-sm">{errors.terms}</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleInitialSubmit}
                                    loading={isLoading}
                                    fullWidth
                                >
                                    Create Account
                                </Button>
                            </div>
                        </div>
                    </>
                );

            case SignupStep.EMAIL_VERIFICATION:
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
                                onComplete={handleVerificationSubmit}
                                error={errors.verificationCode}
                            />

                            <Button
                                onClick={handleVerificationSubmit}
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

            case SignupStep.SUCCESS:
                return (
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h1>
                        <p className="text-gray-600 mb-8">
                            Your account has been successfully created. Creating your PIN next...
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

            {/* Footer - only show on initial form */}
            {currentStep === SignupStep.INITIAL_FORM && (
                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate({ to: '/login' })}
                            className="text-primary font-medium hover:underline"
                        >
                            Log In
                        </button>
                    </p>
                </div>
            )}

            {/* Back button for verification and PIN setup steps */}
            {(currentStep === SignupStep.EMAIL_VERIFICATION) && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="text-primary font-medium hover:underline flex items-center justify-center mx-auto"
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
                        Back
                    </button>
                </div>
            )}
        </div>
    );
};

export default SignupScreen;

