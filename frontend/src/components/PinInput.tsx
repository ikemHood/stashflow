import React, { useState, useEffect } from 'react';
import { BackspaceIcon, ArrowRightIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface PinInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: () => void;
    showConfirmButton?: boolean;
    onConfirm?: () => void;
    error?: string;
    maxLength?: number;
    pinLabel?: string;
}

const PinInput: React.FC<PinInputProps> = ({
    value,
    onChange,
    onComplete,
    showConfirmButton = false,
    onConfirm,
    error,
    maxLength = 6,
    pinLabel = "Enter your PIN"
}) => {
    // Track if we've reached max length to avoid duplicate triggering
    const [hasTriggeredComplete, setHasTriggeredComplete] = useState(false);

    // Reset the trigger state when value changes
    useEffect(() => {
        if (value.length < maxLength) {
            setHasTriggeredComplete(false);
        }
    }, [value, maxLength]);

    const handleDigitClick = (digit: string) => {
        if (value.length < maxLength) {
            // Calculate new value
            const newValue = value.trim() + digit;

            // Update the value via onChange
            onChange(newValue);

            // Check if we've reached the max length and haven't triggered yet
            if (newValue.length === maxLength && onComplete && !hasTriggeredComplete) {
                console.log("Max length reached, triggering onComplete");
                // Mark as triggered to avoid duplicate calls
                setHasTriggeredComplete(true);

                // Small delay to ensure state is updated before completing
                setTimeout(() => {
                    onComplete();
                }, 300);
            }
        }
    };

    const handleBackspace = () => {
        if (value.length > 0) {
            const newValue = value.slice(0, -1);
            onChange(newValue);
        }
    };

    const handleClear = () => {
        onChange('');
    };

    const renderDigits = () => {
        return Array.from({ length: maxLength }).map((_, index) => (
            <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${index < value.length
                    ? 'bg-primary text-white'
                    : 'bg-gray-100'
                    }`}
            >
                {index < value.length ? '•' : ''}
            </div>
        ));
    };

    const handleConfirmClick = () => {
        if (value.length === maxLength && onConfirm) {
            console.log("Confirm button clicked with complete PIN");
            // Small delay to ensure UI updates before calling onConfirm
            setTimeout(() => {
                onConfirm();
            }, 300);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-4">{pinLabel}</p>

            {/* PIN Display */}
            <div className="flex space-x-3 mb-8 w-full justify-center">
                {renderDigits()}
            </div>

            {error && (
                <p className="text-danger text-sm mb-4">{error}</p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                        key={digit}
                        type="button"
                        onClick={() => handleDigitClick(digit.toString())}
                        className="w-16 h-16 text-2xl font-medium rounded-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none"
                    >
                        {digit}
                    </button>
                ))}

                {/* Bottom row */}
                <button
                    type="button"
                    onClick={handleClear}
                    className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
                >
                    <XCircleIcon className="w-6 h-6 text-gray-600" />
                </button>

                <button
                    type="button"
                    onClick={() => handleDigitClick('0')}
                    className="w-16 h-16 text-2xl font-medium rounded-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none"
                >
                    0
                </button>

                {showConfirmButton ? (
                    <button
                        type="button"
                        onClick={handleConfirmClick}
                        disabled={value.length !== maxLength}
                        className={`w-16 h-16 rounded-full flex items-center justify-center focus:outline-none ${value.length === maxLength
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-400'
                            }`}
                    >
                        <ArrowRightIcon className="w-6 h-6" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleBackspace}
                        className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
                    >
                        <BackspaceIcon className="w-6 h-6 text-gray-600" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PinInput; 