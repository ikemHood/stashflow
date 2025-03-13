import React, { useEffect, useState } from 'react';
import {
    PlusIcon,
    ArrowPathIcon,
    BellIcon,
    ArrowsRightLeftIcon,
    CircleStackIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useMilestones } from '../context/MilestoneContext';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

const HomeScreen: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const { milestones, isLoading, error, fetchMilestones } = useMilestones();
    const navigate = useNavigate();
    const [selectedCurrency, setSelectedCurrency] = useState('USDT');

    useEffect(() => {
        if (isAuthenticated) {
            fetchMilestones();
        }
    }, [isAuthenticated, fetchMilestones]);

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleAddMilestone = () => {
        navigate({ to: '/add-milestone' });
    };

    const handleQuickSave = () => {
        // Navigate to a quick save screen or show modal
        navigate({ to: '/add-milestone' }); // For now, redirect to add milestone
    };

    const handleWithdraw = () => {
        // Navigate to withdrawal screen
        // We'll need to update this once we have specific milestone to withdraw from
        if (milestones.length > 0) {
            navigate({ to: '/withdraw/$milestoneId', params: { milestoneId: String(milestones[0].id) } });
        } else {
            // Show a notification that there are no milestones to withdraw from
            toast.error('You have no savings goals to withdraw from');
        }
    };

    const handleSetGoal = () => {
        navigate({ to: '/add-milestone' });
    };

    const firstName = user?.name ? user.name.split(' ')[0] : 'User';

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header with greeting and notification */}
            <div className="p-5 flex justify-between items-center">
                <div className="flex items-center">
                    {user && (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold text-sm mr-3">
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {getGreeting()}, {firstName}
                            <span className="ml-1">👋</span>
                        </h1>
                        <p className="text-sm text-gray-600">Welcome to Stashflow</p>
                    </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <BellIcon className="w-6 h-6 text-gray-700" />
                </button>
            </div>

            <div className="flex-1 px-5 pb-20 overflow-y-auto">
                {/* Savings Card */}
                <div className="bg-primary rounded-2xl text-white p-5 mb-6 relative overflow-hidden">
                    {/* Purple gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-900 opacity-50"></div>

                    {/* Content */}
                    <div className="relative z-10">
                        <div className="flex items-center mb-2">
                            <h2 className="text-sm font-medium mr-1">MY SAVINGS</h2>
                            <EyeIcon className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex justify-between items-center">
                            <div className='grid grid-cols-2 mt-4 items-center'>
                                <div className="text-4xl font-bold mb-2">$0.00</div>
                                <div className="inline-flex items-center p-1 bg-white/20 h-7 w-24 rounded-full text-sm">
                                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center mr-2">
                                        <span className="text-white text-[10px] font-bold">₮</span>
                                    </div>
                                    <span className='text-xs'>USDT</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <button className="absolute top-0 right-0 py-1 px-2 bg-white text-primary rounded-lg text-sm font-medium flex items-center">
                                <PlusIcon className="w-4 h-4 mr-1.5" />
                                Add money
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-8">
                    <button
                        onClick={handleQuickSave}
                        className="flex flex-col items-center py-4 px-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#FFF0EF] flex items-center justify-center mb-2">
                            <PlusIcon className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-xs text-gray-700">Quick save</span>
                    </button>

                    <button
                        onClick={handleWithdraw}
                        className="flex flex-col items-center py-4 px-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#FFF0EF] flex items-center justify-center mb-2">
                            <ArrowsRightLeftIcon className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-xs text-gray-700">Withdraw</span>
                    </button>

                    <button
                        onClick={handleSetGoal}
                        className="flex flex-col items-center py-4 px-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#FFF0EF] flex items-center justify-center mb-2">
                            <CircleStackIcon className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-xs text-gray-700">Set goal</span>
                    </button>
                </div>

                {/* Connected Wallets Section */}
                {/* <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Connected Wallet</h2>
                        <span className="text-sm text-gray-400">3</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900">Metamask</h3>
                            </div>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="Metamask" className="w-8 h-8" />
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900">WalletConnect</h3>
                            </div>
                            <img src="https://walletconnect.com/images/logo.svg" alt="WalletConnect" className="w-8 h-8" />
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900">CoinBase</h3>
                            </div>
                            <img src="https://cryptologos.cc/logos/coinbase-coin-coin-logo.svg" alt="CoinBase" className="w-8 h-8" />
                        </div>

                        <button className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:bg-gray-50">
                            <span className="font-medium text-gray-900">Add wallet</span>
                            <div className="w-8 h-8 flex items-center justify-center">
                                <PlusIcon className="w-5 h-5 text-gray-700" />
                            </div>
                        </button>
                    </div>
                </div> */}

                {/* Complete Setup Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Complete Setup</h2>
                        <span className="text-sm text-gray-500">1/3</span>
                    </div>

                    <p className="text-gray-600 text-sm mb-6">
                        You're almost there! Complete your setup to start saving smarter
                    </p>

                    {/* Setup Steps */}
                    <div className="space-y-4">
                        <button className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center text-left hover:bg-gray-50">
                            <div className="w-12 h-12 mr-4 flex-shrink-0">
                                <img src="/assets/wallet.svg" alt="Crypto wallet icon" className="w-full h-full" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">Connect crypto wallet</h3>
                                <p className="text-xs text-gray-500">
                                    Connect your wallet, authorise connection and top up if needed.
                                </p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={handleSetGoal}
                            className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center text-left hover:bg-gray-50"
                        >
                            <div className="w-12 h-12 mr-4 flex-shrink-0">
                                <img src="/assets/save.svg" alt="Savings icon" className="w-full h-full" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">Setup saving goals</h3>
                                <p className="text-xs text-gray-500">
                                    Set goal type, amount, duration, saving method, and stablecoin.
                                </p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center text-left hover:bg-gray-50">
                            <div className="w-12 h-12 mr-4 flex-shrink-0">
                                <img src="/assets/kyc.svg" alt="KYC icon" className="w-full h-full" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-1">KYC verification</h3>
                                <p className="text-xs text-gray-500">
                                    Complete KYC to withdraw crypto to fiat; direct crypto transfers may not require it.
                                </p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </section>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 px-5">
                <button className="flex flex-col items-center text-primary">
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="text-xs">Home</span>
                </button>

                <button className="flex flex-col items-center text-gray-500">
                    <CircleStackIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs">Savings</span>
                </button>

                <button className="flex flex-col items-center text-gray-500">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default HomeScreen; 