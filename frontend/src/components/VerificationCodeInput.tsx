import React, { useRef, useEffect } from 'react';

interface VerificationCodeInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: () => void;
    error?: string;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
    length = 6,
    value,
    onChange,
    onComplete,
    error,
}) => {
    // Array of refs for each input
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newChar = e.target.value.replace(/[^0-9]/g, '');

        // Only process if it's a valid digit
        if (newChar && /^\d$/.test(newChar)) {
            // Create a new value string with the updated digit
            const newValue = value.padEnd(length, '').split('');
            newValue[index] = newChar;
            const updatedValue = newValue.join('').slice(0, length);
            onChange(updatedValue);

            // Move focus to next input if available
            if (index < length - 1 && inputRefs.current[index + 1]) {
                inputRefs.current[index + 1]?.focus();
            } else if (index === length - 1 && onComplete && updatedValue.length === length) {
                // If we're on the last input and all inputs are filled, call onComplete
                onComplete();
            }
        } else if (e.target.value === '') {
            // Handle backspace
            const newValue = value.padEnd(length, '').split('');
            newValue[index] = '';
            onChange(newValue.join('').slice(0, length));
        }
    };

    // Handle key down for backspace navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && index > 0 && !value[index]) {
            // If backspace is pressed on an empty input, move focus to previous input
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            // Move focus to previous input on left arrow
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            // Move focus to next input on right arrow
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle paste functionality
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();

        // Only proceed if we have digits
        if (!pastedData || !/^\d+$/.test(pastedData)) return;

        // Extract up to 'length' digits
        const digits = pastedData.slice(0, length).split('');
        const newValue = digits.join('');

        onChange(newValue);

        // Focus on appropriate input based on pasted length
        const focusIndex = Math.min(newValue.length, length - 1);
        if (focusIndex >= 0 && inputRefs.current[focusIndex]) {
            inputRefs.current[focusIndex]?.focus();
        }

        // Trigger onComplete if we filled all inputs
        if (newValue.length === length && onComplete) {
            onComplete();
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex justify-center space-x-2 mb-4 w-full">
                {Array.from({ length }).map((_, index) => (
                    <div key={index} className="w-full max-w-12">
                        <input
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={value[index] || ''}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={handlePaste}
                            className={`w-full h-14 text-center text-xl font-semibold rounded-md border ${error ? 'border-red-400' : 'border-gray-300'
                                } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        />
                    </div>
                ))}
            </div>

            {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
        </div>
    );
};

export default VerificationCodeInput; 