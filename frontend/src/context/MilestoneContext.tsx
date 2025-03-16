import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { usePublicClient, useWriteContract, useReadContract, useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { STASHFLOW_CONTRACT_ABI, STASHFLOW_CONTRACT_ADDRESS, ERC20_ABI, config } from '../lib/web3Config';
import { bytes32ToString, formatWeiToEth, stringToBytes32, calculateProgress, weiToEth, ethToWei } from '../utils/helpers';
import { toast } from 'sonner';
import {
    Milestone as ContractMilestoneType,
    STATUS_ACTIVE,
    STATUS_COMPLETED,
    STATUS_INACTIVE,
    TYPE_FIXED_DEPOSIT,
    TYPE_FLEXIBLE_DEPOSIT
} from '../types/StashflowTypes';
import {
    Milestone as ApiMilestone,
    ContractMilestone,
    MergedMilestone
} from '../types/api';
import { mergeMilestoneData, isMilestoneCompleted } from '../utils/milestoneUtils';

// Define the MilestoneContext type
interface MilestoneContextType {
    milestones: MergedMilestone[];
    contractMilestones: ContractMilestoneType[];
    apiMilestones: ApiMilestone[];
    isLoading: boolean;
    error: string | null;
    platformFee: number; // In basis points (1% = 100)
    withdrawalPenalty: number; // In basis points
    fetchMilestones: () => Promise<void>;
    createMilestone: (name: string, targetAmount: string, deadline: number, tokenAddress: string, milestoneType: number, fixedAmount: string, metadata?: Record<string, any>) => Promise<string | boolean>;
    depositToMilestone: (milestone: MergedMilestone, amount?: string) => Promise<string | boolean>;
    withdrawFromMilestone: (milestone: MergedMilestone) => Promise<string | boolean>;
    emergencyWithdraw: (milestone: MergedMilestone) => Promise<string | boolean>;
    getUserTokenBalance: (tokenAddress: string) => Promise<string>;
    approveTokenForContract: (tokenAddress: string, amount: string) => Promise<boolean>;
}

const MilestoneContext = createContext<MilestoneContextType | undefined>(undefined);

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

    const publicClient = usePublicClient();

    // Get platform fee
    const { data: platformFeeData } = useReadContract({
        address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
        abi: STASHFLOW_CONTRACT_ABI,
        functionName: 'platformFee',
    });

    // Get withdrawal penalty
    const { data: withdrawalPenaltyData } = useReadContract({
        address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
        abi: STASHFLOW_CONTRACT_ABI,
        functionName: 'withdrawalPenalty',
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
            setPlatformFee(Number(platformFeeData));
        }
        if (withdrawalPenaltyData) {
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
            const response = await axios.get('/api/milestones', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (response.data.success) {
                return response.data.data || [];
            }

            console.error('API milestone fetch error:', response.data.error);
            return [];
        } catch (err) {
            console.error('Failed to fetch API milestones:', err);
            return [];
        }
    }, [isAuthenticated, accessToken]);

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

            // For demo purposes, return mock data if contract interaction fails
            const now = Math.floor(Date.now() / 1000);
            const oneMonthFromNow = now + (30 * 24 * 60 * 60);
            const twoMonthsFromNow = now + (60 * 24 * 60 * 60);
            const sixMonthsFromNow = now + (180 * 24 * 60 * 60);

            return [
                {
                    id: 1,
                    name: 'Vacation Fund',
                    targetAmount: '1.0',
                    currentAmount: '0.5',
                    deadline: oneMonthFromNow,
                    deadlineFormatted: formatDeadline(oneMonthFromNow),
                    completed: false,
                    active: true,
                    progress: 50,
                    tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
                    milestoneType: TYPE_FLEXIBLE_DEPOSIT,
                    fixedAmount: '0'
                },
                {
                    id: 2,
                    name: 'New Laptop',
                    targetAmount: '2.0',
                    currentAmount: '2.0',
                    deadline: twoMonthsFromNow,
                    deadlineFormatted: formatDeadline(twoMonthsFromNow),
                    completed: true,
                    active: false,
                    progress: 100,
                    tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
                    milestoneType: TYPE_FIXED_DEPOSIT,
                    fixedAmount: '0.5'
                },
                {
                    id: 3,
                    name: 'Emergency Fund',
                    targetAmount: '3.0',
                    currentAmount: '0.8',
                    deadline: sixMonthsFromNow,
                    deadlineFormatted: formatDeadline(sixMonthsFromNow),
                    completed: false,
                    active: true,
                    progress: 27,
                    tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
                    milestoneType: TYPE_FLEXIBLE_DEPOSIT,
                    fixedAmount: '0'
                }
            ];
        }
    }, [milestoneCount, publicClient, address]);

    // Fetch both sets of milestones and merge them
    const fetchMilestones = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        setError(null);

        try {
            const [apiResults, contractResults] = await Promise.all([
                fetchApiMilestones(),
                fetchContractMilestones()
            ]);

            setApiMilestones(apiResults);
            setContractMilestones(contractResults);

            // Convert contract milestones to the right format for merging
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
        } catch (err) {
            console.error('Error fetching and merging milestones:', err);
            setError('Failed to fetch milestones. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchApiMilestones, fetchContractMilestones]);

    // Setup write function for contract interactions
    const { writeContractAsync } = useWriteContract();

    // Approve tokens for the contract to spend
    const approveTokenForContract = useCallback(async (
        tokenAddress: string,
        amount: string
    ): Promise<boolean> => {
        try {
            const amountWei = ethToWei(amount);

            const hash = await writeContractAsync({
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

    // Create a new milestone
    const createMilestone = useCallback(async (
        name: string,
        targetAmount: string,
        deadline: number,
        tokenAddress: string = '0x0000000000000000000000000000000000000000', // Default to ETH
        milestoneType: number = TYPE_FLEXIBLE_DEPOSIT,
        fixedAmount: string = '0',
        metadata?: Record<string, any>
    ): Promise<string | boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const nameBytes32 = stringToBytes32(name);
            // Convert ether to wei for the contract
            const targetAmountWei = ethToWei(targetAmount);
            const fixedAmountWei = ethToWei(fixedAmount);

            // Call the contract to create the milestone
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'createMilestone',
                args: [
                    nameBytes32,
                    targetAmountWei,
                    BigInt(deadline),
                    tokenAddress,
                    milestoneType,
                    fixedAmountWei
                ],
            });

            // After successful contract creation, store in our API too
            if (hash && accessToken) {
                try {
                    const apiMilestone = {
                        name,
                        description: metadata?.description || '',
                        targetAmount,
                        deadline: new Date(deadline * 1000).toISOString(),
                        contractId: hash,
                        image: metadata?.imageUrl || '',
                        savingMethod: milestoneType === TYPE_FIXED_DEPOSIT ? 'AUTOMATIC' : 'MANUAL',
                        savingFrequency: metadata?.frequency || 'MONTHLY',
                        metadata,
                    };

                    const response = await axios.post('/api/milestones', apiMilestone, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    });

                    if (!response.data.success) {
                        console.error('API milestone creation error:', response.data.error);
                    }
                } catch (apiErr) {
                    console.error('Failed to save milestone in API:', apiErr);
                    // We don't fail the entire operation if API storage fails
                }
            }

            toast.success('Milestone created successfully');
            await fetchMilestones(); // Refresh the milestones
            return hash;
        } catch (err) {
            console.error('Error creating milestone:', err);
            setError('Failed to create milestone. Please try again.');
            toast.error('Failed to create milestone');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [writeContractAsync, accessToken, fetchMilestones]);

    // Deposit to a milestone (ETH)
    const depositToMilestone = useCallback(async (
        milestone: MergedMilestone,
        amount?: string
    ): Promise<string | boolean> => {
        try {
            const depositAmount = amount || milestone.fixedAmount;

            if (!depositAmount) {
                toast.error('No deposit amount specified');
                return false;
            }

            const depositAmountWei = ethToWei(depositAmount);

            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'deposit',
                args: [BigInt(milestone.id)],
                value: depositAmountWei,
            });

            toast.success('Deposit successful');
            await fetchMilestones(); // Refresh the milestones
            return hash;
        } catch (err) {
            console.error('Error depositing to milestone:', err);
            toast.error('Failed to deposit');
            return false;
        }
    }, [writeContractAsync, fetchMilestones]);

    // Withdraw from a milestone
    const withdrawFromMilestone = useCallback(async (
        milestone: MergedMilestone
    ): Promise<string | boolean> => {
        try {
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'withdraw',
                args: [BigInt(milestone.id)],
            });

            toast.success('Withdrawal successful');
            await fetchMilestones(); // Refresh the milestones
            return hash;
        } catch (err) {
            console.error('Error withdrawing from milestone:', err);
            toast.error('Failed to withdraw');
            return false;
        }
    }, [writeContractAsync, fetchMilestones]);

    // Emergency withdraw from a milestone (with penalty)
    const emergencyWithdraw = useCallback(async (
        milestone: MergedMilestone
    ): Promise<string | boolean> => {
        try {
            const hash = await writeContractAsync({
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'emergencyWithdraw',
                args: [BigInt(milestone.id)],
            });

            toast.success('Emergency withdrawal successful');
            await fetchMilestones(); // Refresh the milestones
            return hash;
        } catch (err) {
            console.error('Error emergency withdrawing from milestone:', err);
            toast.error('Failed to withdraw');
            return false;
        }
    }, [writeContractAsync, fetchMilestones]);

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
    }, [isAuthenticated, fetchMilestones]);

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