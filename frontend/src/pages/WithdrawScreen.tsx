import React, { useEffect, useState } from 'react';
import { ArrowDownCircleIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMilestones } from '../context/MilestoneContext';

const WithdrawScreen: React.FC = () => {
    const navigate = useNavigate();
    const { milestoneId } = useParams({ from: '/withdraw/$milestoneId' });
    const { milestones, withdrawFromMilestone, isLoading } = useMilestones();

    const [milestone, setMilestone] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // Find the milestone with the given ID
        if (milestones && milestoneId) {
            const found = milestones.find(m => m.id === Number(milestoneId));
            if (found) {
                setMilestone(found);
            } else {
                // If milestone not found, go back to home
                navigate({ to: '/home' });
            }
        }
    }, [milestones, milestoneId, navigate]);

    const handleWithdraw = async () => {
        if (!milestone) return;

        // Check if milestone is complete or has reached its target
        if (!milestone.completed && milestone.progress < 100) {
            setError('Milestone must be completed or fully funded before withdrawing');
            return;
        }

        try {
            const success = await withdrawFromMilestone(milestone.id);
            if (success) {
                navigate({ to: '/home' });
            }
        } catch (error) {
            console.error('Error withdrawing from milestone:', error);
            setError('Failed to withdraw. Please try again.');
        }
    };

    if (!milestone) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Withdraw Funds" showBackButton />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    const isWithdrawable = milestone.completed || milestone.progress >= 100;

    return (
        <div className="flex flex-col h-full">
            <Header title="Withdraw Funds" showBackButton />

            <div className="flex-1 p-5 overflow-y-auto">
                <div className="max-w-md mx-auto">
                    <Card className="mb-6">
                        <div className="mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
                            <p className="text-sm text-gray-500">
                                {milestone.currentAmount} / {milestone.targetAmount} ETH
                            </p>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div
                                className={`h-2.5 rounded-full ${milestone.completed || milestone.progress >= 100
                                    ? 'bg-green-500'
                                    : 'bg-primary'
                                    }`}
                                style={{ width: `${milestone.progress}%` }}
                            />
                        </div>

                        <div className="mt-4 p-4 rounded-xl bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Available to withdraw:</p>
                                    <p className="text-xl font-bold text-gray-900">{milestone.currentAmount} ETH</p>
                                </div>
                                <ArrowDownCircleIcon className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                    </Card>

                    {error && (
                        <div className="bg-red-100 text-red-800 p-4 rounded-xl mb-6">
                            <p>{error}</p>
                        </div>
                    )}

                    <p className="text-gray-600 mb-6">
                        {isWithdrawable
                            ? 'You can now withdraw the funds from this milestone.'
                            : 'This milestone must be completed or fully funded before you can withdraw.'}
                    </p>

                    <Button
                        onClick={handleWithdraw}
                        loading={isLoading}
                        disabled={!isWithdrawable}
                        fullWidth
                    >
                        Withdraw All Funds
                    </Button>

                    {!isWithdrawable && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                            Milestone is {milestone.progress}% funded. Once it reaches 100%, you can withdraw.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawScreen; 