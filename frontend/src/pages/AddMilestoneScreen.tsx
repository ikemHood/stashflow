import React, { useState } from 'react';
import {
    ChevronLeftIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import Button from '../components/Button';
import { useNavigate } from '@tanstack/react-router';
import { useMilestones } from '../context/MilestoneContext';
import { toast } from 'sonner';
import { TYPE_FIXED_DEPOSIT, TYPE_FLEXIBLE_DEPOSIT } from '../types/StashflowTypes';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { TOKEN_CONTRACT_ADDRESS } from '../lib/web3Config';

// Define the steps in the form
enum FormStep {
    DEFINE_GOAL = 0,
    SAVING_METHOD = 1
}

// Define the saving method types
type SavingMethod = 'auto' | 'manual';

const AddMilestoneScreen: React.FC = () => {
    const navigate = useNavigate();
    const { createMilestone, isLoading } = useMilestones();
    const { open } = useAppKit();
    const { isConnected } = useAccount();

    // Current step state
    const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.DEFINE_GOAL);

    // Goal definition form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Image upload state
    const [goalImage, setGoalImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Saving method form state
    const [savingMethod, setSavingMethod] = useState<SavingMethod>('auto');
    const [savingFrequency, setSavingFrequency] = useState('');
    const [savingAmount, setSavingAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('');
    const [selectedStablecoin, setSelectedStablecoin] = useState('');

    // Form validation errors
    const [errors, setErrors] = useState({
        name: '',
        description: '',
        targetAmount: '',
        startDate: '',
        endDate: '',
        savingFrequency: '',
        savingAmount: '',
        selectedWallet: '',
        selectedStablecoin: ''
    });

    // Handle image upload
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGoalImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        console.log(goalImage);
    };

    // Handle image drag and drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                setGoalImage(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // Handle date formatting for display
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Validate the current step's form fields
    const validateCurrentStep = (): boolean => {
        let isValid = true;
        const newErrors = { ...errors };

        if (currentStep === FormStep.DEFINE_GOAL) {
            // Validate goal name
            if (!name.trim()) {
                newErrors.name = 'Goal name is required';
                isValid = false;
            } else {
                newErrors.name = '';
            }

            // Validate target amount
            if (!targetAmount) {
                newErrors.targetAmount = 'Target amount is required';
                isValid = false;
            } else if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
                newErrors.targetAmount = 'Please enter a valid amount greater than 0';
                isValid = false;
            } else {
                newErrors.targetAmount = '';
            }

            // Validate end date
            if (!endDate) {
                newErrors.endDate = 'End date is required';
                isValid = false;
            } else {
                newErrors.endDate = '';
            }
        } else if (currentStep === FormStep.SAVING_METHOD) {
            // Validate saving frequency for auto-save
            if (savingMethod === 'auto') {
                if (!savingFrequency) {
                    newErrors.savingFrequency = 'Saving frequency is required';
                    isValid = false;
                } else {
                    newErrors.savingFrequency = '';
                }

                if (!savingAmount) {
                    newErrors.savingAmount = 'Saving amount is required';
                    isValid = false;
                } else if (isNaN(Number(savingAmount)) || Number(savingAmount) <= 0) {
                    newErrors.savingAmount = 'Please enter a valid amount greater than 0';
                    isValid = false;
                } else {
                    newErrors.savingAmount = '';
                }
            }

            // Validate wallet selection
            if (!selectedWallet) {
                newErrors.selectedWallet = 'Please select a wallet';
                isValid = false;
            } else {
                newErrors.selectedWallet = '';
            }

            // Validate stablecoin selection
            if (!selectedStablecoin) {
                newErrors.selectedStablecoin = 'Please select a stablecoin';
                isValid = false;
            } else {
                newErrors.selectedStablecoin = '';
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle moving to the next step
    const handleContinue = () => {
        if (!validateCurrentStep()) return;
        setCurrentStep(FormStep.SAVING_METHOD);
    };

    // Handle going back to the previous step
    const handleBack = () => {
        setCurrentStep(FormStep.DEFINE_GOAL);
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        try {
            // Calculate deadline from end date
            const deadline = Math.floor(new Date(endDate).getTime() / 1000);

            // Determine milestone type based on saving method
            const milestoneType = savingMethod === 'auto' ? TYPE_FIXED_DEPOSIT : TYPE_FLEXIBLE_DEPOSIT;


            const tokenAddress = TOKEN_CONTRACT_ADDRESS;

            const txResult = await createMilestone(
                name,
                targetAmount,
                deadline,
                tokenAddress,
                milestoneType,
                savingMethod === 'auto' ? savingAmount : '0',
                {
                    description,
                    savingMethod,
                    savingFrequency: savingMethod === 'auto' ? savingFrequency : undefined,
                    savingAmount: savingMethod === 'auto' ? savingAmount : undefined,
                    wallet: selectedWallet,
                    stablecoin: selectedStablecoin,
                    goalImage: imagePreview
                }
            );

            if (txResult) {
                toast.success("Saving goal created successfully!");
                navigate({ to: '/home' });
            } else {
                toast.error("Failed to create goal");
            }
        } catch (error) {
            console.error('Error creating goal:', error);
            toast.error("An error occurred while creating your goal");
        }
    };

    // Render the progress indicator
    const renderProgressIndicator = () => (
        <div className="flex items-center justify-center space-x-4 my-4">
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === FormStep.DEFINE_GOAL ? 'bg-indigo-600 text-white' : 'text-gray-400 border border-gray-300'
                    }`}>
                    {currentStep === FormStep.DEFINE_GOAL ? (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    )}
                </div>
                <p className={`text-xs mt-1 ${currentStep === FormStep.DEFINE_GOAL ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                    Define your Goal
                </p>
            </div>

            <div className="w-12 h-0.5 bg-gray-300"></div>

            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === FormStep.SAVING_METHOD ? 'bg-indigo-600 text-white' : 'text-gray-400 border border-gray-300'
                    }`}>
                    {currentStep === FormStep.SAVING_METHOD ? (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    )}
                </div>
                <p className={`text-xs mt-1 ${currentStep === FormStep.SAVING_METHOD ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                    Choose Saving Method
                </p>
            </div>
        </div>
    );

    // Render the Define Goal step
    const renderDefineGoalStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                <input
                    type="text"
                    placeholder="Enter goal name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
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
                    className={`w-full px-4 py-3 rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Image <span className="text-gray-400 text-sm">(optional)</span></label>
                <div
                    className={`border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center ${imagePreview ? 'bg-gray-50' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />

                    {imagePreview ? (
                        <div className="relative flex flex-col items-center">
                            <img
                                src={imagePreview}
                                alt="Goal Preview"
                                className="w-20 h-20 object-cover rounded-lg mb-2"
                            />
                            <p className="text-sm text-gray-500">Click to change image</p>
                            <button
                                className="absolute -top-2 -right-2 bg-red-100 rounded-full p-1 text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGoalImage(null);
                                    setImagePreview(null);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 text-gray-400"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </div>
                            <p className="text-indigo-600 font-medium mb-1">Click to upload</p>
                            <p className="text-gray-400 text-sm">or drag and drop</p>
                            <p className="text-gray-400 text-sm mt-2">Dimension (100X100)</p>
                            <p className="text-gray-500 text-sm mt-2">OR</p>
                            <button
                                className="mt-2 px-6 py-2 bg-indigo-100 text-indigo-600 rounded-md text-sm font-medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                Browse Files
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                <div className={`flex items-center border ${errors.targetAmount ? 'border-red-500' : 'border-gray-300'} rounded-lg overflow-hidden`}>
                    <div className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-300">$</div>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full px-4 py-3 focus:outline-none"
                    />
                </div>
                {errors.targetAmount && <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Duration</label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Start date"
                            readOnly
                            value={formatDateForDisplay(startDate)}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent cursor-pointer`}
                            onClick={() => document.getElementById('start-date')?.click()}
                        />
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="End date"
                            readOnly
                            value={formatDateForDisplay(endDate)}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent cursor-pointer`}
                            onClick={() => document.getElementById('end-date')?.click()}
                        />
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="opacity-0 absolute top-0 left-0 w-full h-full cursor-pointer"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                    </div>
                </div>
            </div>

            <div className="pt-5">
                <Button
                    onClick={isConnected ? handleContinue : () => open()}
                    fullWidth
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 font-medium"
                >
                    {isConnected ? "Continue" : "Connect Wallet"}
                </Button>
            </div>
        </div>
    );

    // Render the Saving Method step
    const renderSavingMethodStep = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Saving Method</label>
                <div className="flex space-x-4">
                    <div
                        className={`flex items-center flex-1`}
                        onClick={() => setSavingMethod('auto')}
                    >
                        <div className={`w-5 h-5 rounded-full border ${savingMethod === 'auto' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center mr-2`}>
                            {savingMethod === 'auto' && (
                                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                            )}
                        </div>
                        <span className={`text-sm ${savingMethod === 'auto' ? 'text-gray-900' : 'text-gray-500'}`}>Auto-save</span>
                    </div>

                    <div
                        className={`flex items-center flex-1`}
                        onClick={() => setSavingMethod('manual')}
                    >
                        <div className={`w-5 h-5 rounded-full border ${savingMethod === 'manual' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center mr-2`}>
                            {savingMethod === 'manual' && (
                                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                            )}
                        </div>
                        <span className={`text-sm ${savingMethod === 'manual' ? 'text-gray-900' : 'text-gray-500'}`}>Manual deposit</span>
                    </div>
                </div>
            </div>

            {savingMethod === 'auto' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saving Frequency</label>
                        <div className="relative">
                            <select
                                value={savingFrequency}
                                onChange={(e) => setSavingFrequency(e.target.value)}
                                className={`appearance-none w-full px-4 py-3 rounded-lg border ${errors.savingFrequency ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saving Frequency Amount</label>
                        <input
                            type="text"
                            placeholder="Enter frequency saving amount"
                            value={savingAmount}
                            onChange={(e) => setSavingAmount(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.savingAmount ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
                        />
                        {errors.savingAmount && <p className="mt-1 text-sm text-red-600">{errors.savingAmount}</p>}
                    </div>
                </>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Wallet</label>
                <div className="relative">
                    <select
                        value={selectedWallet}
                        onChange={(e) => setSelectedWallet(e.target.value)}
                        className={`appearance-none w-full px-4 py-3 rounded-lg border ${errors.selectedWallet ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
                    >
                        <option value="">Select connected wallet</option>
                        <option value="metamask">MetaMask</option>
                        <option value="walletconnect">WalletConnect</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.selectedWallet && <p className="mt-1 text-sm text-red-600">{errors.selectedWallet}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Stablecoin</label>
                <div className="relative">
                    <select
                        value={selectedStablecoin}
                        onChange={(e) => setSelectedStablecoin(e.target.value)}
                        className={`appearance-none w-full px-4 py-3 rounded-lg border ${errors.selectedStablecoin ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent`}
                    >
                        <option value="">Select a stablecoin for your savings</option>
                        <option value="usdt">USDT</option>
                        <option value="usdc">USDC</option>
                        <option value="dai">DAI</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.selectedStablecoin && <p className="mt-1 text-sm text-red-600">{errors.selectedStablecoin}</p>}
            </div>

            <div className="pt-5">
                <Button
                    onClick={handleSubmit}
                    loading={isLoading}
                    fullWidth
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 font-medium"
                >
                    Save goal
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Custom Header */}
            <div className="p-2 border-b border-gray-200 flex items-center">
                <button
                    onClick={() => currentStep === FormStep.DEFINE_GOAL
                        ? navigate({ to: '/home' })
                        : handleBack()
                    }
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-base font-semibold flex-1 text-center">Setup saving goal</h1>
                <div className="w-9"></div> {/* Empty div for spacing */}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
                <div className="max-w-md mx-auto">
                    {/* Progress Indicator */}
                    {renderProgressIndicator()}

                    {/* Form Steps */}
                    {currentStep === FormStep.DEFINE_GOAL ? renderDefineGoalStep() : renderSavingMethodStep()}
                </div>
            </div>
        </div>
    );
};

export default AddMilestoneScreen; 