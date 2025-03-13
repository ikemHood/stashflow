import React, { useState } from 'react';
import Button from '../components/Button';
import { useNavigate } from '@tanstack/react-router';

const WelcomeScreen: React.FC = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    // Welcome screen content slides 
    const slides = [
        {
            title: 'Connect Your Crypto Wallet',
            description: '',
            image: '/assets/connect-wallet.svg'
        },
        {
            title: 'Define Your Goal, Start Saving',
            description: '',
            image: '/assets/define-goal.svg'
        },
        {
            title: 'Save Without the Volatility',
            description: '',
            image: '/assets/save-volatility.svg'
        },
        {
            title: 'Auto-Save or Manual, You Choose',
            description: '',
            image: '/assets/auto-save.png'
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            // Navigate to login screen when we reach the end of slides
            navigate({ to: '/signup' });
        }
    };

    const goToLogin = () => {
        navigate({ to: '/login' });
    };

    const goToSignup = () => {
        navigate({ to: '/signup' });;
    };

    const currentContent = slides[currentSlide];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Status bar dots */}
            <div className="pt-16 pb-8 flex justify-center">
                <div className="flex gap-2">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all ${index === currentSlide
                                ? 'w-8 bg-primary'
                                : 'w-1.5 bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Main content */}
            <div onTouchStart={nextSlide} onClick={nextSlide} className="flex-1 flex flex-col items-center justify-center px-5">
                <div className="w-full max-w-xs mb-10">
                    <img
                        src={currentContent.image}
                        alt={currentContent.title}
                        className="w-full h-auto"
                    />
                </div>

                <h2 className="text-2xl font-bold text-center mb-3">
                    {currentContent.title}
                </h2>
            </div>

            {/* Bottom navigation buttons */}
            <div className="px-5 pb-10 space-y-3">
                <Button
                    onClick={goToSignup}
                    fullWidth
                >
                    {currentSlide < slides.length - 1 ? 'Signup' : 'Signup'}
                </Button>

                <button
                    onClick={goToLogin}
                    className="w-full py-3.5 text-center text-gray-700 bg-gray-100 rounded-lg font-medium"
                >
                    Log into your account
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen; 