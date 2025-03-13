import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    // Base classes
    const baseClasses = 'flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50';

    // Variant classes
    const variantClasses = {
        primary: 'bg-primary hover:bg-primary/90 text-white focus:ring-primary/50',
        secondary: 'bg-secondary hover:bg-secondary/90 text-white focus:ring-secondary/50',
        danger: 'bg-danger hover:bg-danger/90 text-white focus:ring-danger/50',
        outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary/30',
    };

    // Size classes
    const sizeClasses = {
        sm: 'text-sm py-1.5 px-3',
        md: 'py-2.5 px-5',
        lg: 'text-lg py-3 px-6',
    };

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    // Disabled classes
    const disabledClasses = (disabled || loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${disabledClasses} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="mr-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : null}
            {children}
        </button>
    );
};

export default Button; 