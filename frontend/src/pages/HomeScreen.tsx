import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
    PlusIcon,
    BellIcon,
    ArrowsRightLeftIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useMilestones } from '../context/MilestoneContext';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import ConnectWalletButton from '../components/ConnectWalletButton';
import { useAppKit, useAppKitAccount, useWalletInfo } from '@reown/appkit/react';
import TabBar from '../components/TabBar';

// Type definition for setup steps
interface SetupStep {
    id: string;
    title: string;
    description: string;
    icon: string;
    completed: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

const HomeScreen: React.FC = () => {
    const { user, isAuthenticated, isPinRequired } = useAuth();
    const { milestones, fetchMilestones } = useMilestones();
    const navigate = useNavigate();
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletInfo } = useWalletInfo();

    // Ref to track step changes and prevent infinite loops
    const stepUpdateRef = useRef(false);

    // Track completion status of setup steps
    const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
        {
            id: 'wallet',
            title: 'Connect crypto wallet',
            description: 'Connect your wallet, authorise connection and top up if needed.',
            icon: '/assets/wallet.svg',
            completed: isConnected,
            // onClick: () => handleConnectWallet(),
        },
        {
            id: 'goal',
            title: 'Setup saving goals',
            description: 'Set goal type, amount, duration, saving method, and stablecoin.',
            icon: '/assets/save.svg',
            completed: false,
            onClick: () => handleSetGoal(),
            disabled: !isConnected,
        },
        // {
        //     id: 'kyc',
        //     title: 'KYC verification',
        //     description: 'Complete KYC to withdraw crypto to fiat; direct crypto transfers may not require it.',
        //     icon: '/assets/kyc.svg',
        //     completed: false,
        //     onClick: () => handleKycVerification(),
        //     // Disable KYC verification as per requirement
        //     disabled: true,
        // }
    ]);

    useEffect(() => {
        // Check if PIN verification is required
        if (isPinRequired) {
            navigate({ to: '/pin/verify' });
        }
    }, [isPinRequired, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMilestones();
        }
    }, [fetchMilestones, isAuthenticated]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');

        if (!storedToken || !storedUser) {
            navigate({ to: '/login', replace: true });
        }
    }, [navigate]);

    // Update wallet step status based on connection
    useEffect(() => {
        updateStepStatus('wallet', isConnected);
    }, [isConnected]);

    // This effect updates step dependencies correctly without causing infinite loops
    useEffect(() => {
        // Skip if this effect is running because we're in the middle of a step update
        if (stepUpdateRef.current) {
            stepUpdateRef.current = false;
            return;
        }

        // Check if steps need updating
        let needsUpdate = false;
        let previousStepCompleted = true;

        // Create a copy to track potential changes
        const updatedSteps = setupSteps.map((step, index) => {
            let shouldBeDisabled;

            if (index === 0) {
                shouldBeDisabled = false;
            } else {
                shouldBeDisabled = !previousStepCompleted;
            }

            // Remember completion status for next iteration
            previousStepCompleted = step.completed;

            // If the disabled state needs to change, mark for update
            if (step.disabled !== shouldBeDisabled) {
                needsUpdate = true;
                return { ...step, disabled: shouldBeDisabled };
            }

            return step;
        });

        // Only update if we actually need to
        if (needsUpdate) {
            setSetupSteps(updatedSteps);
        }
    }, [isConnected, setupSteps]);

    const updateStepStatus = useCallback((stepId: string, completed: boolean) => {
        stepUpdateRef.current = true; // Mark that we're updating steps
        setSetupSteps(prevSteps => {
            const newSteps = prevSteps.map(step =>
                step.id === stepId ? { ...step, completed } : step
            );

            // Find the index of the completed step
            const completedStepIndex = newSteps.findIndex(step => step.id === stepId);

            // If there's a next step and current step was completed, enable the next step
            if (completed && completedStepIndex >= 0 && completedStepIndex < newSteps.length - 1) {
                newSteps[completedStepIndex + 1].disabled = false;
            }

            return newSteps;
        });
    }, []);

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleWalletConnected = useCallback((_: string) => {
        updateStepStatus('wallet', true);
    }, [updateStepStatus]);

    const handleSetGoal = useCallback(() => {
        navigate({ to: '/add-milestone' });
    }, [navigate]);

    const handleQuickSave = useCallback(() => {
        navigate({ to: '/add-milestone' });
    }, [navigate]);

    const handleWithdraw = useCallback(() => {
        if (milestones.length > 0) {
            navigate({ to: '/savings' });
        } else {
            toast.error('You have no savings goals to withdraw from');
        }
    }, [milestones, navigate]);

    // Memoized values to avoid unnecessary recalculations
    const firstName = useMemo(() =>
        user?.name ? user.name.split(' ')[0] : 'User',
        [user?.name]
    );

    // Filter out completed steps
    const incompleteSteps = useMemo(() =>
        setupSteps.filter(step => !step.completed),
        [setupSteps]
    );

    // Calculate the step progress
    const { completedCount: _, stepProgress } = useMemo(() => {
        const completed = setupSteps.filter(step => step.completed).length;
        return {
            completedCount: completed,
            stepProgress: `${completed + 1}/${setupSteps.length}`
        };
    }, [setupSteps]);

    // Memoize the wallet display information
    const walletDisplayInfo = useMemo(() => {
        if (!address) return null;
        return {
            name: walletInfo?.name || 'Wallet',
            shortAddress: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
            icon: walletInfo?.icon || '/assets/wallet.svg'
        };
    }, [address, walletInfo]);

    // Memoize the greeting message to prevent recalculation
    const greeting = useMemo(() => getGreeting(), []);

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
                            {greeting}, {firstName}
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
                                <div className="text-4xl font-bold mb-2">
                                    ${milestones.length > 0 ? '10.02' : '0.00'}
                                </div>
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
                            {/* <button className="absolute top-4 right-4 py-2 px-3 bg-white text-primary rounded-lg text-sm font-medium flex items-center">
                                <PlusIcon className="w-4 h-4 mr-1.5" />
                                Add money
                            </button> */}
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
                            <img src="/assets/saveIcon.svg" className="w-5 h-5 text-gray-700" />
                        </div>
                        <span className="text-xs text-gray-700">Set goal</span>
                    </button>
                </div>

                {/* Connected Wallets Section */}
                {isConnected && walletDisplayInfo && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Connected Wallet</h2>
                            <span className="text-sm text-gray-400">1</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div onClick={() => open()} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{walletDisplayInfo.name}</h3>
                                    <p className="text-xs text-gray-500 truncate">{walletDisplayInfo.shortAddress}</p>
                                </div>
                                <img src={walletDisplayInfo.icon} alt={walletDisplayInfo.name} className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                )}

                {/* My Savings Section - Show if there are milestones */}
                {milestones.length > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">My Savings</h2>
                            <button className="text-primary text-sm font-medium flex items-center">
                                See more
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-4 flex items-center">
                                <div className="w-16 h-16 mr-4 rounded-md overflow-hidden">
                                    <img src="/assets/laptop.jpg" alt="Laptop" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">A New Laptop</h3>
                                    <p className="text-sm text-gray-500">MacBook Pro (14-inch, M3, 2023)</p>
                                </div>
                                <button className="text-primary flex items-center text-sm font-medium">
                                    View
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complete Setup Section - Only show if there are incomplete steps */}
                {incompleteSteps.length > 0 && (
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Complete Setup</h2>
                            <span className="text-sm text-gray-500">{stepProgress}</span>
                        </div>

                        <p className="text-gray-600 text-sm mb-6">
                            You're almost there! Complete your setup to start saving smarter
                        </p>

                        {/* Setup Steps - Only show incomplete steps */}
                        <div className="space-y-4">
                            {incompleteSteps.map((step) => (
                                step.id === 'wallet' ? (
                                    <ConnectWalletButton
                                        key={step.id}
                                        onConnect={handleWalletConnected}
                                        className={`w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center text-left ${step.disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                                    />
                                ) : (
                                    <button
                                        key={step.id}
                                        onClick={step.onClick}
                                        disabled={step.disabled}
                                        className={`w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center text-left ${step.disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="w-12 h-12 mr-4 flex-shrink-0">
                                            <img src={step.icon} alt={`${step.title} icon`} className="w-full h-full" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 mb-1">{step.title}</h3>
                                            <p className="text-xs text-gray-500">{step.description}</p>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Tab Bar - always visible, even during loading/error states */}
            <TabBar activeTab="home" />
        </div>
    );
};

export default HomeScreen; 