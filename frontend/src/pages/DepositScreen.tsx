import React, { useEffect, useState } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMilestones } from '../context/MilestoneContext';

const DepositScreen: React.FC = () => {
    const navigate = useNavigate();
    const { milestoneId } = useParams({ from: '/deposit/$milestoneId' });
    const { milestones, depositToMilestone, isLoading } = useMilestones();

    const [milestone, setMilestone] = useState<any>(null);
    const [amount, setAmount] = useState('');
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

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
        setError('');
    };

    const validateForm = (): boolean => {
        if (!amount) {
            setError('Please enter an amount to deposit');
            return false;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return false;
        }

        return true;
    };

    const handleDeposit = async () => {
        if (!validateForm() || !milestone) return;

        try {
            const success = await depositToMilestone(milestone.id, amount);
            if (success) {
                navigate({ to: '/home' });
            }
        } catch (error) {
            console.error('Error depositing to milestone:', error);
            setError('Failed to deposit. Please try again.');
        }
    };

    if (!milestone) {
        return (
            <div className="flex flex-col h-full">
                <Header title="Deposit Funds" showBackButton />
                <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Deposit Funds" showBackButton />

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
                                className="h-2.5 rounded-full bg-primary"
                                style={{ width: `${milestone.progress}%` }}
                            />
                        </div>
                    </Card>

                    <p className="text-gray-600 mb-6">
                        Enter the amount of ETH you'd like to deposit towards this milestone.
                    </p>

                    <div className="space-y-5">
                        <Input
                            label="Deposit Amount (ETH)"
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={handleAmountChange}
                            leftIcon={<BanknotesIcon className="w-5 h-5" />}
                            error={error}
                        />

                        <div className="pt-5">
                            <Button
                                onClick={handleDeposit}
                                loading={isLoading}
                                fullWidth
                            >
                                Deposit Funds
                            </Button>

                            <p className="text-center text-sm text-gray-500 mt-3">
                                Deposited funds will be locked until the milestone is completed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositScreen; 