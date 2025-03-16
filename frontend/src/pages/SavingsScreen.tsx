import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMilestones } from '../context/MilestoneContext';
import { MergedMilestone } from '../types/api';
import { formatCurrency } from '../utils/formatters';
import { calculateProgressPercentage } from '../utils/calculations';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const SavingsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { milestones, fetchMilestones, isLoading, error } = useMilestones();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadMilestones = async () => {
            try {
                await fetchMilestones();
            } catch (err) {
                console.error('Failed to fetch milestones:', err);
            } finally {
                setLoading(false);
            }
        };

        loadMilestones();
    }, [fetchMilestones]);

    const handleGoToDetail = (milestoneId: string) => {
        navigate({ to: '/savings/$milestoneId', params: { milestoneId } });
    };

    const handleAddNew = () => {
        navigate({ to: '/add-milestone' });
    };

    const renderMilestoneCard = (milestone: MergedMilestone) => {
        const progress = calculateProgressPercentage(milestone.currentAmount, milestone.targetAmount);

        return (
            <div
                key={milestone.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
                onClick={() => handleGoToDetail(milestone.id)}
            >
                {milestone.image && (
                    <div className="h-36 overflow-hidden">
                        <img
                            src={milestone.image}
                            alt={milestone.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{milestone.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{milestone.description || 'No description'}</p>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                        <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">
                            {formatCurrency(milestone.currentAmount)}
                        </span>
                        <span className="text-gray-800 font-medium">
                            {formatCurrency(milestone.targetAmount)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading || isLoading) {
        return (
            <div className="h-full flex justify-center items-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col justify-center items-center p-4">
                <p className="text-red-500 mb-4">Failed to load savings goals</p>
                <Button onClick={() => fetchMilestones()}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold">Your Savings</h1>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {milestones.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center">
                        <p className="text-gray-500 mb-4">You don't have any savings goals yet</p>
                        <Button onClick={handleAddNew}>Create Your First Goal</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {milestones.map(renderMilestoneCard)}
                    </div>
                )}
            </div>

            {milestones.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                    <Button onClick={handleAddNew} fullWidth>Add New Savings Goal</Button>
                </div>
            )}
        </div>
    );
};

export default SavingsScreen; 