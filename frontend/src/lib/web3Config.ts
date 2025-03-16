import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains'


// Create wagmi config with desired chains and connectors
export const config = createConfig({
    chains: [sepolia, mainnet, polygon, optimism, arbitrum, base],
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [optimism.id]: http(),
        [arbitrum.id]: http(),
        [base.id]: http(),
        [sepolia.id]: http(),
    },
});

// Contract ABI and address
// This should match your deployed Stashflow contract
export const STASHFLOW_CONTRACT_ADDRESS = import.meta.env.VITE_STASHFLOW_CONTRACT_ADDRESS || '';

// Complete ABI matching Stashflow.sol contract
export const STASHFLOW_CONTRACT_ABI = [
    // Events
    'event MilestoneCreated(address indexed user, uint256 indexed milestoneId, bytes32 name, uint256 targetAmount, uint256 deadline, address tokenAddress, uint8 milestoneType, uint256 fixedAmount)',
    'event Deposit(address indexed user, uint256 indexed milestoneId, uint256 amount, address tokenAddress)',
    'event MilestoneCompleted(address indexed user, uint256 indexed milestoneId)',
    'event MilestoneFailed(address indexed user, uint256 indexed milestoneId)',
    'event Withdrawal(address indexed user, uint256 amount, address tokenAddress)',
    'event EmergencyWithdrawal(address indexed user, uint256 indexed milestoneId, uint256 amount, address tokenAddress)',
    'event WithdrawalPenaltyUpdated(uint256 newPenalty)',
    'event TreasuryAddressUpdated(address oldTreasury, address newTreasury)',
    'event TokenAdded(address indexed tokenAddress)',
    'event TokenRemoved(address indexed tokenAddress)',

    // Read functions
    'function getMilestoneDetails(address _user, uint256 _milestoneId) external view returns (bytes32 name, uint256 targetAmount, uint256 deadline, uint256 currentAmount, bool completed, bool active, address tokenAddress, uint8 milestoneType, uint256 fixedAmount)',
    'function getMilestoneCount(address _user) external view returns (uint256)',
    'function getUserTokenSavings(address _user, address _tokenAddress) external view returns (uint256)',
    'function bytes32ToString(bytes32 _bytes32) public pure returns (string)',
    'function isTokenAllowed(address _tokenAddress) external view returns (bool)',
    'function platformFee() external view returns (uint256)',
    'function withdrawalPenalty() external view returns (uint256)',
    'function minSavingsAmount() external view returns (uint256)',
    'function treasuryAddress() external view returns (address)',
    'function allowedTokens(address) external view returns (bool)',
    'function users(address) external view returns (bool exists, uint256 totalSavings)',

    // Write functions
    'function createMilestone(bytes32 _name, uint256 _targetAmount, uint256 _deadline, address _tokenAddress, uint8 _milestoneType, uint256 _fixedAmount) external',
    'function deposit(uint256 _milestoneId) external payable',
    'function depositToken(uint256 _milestoneId, uint256 _amount) external',
    'function withdraw(uint256 _milestoneId) external',
    'function emergencyWithdraw(uint256 _milestoneId) external',

    // Admin functions
    'function setMinSavingsAmount(uint256 _newMinAmount) external',
    'function setPlatformFee(uint256 _newFee) external',
    'function setWithdrawalPenalty(uint256 _newPenalty) external',
    'function setTreasuryAddress(address _newTreasury) external',
    'function addAllowedToken(address _tokenAddress) external',
    'function removeAllowedToken(address _tokenAddress) external',
    'function pause() external',
    'function unpause() external'
];

// Sample ERC20 ABI with the minimum required functions for our application
export const ERC20_ABI = [
    {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        type: 'function',
    },
];

// Sample ABI for the Stashflow contract (placeholder)
export const STASHFLOW_CONTRACT_ABI_SAMPLE = [
    // Milestone functions
    {
        inputs: [
            { name: 'name', type: 'bytes32' },
            { name: 'targetAmount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'tokenAddress', type: 'address' },
            { name: 'milestoneType', type: 'uint8' },
            { name: 'fixedAmount', type: 'uint256' },
        ],
        name: 'createMilestone',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'milestoneId', type: 'uint256' }],
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ name: 'milestoneId', type: 'uint256' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'milestoneId', type: 'uint256' }],
        name: 'emergencyWithdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Read functions
    {
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'milestoneId', type: 'uint256' },
        ],
        name: 'getMilestoneDetails',
        outputs: [
            { name: 'name', type: 'bytes32' },
            { name: 'targetAmount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'currentAmount', type: 'uint256' },
            { name: 'completed', type: 'bool' },
            { name: 'active', type: 'bool' },
            { name: 'tokenAddress', type: 'address' },
            { name: 'milestoneType', type: 'uint8' },
            { name: 'fixedAmount', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'getMilestoneCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'platformFee',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdrawalPenalty',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
];

// Contract addresses (placeholder for now)
export const STASHFLOW_CONTRACT_ADDRESS_SAMPLE = '0x0000000000000000000000000000000000000000';

// Create wagmi config
export const config_sample = createConfig({
    chains: [mainnet, sepolia],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
    },
}); 