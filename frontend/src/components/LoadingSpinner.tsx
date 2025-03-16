import React from 'react';

type LoadingSpinnerProps = {
    size?: 'small' | 'medium' | 'large';
    color?: 'primary' | 'white';
    className?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    color = 'primary',
    className = '',
}) => {
    // Determine the size in pixels
    const sizeMap = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
    };

    // Determine the color
    const colorMap = {
        primary: 'border-blue-600',
        white: 'border-white',
    };

    const sizeClass = sizeMap[size];
    const colorClass = colorMap[color];

    return (
        <div
            className={`${sizeClass} ${colorClass} ${className} rounded-full border-2 border-t-transparent animate-spin`}
            role="status"
            aria-label="Loading"
        />
    );
};

export default LoadingSpinner; 