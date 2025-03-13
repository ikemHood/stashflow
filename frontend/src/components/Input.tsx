import React, { InputHTMLAttributes, useState } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    fullWidth = true,
    size = 'md',
    className = '',
    leftIcon,
    rightIcon,
    disabled,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    // Size classes
    const sizeClasses = {
        sm: 'py-1.5 px-3 text-sm',
        md: 'py-2.5 px-4',
        lg: 'py-3 px-5 text-lg',
    };

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    // Container classes
    const containerClasses = `${widthClasses} mb-4 ${className}`;

    // Input container classes based on state
    const getInputContainerClasses = () => {
        if (error) {
            return 'border-danger focus-within:border-danger focus-within:ring-danger/30';
        }
        if (isFocused) {
            return 'border-primary focus-within:ring-primary/30';
        }
        return 'border-gray-300 focus-within:border-primary';
    };

    const inputContainerClasses = `flex items-center border-2 rounded-xl focus-within:ring-2 focus-within:ring-opacity-30 ${sizeClasses[size]} ${getInputContainerClasses()} ${disabled ? 'bg-gray-100 opacity-70' : 'bg-white'}`;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (props.onFocus) {
            props.onFocus(e);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (props.onBlur) {
            props.onBlur(e);
        }
    };

    return (
        <div className={containerClasses}>
            {label && (
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            <div className={inputContainerClasses}>
                {leftIcon && (
                    <div className="mr-2 text-gray-500">
                        {leftIcon}
                    </div>
                )}

                <input
                    className="w-full bg-transparent focus:outline-none text-gray-900 placeholder-gray-500 disabled:cursor-not-allowed"
                    disabled={disabled}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />

                {rightIcon && (
                    <div className="ml-2 text-gray-500">
                        {rightIcon}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-danger text-sm">
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input; 