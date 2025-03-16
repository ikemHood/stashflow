import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/PinInput';

// Define the steps in the PIN setup flow
enum PinSetupStep {
    CREATE_PIN = 0,
    CONFIRM_PIN = 1
}

const SetPinScreen: React.FC = () => {
    const navigate = useNavigate();
    const { setPin } = useAuth();
    const [currentStep, setCurrentStep] = useState<PinSetupStep>(PinSetupStep.CREATE_PIN);
    const [pin, setPinValue] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const firstName = localStorage.getItem('firstName') || 'John';

    const handlePinComplete = () => {
        if (currentStep === PinSetupStep.CREATE_PIN && pin.trim().length === 6) {
            const cleanPin = pin.trim();
            setPinValue(cleanPin);
            setCurrentStep(PinSetupStep.CONFIRM_PIN);
        }
    };

    const handleConfirmPinComplete = async () => {

        if (pin.trim().length !== 6 || confirmPin.trim().length !== 6) {
            return;
        }
        if (pin.trim() !== confirmPin.trim()) {
            setError('PINs do not match. Please try again.');
            setConfirmPin('');
            return;
        }

        try {
            // Save the PIN with both pin and confirmPin parameters
            await setPin(pin.trim(), confirmPin.trim());

            // Navigate to home page after setting PIN
            navigate({ to: '/home' });
        } catch (error) {
            console.error('Error setting PIN:', error);
            setError('Something went wrong. Please try again.');
        }
    };

    const handleBackToCreate = () => {
        setCurrentStep(PinSetupStep.CREATE_PIN);
        setConfirmPin('');
        setError('');
    };

    const renderStep = () => {
        switch (currentStep) {
            case PinSetupStep.CREATE_PIN:
                return (
                    <>
                        <div className="text-center mb-8">
                            <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Hello {firstName}!</h1>
                            <p className="text-gray-600">
                                Please set up your transaction PIN to access your stashflow account
                            </p>
                        </div>

                        <PinInput
                            value={pin}
                            onChange={setPinValue}
                            onComplete={handlePinComplete}
                            error={error}
                            pinLabel="Enter your PIN"
                            showConfirmButton={true}
                            onConfirm={() => setCurrentStep(PinSetupStep.CONFIRM_PIN)}
                        />

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => navigate({ to: '/login' })}
                                className="text-primary font-medium hover:underline text-sm"
                            >
                                Forgot your PIN?
                            </button>
                        </div>
                    </>
                );

            case PinSetupStep.CONFIRM_PIN:
                return (
                    <>
                        <div className="text-center mb-8">
                            <img src="/assets/logo.svg" alt="Stashflow Logo" className="h-10 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirm Your PIN</h1>
                            <p className="text-gray-600">
                                Please re-enter your PIN to confirm
                            </p>
                        </div>

                        <PinInput
                            value={confirmPin}
                            onChange={setConfirmPin}
                            onComplete={handleConfirmPinComplete}
                            error={error}
                            pinLabel="Re-enter your PIN"
                            showConfirmButton={true}
                            onConfirm={handleConfirmPinComplete}
                        />

                        <div className="mt-8 text-center">
                            <button
                                onClick={handleBackToCreate}
                                className="text-primary font-medium hover:underline text-sm"
                            >
                                Go back to enter a different PIN
                            </button>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-full p-5">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                {renderStep()}
            </div>
        </div>
    );
};

export default SetPinScreen; 