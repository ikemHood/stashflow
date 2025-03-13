import React, { useState } from 'react';
import {
    BanknotesIcon,
    CalendarIcon,
    PencilSquareIcon,
    ChevronLeftIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from '@tanstack/react-router';
import { useMilestones } from '../context/MilestoneContext';

type SavingMethod = 'auto' | 'manual';

const AddMilestoneScreen: React.FC = () => {
    const navigate = useNavigate();
    const { createMilestone, isLoading } = useMilestones();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [savingMethod, setSavingMethod] = useState<SavingMethod>('auto');
    const [savingFrequency, setSavingFrequency] = useState('');

    const [errors, setErrors] = useState({
        name: '',
        description: '',
        amount: '',
        startDate: '',
        endDate: '',
        savingFrequency: ''
    });

    const validateForm = (): boolean => {
        let isValid = true;
        const newErrors = {
            name: '',
            description: '',
            amount: '',
            startDate: '',
            endDate: '',
            savingFrequency: ''
        };

        // Validate name
        if (!name.trim()) {
            newErrors.name = 'Goal name is required';
            isValid = false;
        }

        // Validate amount
        if (!amount) {
            newErrors.amount = 'Target amount is required';
            isValid = false;
        } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount greater than 0';
            isValid = false;
        }

        // Validate dates
        if (!startDate) {
            newErrors.startDate = 'Start date is required';
            isValid = false;
        }

        if (!endDate) {
            newErrors.endDate = 'End date is required';
            isValid = false;
        }

        // If auto-save is selected, validate frequency
        if (savingMethod === 'auto' && !savingFrequency) {
            newErrors.savingFrequency = 'Saving frequency is required for auto-save';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            // For now, we'll pass the name and amount to createMilestone
            // In a complete implementation, we would also pass the other fields
            const success = await createMilestone(name, amount);
            if (success) {
                navigate({ to: '/home' });
            }
        } catch (error) {
            console.error('Error creating goal:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Custom Header */}
            <div className="p-4 border-b border-gray-200 flex items-center">
                <button
                    onClick={() => navigate({ to: '/home' })}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold flex-1 text-center">Setup saving goal</h1>
                <div className="w-9"></div> {/* Empty div for spacing */}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
                <div className="max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Create a goal</h2>
                    <p className="text-gray-600 mb-6">
                        Set a savings goal and protect your money with stablecoins.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                            <input
                                type="text"
                                placeholder="Enter goal name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Define Goal</label>
                            <textarea
                                placeholder="Enter details about goal"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Set Amount</label>
                            <div className={`flex items-center border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg overflow-hidden`}>
                                <div className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-300">$</div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-3 focus:outline-none"
                                />
                            </div>
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Set Duration</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                                    />
                                    {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                                    />
                                    {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Select Saving Method</label>
                            <div className="flex space-x-4">
                                <div
                                    className={`flex items-center flex-1 ${savingMethod === 'auto' ? 'text-primary' : 'text-gray-500'}`}
                                    onClick={() => setSavingMethod('auto')}
                                >
                                    <div className={`w-5 h-5 rounded-full border ${savingMethod === 'auto' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center mr-2`}>
                                        {savingMethod === 'auto' && (
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        )}
                                    </div>
                                    <span className="text-sm">Auto-save (recurring deposits)</span>
                                </div>

                                <div
                                    className={`flex items-center flex-1 ${savingMethod === 'manual' ? 'text-primary' : 'text-gray-500'}`}
                                    onClick={() => setSavingMethod('manual')}
                                >
                                    <div className={`w-5 h-5 rounded-full border ${savingMethod === 'manual' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center mr-2`}>
                                        {savingMethod === 'manual' && (
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        )}
                                    </div>
                                    <span className="text-sm">Manual deposit</span>
                                </div>
                            </div>
                        </div>

                        {savingMethod === 'auto' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Saving Frequency</label>
                                <div className="relative">
                                    <select
                                        value={savingFrequency}
                                        onChange={(e) => setSavingFrequency(e.target.value)}
                                        className={`appearance-none w-full px-4 py-3 rounded-lg border ${errors.savingFrequency ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                                    >
                                        <option value="">Enter or select saving frequency</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                {errors.savingFrequency && <p className="mt-1 text-sm text-red-600">{errors.savingFrequency}</p>}
                            </div>
                        )}

                        <div className="pt-5">
                            <div className="h-1 w-16 bg-gray-300 rounded-full mx-auto mb-8"></div>
                            <Button
                                onClick={handleSubmit}
                                loading={isLoading}
                                fullWidth
                            >
                                Create Goal
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMilestoneScreen; 