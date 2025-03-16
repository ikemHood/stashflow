import React from 'react';
import { useNavigate } from '@tanstack/react-router';

interface TabBarProps {
    activeTab: 'home' | 'savings' | 'profile';
}

const TabBar: React.FC<TabBarProps> = ({ activeTab }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 px-5">
            <button
                className={`flex flex-col items-center ${activeTab === 'home' ? 'text-primary' : 'text-gray-500'}`}
                onClick={() => navigate({ to: '/home' })}
            >
                <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="text-xs">Home</span>
            </button>

            <button
                className={`flex flex-col items-center ${activeTab === 'savings' ? 'text-primary' : 'text-gray-500'}`}
                onClick={() => navigate({ to: '/savings' })}
            >
                <img src="/assets/saveIcon.svg" className="w-6 h-6 mb-1" />
                <span className="text-xs">Savings</span>
            </button>

            <button
                className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-primary' : 'text-gray-500'}`}
                onClick={() => navigate({ to: '/profile' })}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 20.662V19C7 18.4696 7.21071 17.9609 7.58579 17.5858C7.96086 17.2107 8.46957 17 9 17H15C15.5304 17 16.0391 17.2107 16.4142 17.5858C16.7893 17.9609 17 18.4696 17 19V20.662" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs">Profile</span>
            </button>
        </div>
    );
};

export default TabBar; 