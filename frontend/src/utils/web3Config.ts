import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Create wagmi config with desired chains and connectors
export const config = createConfig({
    chains: [sepolia],
    connectors: [
        injected(),
        metaMask(),
    ],
    transports: {
        [sepolia.id]: http(),
    },
});

// Contract ABI and address
// This should match your deployed Stashflow contract
export const STASHFLOW_CONTRACT_ADDRESS = import.meta.env.VITE_STASHFLOW_CONTRACT_ADDRESS || '';

// This is a simplified ABI with key functions, replace with your actual ABI
export const STASHFLOW_CONTRACT_ABI = [
    // Events
    'event MilestoneCreated(uint256 indexed id, address indexed creator, bytes32 name, uint256 targetAmount)',
    'event Deposit(uint256 indexed milestoneId, address indexed depositor, uint256 amount)',
    'event MilestoneCompleted(uint256 indexed milestoneId, address indexed completer)',
    'event Withdrawal(uint256 indexed milestoneId, address indexed recipient, uint256 amount)',

    // Read functions
    'function getMilestoneDetails(uint256 milestoneId) external view returns (bytes32 name, uint256 targetAmount, uint256 currentAmount, bool isCompleted, bool isActive)',
    'function getMilestoneCount() external view returns (uint256)',
    'function getFee() external view returns (uint256)',

    // Write functions
    'function createMilestone(bytes32 name, uint256 targetAmount) external returns (uint256)',
    'function deposit(uint256 milestoneId) external payable',
    'function withdraw(uint256 milestoneId) external',
    'function completeMilestone(uint256 milestoneId) external',
]; 