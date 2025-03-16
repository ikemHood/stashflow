import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';

const PinVerificationScreen: React.FC = () => {
    const navigate = useNavigate();
    const { verifyPin, logout } = useAuth();

    // PIN state
    const [pin, setPin] = useState('');

    // Error state
    const [error, setError] = useState('');

    const handleVerifyPin = async () => {

        if (pin.trim().length !== 6) {
            return;
        }

        // Clear any previous error
        setError('');

        try {
            // Use trimmed PIN value
            const trimmedPin = pin.trim();
            console.log("Verifying PIN with length:", trimmedPin.length);

            const isValid = await verifyPin(trimmedPin);

            if (isValid) {
                // Navigate to home page after PIN verification
                navigate({ to: '/home' });
            } else {
                setError('Invalid PIN. Please try again.');
                setPin('');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setPin('');
        }
    };

    return (
        <div className="flex flex-col min-h-full p-5">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <div className="text-center mb-8">
                    <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Enter PIN</h1>
                    <p className="text-gray-600">
                        Your session has expired. Please enter your PIN to continue.
                    </p>
                </div>

                <PinInput
                    value={pin}
                    onChange={setPin}
                    onComplete={handleVerifyPin}
                    error={error}
                    pinLabel="Enter your PIN"
                    showConfirmButton={true}
                    onConfirm={handleVerifyPin}
                />

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            // Make sure to sign out before navigating to login
                            logout();
                            navigate({ to: '/login' });
                        }}
                        className="text-primary font-medium hover:underline text-sm"
                    >
                        Sign out and log in again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinVerificationScreen; 