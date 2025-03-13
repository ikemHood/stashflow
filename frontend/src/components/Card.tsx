import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    bordered?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    shadow = 'md',
    bordered = false,
    padding = 'md',
}) => {
    // Shadow classes
    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
    };

    // Padding classes
    const paddingClasses = {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-7',
    };

    const borderClasses = bordered ? 'border border-gray-200' : '';

    const cardClasses = `bg-white rounded-2xl ${shadowClasses[shadow]} ${paddingClasses[padding]} ${borderClasses} ${className} ${onClick ? 'cursor-pointer transition-transform hover:scale-[1.01]' : ''}`;

    return (
        <div className={cardClasses} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card; 