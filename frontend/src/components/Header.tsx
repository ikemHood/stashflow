import React from 'react';
import { Bars3Icon, PlusIcon, WalletIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { shortenAddress } from '../utils/helpers';

interface HeaderProps {
    showBackButton?: boolean;
    title?: string;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    showBackButton = false,
    title = 'Stashflow',
    onMenuClick
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const router = useRouter();

    const handleBack = () => {
        // Go back in history
        window.history.back();
    };

    return (
        <header className="bg-white shadow-sm py-4 px-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {showBackButton ? (
                        <button
                            onClick={handleBack}
                            className="p-1.5 rounded-xl hover:bg-gray-100"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={onMenuClick}
                            className="p-1.5 rounded-xl hover:bg-gray-100"
                        >
                            <Bars3Icon className="w-5 h-5" />
                        </button>
                    )}

                    <h1 className="text-lg font-semibold">{title}</h1>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => navigate({ to: '/add-milestone' })}
                        className="p-1.5 rounded-xl text-primary hover:bg-primary/10"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => { }}
                        className="flex items-center space-x-2 py-1.5 px-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                    >
                        <WalletIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {user ? shortenAddress(user.address) : 'Connect'}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header; 