import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { usePublicClient, useWriteContract, useReadContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useAuth } from './AuthContext';
import { STASHFLOW_CONTRACT_ABI, STASHFLOW_CONTRACT_ADDRESS } from '../utils/web3Config';
import { bytes32ToString, formatWeiToEth, stringToBytes32, calculateProgress } from '../utils/helpers';
import { config } from '../utils/web3Config';

// Define the Milestone type
export interface Milestone {
    id: number;
    name: string;
    targetAmount: string;
    currentAmount: string;
    deadline: string; // We use a placeholder for deadlines 
    completed: boolean;
    active: boolean;
    progress: number;
}

interface MilestoneContextType {
    milestones: Milestone[];
    isLoading: boolean;
    error: string | null;
    fetchMilestones: () => Promise<void>;
    createMilestone: (name: string, targetAmount: string) => Promise<String | boolean>;
    depositToMilestone: (id: number, amount: string) => Promise<String | boolean>;
    withdrawFromMilestone: (id: number) => Promise<String | boolean>;
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
    const { isAuthenticated } = useAuth();
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const publicClient = usePublicClient();

    // Get milestone count
    const { data: milestoneCount } = useReadContract({
        address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
        abi: STASHFLOW_CONTRACT_ABI,
        functionName: 'getMilestoneCount',
    });

    const fetchMilestones = useCallback(async () => {
        if (!isAuthenticated || !publicClient) return;

        setIsLoading(true);
        setError(null);

        try {
            const count = Number(milestoneCount || 0);
            const fetchedMilestones: Milestone[] = [];

            // Fetch each milestone
            for (let i = 1; i <= count; i++) {
                const data = await readContract(config, {
                    address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                    abi: STASHFLOW_CONTRACT_ABI,
                    functionName: 'getMilestoneDetails',
                    args: [BigInt(i)],
                });

                if (data) {
                    // Unpack the response based on our contract's return structure
                    const [nameBytes32, targetAmount, currentAmount, isCompleted, isActive] = data as [
                        string,
                        bigint,
                        bigint,
                        boolean,
                        boolean
                    ];

                    const name = bytes32ToString(nameBytes32);
                    const targetAmountStr = formatWeiToEth(targetAmount);
                    const currentAmountStr = formatWeiToEth(currentAmount);
                    const progress = calculateProgress(currentAmount, targetAmount);

                    fetchedMilestones.push({
                        id: i,
                        name,
                        targetAmount: targetAmountStr,
                        currentAmount: currentAmountStr,
                        deadline: 'December 31, 2024', // Placeholder
                        completed: isCompleted,
                        active: isActive,
                        progress,
                    });
                }
            }

            setMilestones(fetchedMilestones);
        } catch (err) {
            console.error('Error fetching milestones:', err);
            setError('Failed to fetch milestones. Please try again later.');

            // For demo purposes, load mock data if contract interaction fails
            setMilestones([
                {
                    id: 1,
                    name: 'Vacation Fund',
                    targetAmount: '1.0',
                    currentAmount: '0.5',
                    deadline: 'May 15, 2024',
                    completed: false,
                    active: true,
                    progress: 50
                },
                {
                    id: 2,
                    name: 'New Laptop',
                    targetAmount: '2.0',
                    currentAmount: '2.0',
                    deadline: 'April 10, 2024',
                    completed: true,
                    active: false,
                    progress: 100
                },
                {
                    id: 3,
                    name: 'Emergency Fund',
                    targetAmount: '3.0',
                    currentAmount: '0.8',
                    deadline: 'December 31, 2024',
                    completed: false,
                    active: true,
                    progress: 27
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, milestoneCount, publicClient]);

    // Setup write function for creating a milestone
    const { writeContractAsync } = useWriteContract({
        config: config,
    });

    const createMilestone = useCallback(async (name: string, targetAmount: string): Promise<String | boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const nameBytes32 = stringToBytes32(name);
            // Convert ether to wei for the contract
            const targetAmountWei = BigInt(Math.floor(parseFloat(targetAmount) * 1e18));

            // Call the contract
            const result = await writeContractAsync({
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'createMilestone',
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                args: [nameBytes32, targetAmountWei],
            });

            await fetchMilestones();
            console.log('Milestone created:', result);
            return result;
        } catch (err) {
            console.error('Error creating milestone:', err);
            setError('Failed to create milestone. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [writeContractAsync, fetchMilestones]);

    const depositToMilestone = useCallback(async (id: number, amount: string): Promise<String | boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Convert ether to wei for the contract
            const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

            // Call the contract
            const result = await writeContractAsync({
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'deposit',
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                args: [BigInt(id)],
                value: amountWei,
            });

            await fetchMilestones();
            return result;
        } catch (err) {
            console.error('Error depositing to milestone:', err);
            setError('Failed to deposit funds. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [writeContractAsync, fetchMilestones]);

    const withdrawFromMilestone = useCallback(async (id: number): Promise<String | boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Call the contract
            const result = await writeContractAsync({
                abi: STASHFLOW_CONTRACT_ABI,
                functionName: 'withdraw',
                address: STASHFLOW_CONTRACT_ADDRESS as `0x${string}`,
                args: [BigInt(id)],
            });

            await fetchMilestones();
            return result;
        } catch (err) {
            console.error('Error withdrawing from milestone:', err);
            setError('Failed to withdraw funds. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [writeContractAsync, fetchMilestones]);

    // Provide the context value
    const value = {
        milestones,
        isLoading,
        error,
        fetchMilestones,
        createMilestone,
        depositToMilestone,
        withdrawFromMilestone,
    };

    return <MilestoneContext.Provider value={value}>{children}</MilestoneContext.Provider>;
}; 