import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { usePublicClient, useWriteContract, useReadContract, useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useAuth } from './AuthContext';
import { STASHFLOW_CONTRACT_ABI, STASHFLOW_CONTRACT_ADDRESS, ERC20_ABI, config } from '../lib/web3Config';
import { bytes32ToString, formatWeiToEth, stringToBytes32, calculateProgress, weiToEth, ethToWei } from '../utils/helpers';
import { toast } from 'sonner';
import {
    Milestone as ContractMilestoneType,
    TYPE_FIXED_DEPOSIT,
    TYPE_FLEXIBLE_DEPOSIT
} from '../types/StashflowTypes';
import {
    Milestone as ApiMilestone,
    ContractMilestone,
    MergedMilestone
} from '../types/api';
import { mergeMilestoneData } from '../utils/milestoneUtils';
import { milestoneService, transactionService } from '../lib/api-services';

interface MilestoneContextType {
    milestones: MergedMilestone[];
    contractMilestones: ContractMilestoneType[];
    apiMilestones: ApiMilestone[];
    isLoading: boolean;
    error: string | null;
    platformFee: number;
    withdrawalPenalty: number;
    fetchMilestones: () => Promise<void>;
    createMilestone: (name: string, targetAmount: string, deadline: number, tokenAddress: string, milestoneType: number, fixedAmount: string, metadata?: Record<string, any>) => Promise<string | boolean>;
    depositToMilestone: (milestone: MergedMilestone, amount?: string) => Promise<string | boolean>;
    withdrawFromMilestone: (milestone: MergedMilestone) => Promise<string | boolean>;
    emergencyWithdraw: (milestone: MergedMilestone) => Promise<string | boolean>;
    getUserTokenBalance: (tokenAddress: string) => Promise<string>;
    approveTokenForContract: (tokenAddress: string, amount: string) => Promise<boolean>;
}

export const MilestoneContext = createContext<MilestoneContextType | undefined>(undefined);

export const useMilestones = () => {
    const context = useContext(MilestoneContext);
    if (context === undefined) {
        throw new Error('useMilestones must be used within a MilestoneProvider');
    }
    return context;
};

interface MilestoneProviderProps {
    children: ReactNode;
}

export const MilestoneProvider = ({ children }: MilestoneProviderProps) => {
    const { isAuthenticated, accessToken } = useAuth();
    const { address } = useAccount();
    const [contractMilestones, setContractMilestones] = useState<ContractMilestoneType[]>([]);
    const [apiMilestones, setApiMilestones] = useState<ApiMilestone[]>([]);
    const [mergedMilestones, setMergedMilestones] = useState<MergedMilestone[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [platformFee, setPlatformFee] = useState<number>(50); // Default 0.5%
    const [withdrawalPenalty, setWithdrawalPenalty] = useState<number>(500); // Default 5%
    const [apiRetryCount, setApiRetryCount] = useState<number>(0);
    const MAX_API_RETRIES = 3;

    const publicClient = usePublicClient();

    const refreshMilestones = useCallback((fetchMilestonesFunc: () => Promise<void>) => {
        // Only refresh if we haven't exceeded the retry count
        if (apiRetryCount < MAX_API_RETRIES) {
            setTimeout(() => {
                fetchMilestonesFunc().catch(err => {
                    console.error('Error refreshing milestones:', err);
                    // Increment retry count when there's an error
                    setApiRetryCount(prev => prev + 1);
                });
            }, 2000);
        } else {
            console.warn('Maximum API retry attempts reached. Stopping automatic refreshes.');
            // Reset retry count after some time to allow future retries
            setTimeout(() => setApiRetryCount(0), 60000); // Reset after 1 minute
        }
    }, [apiRetryCount]);

    // Get platform fee
    const { data: platformFeeData } = useReadContract({
        address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
        abi: STASHFLOW_CONTRACT_ABI,
        functionName: 'platformFee',
        query: {
            enabled: !!address
        }
    });

    // Get withdrawal penalty
    const { data: withdrawalPenaltyData } = useReadContract({
        address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
        abi: STASHFLOW_CONTRACT_ABI,
        functionName: 'withdrawalPenalty',
        query: {
            enabled: !!address
        }
    });

    // Get milestone count for the connected user
    const { data: milestoneCount } = useReadContract({
        address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
        abi: STASHFLOW_CONTRACT_ABI,
        functionName: 'getMilestoneCount',
        args: address ? [address as `0x${string}`] : undefined,
        query: {
            enabled: !!address
        }
    });

    // Update fees when contract data is loaded
    useEffect(() => {
        if (platformFeeData) {
            console.log('platformFeeData', platformFeeData);
            setPlatformFee(Number(platformFeeData));
        }
        if (withdrawalPenaltyData) {
            console.log('withdrawalPenaltyData', withdrawalPenaltyData);
            setWithdrawalPenalty(Number(withdrawalPenaltyData));
        }
    }, [platformFeeData, withdrawalPenaltyData]);

    // Format deadline to human-readable date
    const formatDeadline = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Fetch API milestones
    const fetchApiMilestones = useCallback(async () => {
        if (!isAuthenticated || !accessToken) return [];

        try {
            const response = await milestoneService.getUserMilestones();

            if (response.data.success) {
                // Reset retry count on success
                setApiRetryCount(0);
                return response.data.data || [];
            }

            console.error('API milestone fetch error:', response.data.error);
            return [];
        } catch (err) {
            console.error('Failed to fetch API milestones:', err);
            // Increment retry count on failure
            setApiRetryCount(prev => Math.min(prev + 1, MAX_API_RETRIES));

            // If we have local data in state already, return that instead of empty array
            // to prevent clearing existing UI data on network error
            if (apiMilestones.length > 0) {
                return apiMilestones;
            }
            return [];
        }
    }, [isAuthenticated, accessToken, apiMilestones]);

    // Fetch contract milestones
    const fetchContractMilestones = useCallback(async () => {
        if (!publicClient || !address) return [];

        try {
            const count = Number(milestoneCount || 0);
            const fetchedMilestones: ContractMilestoneType[] = [];

            // Fetch each milestone
            for (let i = 1; i <= count; i++) {
                const data = await readContract(config, {
                    address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                    abi: STASHFLOW_CONTRACT_ABI,
                    functionName: 'getMilestoneDetails',
                    args: [address as `0x${string}`, BigInt(i)],
                });

                if (data) {
                    // Unpack the response based on our contract's return structure
                    const [
                        nameBytes32,
                        targetAmount,
                        deadline,
                        currentAmount,
                        completed,
                        active,
                        tokenAddress,
                        milestoneType,
                        fixedAmount
                    ] = data as [
                        string,
                        bigint,
                        bigint,
                        bigint,
                        boolean,
                        boolean,
                        string,
                        number,
                        bigint
                    ];

                    const name = bytes32ToString(nameBytes32);
                    const targetAmountStr = formatWeiToEth(targetAmount);
                    const currentAmountStr = formatWeiToEth(currentAmount);
                    const progress = calculateProgress(currentAmount, targetAmount);
                    const deadlineTimestamp = Number(deadline);
                    const deadlineFormatted = formatDeadline(deadlineTimestamp);
                    const fixedAmountStr = formatWeiToEth(fixedAmount);

                    fetchedMilestones.push({
                        id: i,
                        name,
                        targetAmount: targetAmountStr,
                        currentAmount: currentAmountStr,
                        deadline: deadlineTimestamp,
                        deadlineFormatted,
                        completed,
                        active,
                        progress,
                        tokenAddress,
                        milestoneType,
                        fixedAmount: fixedAmountStr
                    });
                }
            }

            return fetchedMilestones;
        } catch (err) {
            console.error('Error fetching contract milestones:', err);
            return [];
        }
    }, [milestoneCount, publicClient, address, formatDeadline]);

    // Fetch both sets of milestones and merge them
    const fetchMilestones = useCallback(async () => {
        if (!isAuthenticated) return;
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            // First get contract milestones
            const contractResults = await fetchContractMilestones();
            setContractMilestones(contractResults);

            // Then try to fetch API data, which might fail
            let apiResults: ApiMilestone[] = [];
            try {
                apiResults = await fetchApiMilestones();
                setApiMilestones(apiResults);
            } catch (apiErr) {
                console.error('API milestone fetch error:', apiErr);
            }

            // Only merge if we have data from at least one source
            if (contractResults.length > 0 || apiResults.length > 0) {
                const contractMilestonesForMerge: ContractMilestone[] = contractResults.map(cm => ({
                    id: cm.id.toString(),
                    name: cm.name,
                    targetAmount: cm.targetAmount,
                    currentAmount: cm.currentAmount,
                    deadline: cm.deadline,
                    completed: cm.completed,
                    fixedAmount: cm.fixedAmount,
                    milestoneType: cm.milestoneType,
                    tokenAddress: cm.tokenAddress
                }));

                // Merge the two data sources
                const merged = mergeMilestoneData(apiResults, contractMilestonesForMerge);
                setMergedMilestones(merged);
            } else {
                setMergedMilestones([]);
            }
        } catch (err) {
            console.error('Error fetching and merging milestones:', err);
            setError('Failed to fetch milestones. Please try again later.');
            setMergedMilestones([]); // Set empty array to prevent rendering issues
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, address]);

    // Setup write function for contract interactions
    const { writeContractAsync } = useWriteContract();

    // Approve tokens for the contract to spend
    const approveTokenForContract = useCallback(async (
        tokenAddress: string,
        amount: string
    ): Promise<boolean> => {
        try {
            const amountWei = ethToWei(amount);

            await writeContractAsync({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [STASHFLOW_CONTRACT_ADDRESS, amountWei],
            });

            toast.success('Token approval successful');
            return true;
        } catch (err) {
            console.error('Error approving tokens:', err);
            toast.error('Failed to approve tokens');
            return false;
        }
    }, [writeContractAsync]);


    // Create a milestone
    const createMilestone = useCallback(async (
        name: string,
        targetAmount: string,
        deadline: number,
        tokenAddress: string, // Default to ETH
        milestoneType: number = TYPE_FLEXIBLE_DEPOSIT,
        fixedAmount: string = '0',
        metadata?: Record<string, any>
    ): Promise<string | boolean> => {
        try {
            // Convert parameters to the right format for the contract
            const nameBytes32 = stringToBytes32(name);
            const targetAmountWei = ethToWei(targetAmount);
            const fixedAmountWei = ethToWei(fixedAmount || '0');

            // Call the contract to create a milestone
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'createMilestone',
                args: [
                    nameBytes32,
                    targetAmountWei,
                    BigInt(deadline),
                    tokenAddress as `0x${string}`,
                    milestoneType,
                    fixedAmountWei
                ],
            });

            // Create the corresponding milestone in the API
            try {
                const startDateObj = new Date();
                const endDateObj = new Date(deadline * 1000);

                // Determine valid saving frequency from metadata
                let savingFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' = 'monthly';
                if (metadata?.savingFrequency === 'daily' ||
                    metadata?.savingFrequency === 'weekly' ||
                    metadata?.savingFrequency === 'bi-weekly' ||
                    metadata?.savingFrequency === 'monthly') {
                    savingFrequency = metadata.savingFrequency;
                }

                const savingMethod = milestoneType === TYPE_FIXED_DEPOSIT ? 'automatic' : 'manual';

                toast.loading('Waiting for transaction confirmation...');

                const milestoneCount = await readContract(config, {
                    address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                    abi: STASHFLOW_CONTRACT_ABI,
                    functionName: 'getMilestoneCount',
                    args: [address as `0x${string}`],
                });

                toast.dismiss();

                const newMilestoneId = Number(milestoneCount);

                const requestData = {
                    name,
                    description: metadata?.description || '',
                    targetAmount: parseFloat(targetAmount),
                    startDate: startDateObj.toISOString(),
                    endDate: endDateObj.toISOString(),
                    currency: metadata?.stablecoin?.toUpperCase() || 'USDT' as 'USDT',
                    savingMethod: savingMethod as 'automatic' | 'manual',
                    savingFrequency,
                    tokenAddress,
                    contractMilestoneId: newMilestoneId
                };

                const response = await milestoneService.createMilestone(requestData);

                if (!response.data.success) {
                    console.error('Failed to create API milestone:', response.data.error);
                }
            } catch (apiError) {
                console.error('API milestone creation error:', apiError);
            }

            toast.success('Milestone created successfully');

            // Refresh milestones after successful operation
            refreshMilestones(fetchMilestones);

            return hash;
        } catch (err) {
            console.error('Error creating milestone:', err);
            toast.error('Failed to create milestone');
            return false;
        }
    }, [writeContractAsync, accessToken, refreshMilestones]);

    // Deposit to a milestone
    const depositToMilestone = useCallback(async (
        milestone: MergedMilestone,
        amount?: string
    ): Promise<string | boolean> => {
        try {
            const milestoneId = BigInt(milestone.id);
            const depositAmount = amount
                ? ethToWei(amount)
                : ethToWei(milestone.fixedAmount || '0');

            // Call the contract to deposit
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'depositToMilestone',
                args: [milestoneId, depositAmount],
            });

            // Record the deposit in the API
            if (accessToken) {
                try {
                    const amountNumber = parseFloat(amount || milestone.fixedAmount || '0');

                    await transactionService.depositToMilestone(milestone.id, {
                        amount: amountNumber,
                        txHash: hash as string,
                        metadata: {
                            contractId: milestone.contractId,
                            tokenAddress: milestone.tokenAddress
                        }
                    });
                } catch (apiError) {
                    console.error('API deposit transaction error:', apiError);
                }
            }

            toast.success('Deposit successful');

            // Refresh milestones after successful operation
            refreshMilestones(fetchMilestones);

            return hash;
        } catch (err) {
            console.error('Error depositing to milestone:', err);
            toast.error('Failed to deposit to milestone');
            return false;
        }
    }, [writeContractAsync, refreshMilestones, accessToken]);

    // Withdraw from a milestone
    const withdrawFromMilestone = useCallback(async (
        milestone: MergedMilestone
    ): Promise<string | boolean> => {
        try {
            const milestoneId = BigInt(milestone.id);

            // Call the contract to withdraw
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'withdrawFromMilestone',
                args: [milestoneId],
            });

            // Record the withdrawal in the API
            if (accessToken) {
                try {
                    const currentAmount = parseFloat(milestone.currentAmount);

                    await transactionService.withdrawFromMilestone(milestone.id, {
                        amount: currentAmount,
                        txHash: hash as string,
                        metadata: {
                            contractId: milestone.contractId,
                            tokenAddress: milestone.tokenAddress
                        }
                    });
                } catch (apiError) {
                    console.error('API withdrawal transaction error:', apiError);
                }
            }

            toast.success('Withdrawal successful');

            // Refresh milestones after successful operation
            refreshMilestones(fetchMilestones);

            return hash;
        } catch (err) {
            console.error('Error withdrawing from milestone:', err);
            toast.error('Failed to withdraw from milestone');
            return false;
        }
    }, [writeContractAsync, refreshMilestones, accessToken]);

    // Emergency withdraw from a milestone (with penalty)
    const emergencyWithdraw = useCallback(async (
        milestone: MergedMilestone
    ): Promise<string | boolean> => {
        try {
            const milestoneId = BigInt(milestone.id);

            // Call the contract to emergency withdraw
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'emergencyWithdraw',
                args: [milestoneId],
            });

            // Record the emergency withdrawal in the API
            if (accessToken) {
                try {
                    const currentAmount = parseFloat(milestone.currentAmount);
                    // Apply the withdrawal penalty
                    const penaltyRate = withdrawalPenalty / 10000; // Convert basis points to decimal
                    const amountAfterPenalty = currentAmount * (1 - penaltyRate);

                    await transactionService.withdrawFromMilestone(milestone.id, {
                        amount: amountAfterPenalty,
                        txHash: hash as string,
                        metadata: {
                            contractId: milestone.contractId,
                            tokenAddress: milestone.tokenAddress,
                            isEmergency: true,
                            penalty: withdrawalPenalty
                        }
                    });
                } catch (apiError) {
                    console.error('API emergency withdrawal transaction error:', apiError);
                }
            }

            toast.success('Emergency withdrawal successful');

            // Refresh milestones after successful operation
            refreshMilestones(fetchMilestones);

            return hash;
        } catch (err) {
            console.error('Error emergency withdrawing from milestone:', err);
            toast.error('Failed to emergency withdraw from milestone');
            return false;
        }
    }, [writeContractAsync, accessToken, refreshMilestones, fetchMilestones, address]);

    // Get user token balance
    const getUserTokenBalance = useCallback(async (
        tokenAddress: string
    ): Promise<string> => {
        if (!address || !publicClient) return '0';

        try {
            if (tokenAddress === '0x0000000000000000000000000000000000000000') {
                // For ETH, get the native balance
                const balance = await publicClient.getBalance({ address: address as `0x${string}` });
                return weiToEth(balance);
            } else {
                // For ERC20 tokens, call balanceOf
                const balance = await readContract(config, {
                    address: tokenAddress as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address as `0x${string}`],
                });

                return weiToEth(balance as bigint);
            }
        } catch (err) {
            console.error('Error getting token balance:', err);
            return '0';
        }
    }, [address, publicClient]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMilestones();
        }
    }, [isAuthenticated]);

    return (
        <MilestoneContext.Provider value={{
            milestones: mergedMilestones,
            contractMilestones,
            apiMilestones,
            isLoading,
            error,
            platformFee,
            withdrawalPenalty,
            fetchMilestones,
            createMilestone,
            depositToMilestone,
            withdrawFromMilestone,
            emergencyWithdraw,
            getUserTokenBalance,
            approveTokenForContract
        }}>
            {children}
        </MilestoneContext.Provider>
    );
}; 