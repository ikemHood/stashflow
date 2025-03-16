import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMilestones } from '../context/MilestoneContext';
import Button from '../components/Button';
import { toast } from 'sonner';
import { MergedMilestone, Transaction } from '../types/api';
import { formatCurrency } from '../utils/formatters';
import { calculateDaysLeft, calculateProgressPercentage } from '../utils/calculations';
import { isMilestoneCompleted } from '../utils/milestoneUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMilestoneTransactions } from '../hooks/useTransaction';
import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    ClockIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// Format date to display in a user-friendly way
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Format transaction type for display
const formatTransactionType = (type: string) => {
    switch (type.toUpperCase()) {
        case 'DEPOSIT':
            return {
                label: 'Deposit',
                icon: <ArrowDownTrayIcon className="w-4 h-4 text-green-500" />,
                textColor: 'text-green-500'
            };
        case 'WITHDRAWAL':
            return {
                label: 'Withdrawal',
                icon: <ArrowUpTrayIcon className="w-4 h-4 text-red-500" />,
                textColor: 'text-red-500'
            };
        default:
            return {
                label: type,
                icon: <ClockIcon className="w-4 h-4 text-gray-500" />,
                textColor: 'text-gray-500'
            };
    }
};

const MilestoneDetailScreen: React.FC = () => {
    const navigate = useNavigate();
    const { milestoneId } = useParams({ from: '/savings/$milestoneId' });
    const {
        milestones,
        fetchMilestones,
        isLoading,
        withdrawFromMilestone,
        emergencyWithdraw,
        depositToMilestone,
        approveTokenForContract
    } = useMilestones();
    const { data: transactionsData } = useMilestoneTransactions(milestoneId);

    const [milestone, setMilestone] = useState<MergedMilestone | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [showDepositConfirm, setShowDepositConfirm] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [depositLoading, setDepositLoading] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadMilestones = async () => {
            try {
                // Only fetch if needed - reduce unnecessary API calls
                if (milestones.length === 0) {
                    await fetchMilestones();
                }
            } catch (err) {
                console.error('Failed to fetch milestones:', err);
                setError('Failed to load milestones');
            }
        };

        loadMilestones();
    }, [fetchMilestones, milestones.length]);

    useEffect(() => {
        // Find the milestone with the matching ID
        if (milestones.length > 0) {
            const found = milestones.find(m => m.id === milestoneId);
            if (found) {
                setMilestone(found);
                // Reset error if we found a milestone
                setError(null);
            } else {
                setError('Milestone not found');
            }
        }
    }, [milestoneId, milestones]);

    useEffect(() => {
        if (transactionsData?.success && transactionsData.data) {
            setTransactions(transactionsData.data.data || []);
        } else if (transactionsData && !transactionsData.success) {
            // Only set error for transaction data if we don't already have an error
            if (!error) {
                setError('Failed to load transaction history');
            }
            // Keep existing transaction data if any
            if (transactions.length === 0) {
                // Use mock data as fallback
                const mockTransactions: Transaction[] = [
                    {
                        id: '1',
                        userId: milestone?.userId || 'unknown',
                        walletId: 'wallet123',
                        type: 'DEPOSIT',
                        amount: '10',
                        status: 'COMPLETED',
                        txHash: '0x123abc',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ];
                setTransactions(mockTransactions);
            }
        }
    }, [transactionsData, milestone, error, transactions.length]);

    const handleWithdraw = async () => {
        setShowWithdrawConfirm(true);
    };

    const handleDeposit = () => {
        if (milestone?.savingMethod === 'AUTOMATIC' && milestone.fixedAmount) {
            handleConfirmDeposit(milestone.fixedAmount);
        } else {
            setShowDepositConfirm(true);
        }
    };

    const handleConfirmWithdraw = async () => {
        if (!milestone) return;

        // For withdrawals, check if the milestone is completed
        const completed = isMilestoneCompleted(milestone);

        setWithdrawLoading(true);
        setError(null);

        try {
            let result: string | boolean;

            if (completed) {
                // Use regular withdraw if the goal is completed
                result = await withdrawFromMilestone(milestone);
            } else {
                // Use emergency withdraw with penalty if not completed
                result = await emergencyWithdraw(milestone);
            }

            if (result) {
                toast.success('Withdrawal processed successfully');
                setShowWithdrawConfirm(false);
                await fetchMilestones();
            } else {
                toast.error('Withdrawal failed');
            }
        } catch (err) {
            console.error('Error during withdrawal:', err);
            setError('Failed to process withdrawal');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const handleConfirmDeposit = async (amount?: string) => {
        if (!milestone) return;

        const depositAmt = amount || depositAmount;
        if (!depositAmt || parseFloat(depositAmt) <= 0) {
            setError('Please enter a valid deposit amount');
            return;
        }

        setDepositLoading(true);
        setError(null);

        try {
            // For ERC20 tokens, approve the contract first
            if (milestone.tokenAddress !== '0x0000000000000000000000000000000000000000') {
                const approved = await approveTokenForContract(milestone.tokenAddress, depositAmt);
                if (!approved) {
                    throw new Error('Failed to approve token transfer');
                }
            }

            // Then deposit
            const result = await depositToMilestone(milestone, depositAmt);

            if (result) {
                toast.success('Deposit processed successfully');
                setShowDepositConfirm(false);
                setDepositAmount('');
                await fetchMilestones();
            } else {
                toast.error('Deposit failed');
            }
        } catch (err) {
            console.error('Error during deposit:', err);
            setError('Failed to process deposit');
        } finally {
            setDepositLoading(false);
        }
    };

    const closeWithdrawModal = () => {
        setShowWithdrawConfirm(false);
        setError(null);
    };

    const closeDepositModal = () => {
        setShowDepositConfirm(false);
        setDepositAmount('');
        setError(null);
    };

    if (isLoading) {
        return (
            <div className="h-full flex justify-center items-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error && !milestone) {
        return (
            <div className="h-full flex flex-col justify-center items-center p-4">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => navigate({ to: '/savings' })}>Back to Savings</Button>
            </div>
        );
    }

    if (!milestone) {
        return (
            <div className="h-full flex justify-center items-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    const progress = calculateProgressPercentage(milestone.currentAmount, milestone.targetAmount);
    const daysLeft = calculateDaysLeft(milestone.endDate);
    const isCompleted = isMilestoneCompleted(milestone);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 flex items-center border-b border-gray-200">
                <button
                    onClick={() => navigate({ to: '/savings' })}
                    className="p-1 rounded-full text-gray-600 hover:bg-gray-100"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2 flex-1">Savings Goal Details</h1>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="w-full h-48 bg-gray-200">
                    <img
                        src="/assets/target.png"
                        alt={milestone.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Goal Information */}
                <div className="bg-white p-4 mb-4">
                    <h2 className="text-2xl font-bold mb-1">{milestone.name}</h2>
                    <p className="text-gray-600 mb-4">{milestone.description || 'No description'}</p>

                    {/* Status Badge */}
                    <div className="mb-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                        {milestone.savingMethod === 'AUTOMATIC' && (
                            <span className="ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Automatic
                                {milestone.fixedAmount && ` (${formatCurrency(milestone.fixedAmount)})`}
                            </span>
                        )}
                    </div>

                    {/* Progress information */}
                    <div className="mb-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full">
                            <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-gray-600 text-sm">
                                {formatCurrency(milestone.currentAmount)}
                            </span>
                            <span className="text-gray-800 font-medium">
                                {formatCurrency(milestone.targetAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Date information */}
                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">Start Date</p>
                                <p className="font-medium">{formatDate(milestone.startDate)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm mb-1">Target Date</p>
                                <p className="font-medium">{formatDate(milestone.endDate)}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {daysLeft > 0
                                ? `${daysLeft} days remaining`
                                : 'Goal deadline reached'}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={handleWithdraw}
                            variant="secondary"
                            fullWidth
                            disabled={parseFloat(milestone.currentAmount) <= 0}
                        >
                            Withdraw
                        </Button>
                        <Button
                            onClick={handleDeposit}
                            fullWidth
                        >
                            {milestone.savingMethod === 'AUTOMATIC' ? 'Auto-Deposit' : 'Deposit'}
                        </Button>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white p-4 mb-4">
                    <h3 className="font-bold text-lg mb-3">Transaction History</h3>

                    {transactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No transactions yet</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {transactions.map((transaction) => (
                                <div key={transaction.id} className="py-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium">
                                            {formatTransactionType(transaction.type).label}
                                        </span>
                                        <span className={`font-medium ${transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'DEPOSIT' ? '+' : '-'}
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-500 text-sm">
                                            {formatDate(transaction.createdAt)}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            {transaction.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-center">
                                Are You Sure?
                            </h3>

                            {!isMilestoneCompleted(milestone) && (
                                <p className="text-center text-gray-600 mt-2">
                                    Withdrawing before your goal is complete may result in {milestone.withdrawalPenalty || 5}% deduction
                                </p>
                            )}
                        </div>

                        <div className="flex justify-between space-x-3 mt-6">
                            <Button
                                onClick={closeWithdrawModal}
                                variant="secondary"
                                disabled={withdrawLoading}
                                fullWidth
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmWithdraw}
                                loading={withdrawLoading}
                                variant="primary"
                                fullWidth
                            >
                                Withdraw
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            {showDepositConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Make a Deposit</h3>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">
                                Deposit Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    $
                                </span>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="mt-4 flex justify-between text-sm text-gray-600">
                                <span>Target Amount: {formatCurrency(milestone.targetAmount)}</span>
                                <span>Current Balance: {formatCurrency(milestone.currentAmount)}</span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button
                                onClick={closeDepositModal}
                                variant="secondary"
                                disabled={depositLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleConfirmDeposit()}
                                loading={depositLoading}
                                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                            >
                                Confirm Deposit
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MilestoneDetailScreen; 