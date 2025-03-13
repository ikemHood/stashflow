import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

const SplashScreen: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Auto navigate to welcome screen after a delay
        const timer = setTimeout(() => {
            navigate({ to: '/welcome' });
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="h-full flex flex-col items-center justify-center bg-primary">
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center">
                    <img src="/assets/stashflow.svg" alt="Stashflow Icon" className="h-12 mr-3" />
                    {/* <span className="text-white text-3xl font-bold">Stash<span className="font-normal">Flow</span></span> */}
                </div>
            </div>
            <div className="mb-8">
                <p className="text-white text-opacity-80 text-sm">Where savings meet web3...</p>
            </div>
        </div>
    );
};

export default SplashScreen; 