import React from 'react';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import Card from './Card';
import { Milestone } from '../context/MilestoneContext';
import { formatDate } from '../utils/helpers';

interface MilestoneCardProps {
    milestone: Milestone;
    onDeposit?: () => void;
    onWithdraw?: () => void;
    className?: string;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
    milestone,
    onDeposit,
    onWithdraw,
    className = '',
}) => {
    const { name, targetAmount, currentAmount, deadline, completed, progress } = milestone;

    // Determine status color
    const getStatusColor = () => {
        if (completed) return 'bg-green-100 text-green-800';
        if (progress < 50) return 'bg-red-100 text-red-800';
        return 'bg-blue-100 text-blue-800';
    };

    // Determine progress bar color
    const getProgressBarColor = () => {
        if (completed) return 'bg-green-500';
        if (progress < 50) return 'bg-red-500';
        return 'bg-primary';
    };

    return (
        <Card
            className={`overflow-hidden ${className}`}
            padding="none"
        >
            {/* Card Header */}
            <div className="flex justify-between items-start p-5 pb-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
                    <p className="text-sm text-gray-500">Due {deadline}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {completed ? 'Completed' : `${progress}%`}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full ${getProgressBarColor()}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Card Details */}
            <div className="px-5 pb-4 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Current</p>
                    <p className="text-lg font-semibold text-gray-900">{currentAmount} ETH</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Target</p>
                    <p className="text-lg font-semibold text-gray-900">{targetAmount} ETH</p>
                </div>
            </div>

            {/* Card Actions */}
            {!completed && (
                <div className="grid grid-cols-2 divide-x border-t border-gray-200">
                    <button
                        onClick={onDeposit}
                        className="py-3 flex items-center justify-center text-primary hover:bg-gray-50 transition"
                    >
                        <ArrowUpCircleIcon className="w-4 h-4 mr-2" />
                        Deposit
                    </button>
                    <button
                        onClick={onWithdraw}
                        disabled={progress < 100}
                        className={`py-3 flex items-center justify-center transition ${progress >= 100
                            ? 'text-primary hover:bg-gray-50'
                            : 'text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <ArrowUpCircleIcon className="w-4 h-4 mr-2 rotate-180" />
                        Withdraw
                    </button>
                </div>
            )}
        </Card>
    );
};

export default MilestoneCard; 