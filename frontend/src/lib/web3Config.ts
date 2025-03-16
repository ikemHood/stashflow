import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains'


// Create wagmi config with desired chains and connectors
export const config = createConfig({
    chains: [baseSepolia, base],
    transports: {
        [baseSepolia.id]: http(),
        [base.id]: http(),
    },
});

export const STASHFLOW_CONTRACT_ADDRESS = import.meta.env.VITE_STASHFLOW_CONTRACT_ADDRESS || '0x882231603DFD16089f987E4cf74021c46A77D1Bc';
export const TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS || '0xFDC9F2fa2345f1aEE20A146D68e5d23F31F71Ea2';

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

export const STASHFLOW_CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "CannotWithdrawBeforeCompletionOrDeadline"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "DeadlineMustBeInFuture"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "EmergencyWithdrawalFailed"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "EnforcedPause"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "ExpectedPause"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "FeeTooHigh"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "FeeTransferFailed"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "InvalidFixedDepositAmount"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "InvalidMilestoneName"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "InvalidTokenAmount"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "InvalidTokenTransfer"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "MilestoneAlreadyCompleted"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "MilestoneDeadlinePassed"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "MilestoneNotActive"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "NoFundsToWithdraw"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "OnlyNativeTokenAllowed"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "OwnableInvalidOwner"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "OwnableUnauthorizedAccount"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "PenaltyTooHigh"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "PenaltyTransferFailed"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "ReentrancyGuardReentrantCall"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "SafeERC20FailedOperation"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "TargetAmountTooLow"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "TokenNotAllowed"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "UserDoesNotExist"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "WithdrawalFailed"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "Deposit",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "EmergencyWithdrawal",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "MilestoneCompleted",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256",
                "indexed": true
            },
            {
                "internalType": "bytes32",
                "name": "name",
                "type": "bytes32",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "targetAmount",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address",
                "indexed": false
            },
            {
                "internalType": "uint8",
                "name": "milestoneType",
                "type": "uint8",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "fixedAmount",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "MilestoneCreated",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "MilestoneFailed",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "previousOwner",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "OwnershipTransferred",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "Paused",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "TokenAdded",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "TokenRemoved",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "oldTreasury",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "newTreasury",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "TreasuryAddressUpdated",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "Unpaused",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "Withdrawal",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "newPenalty",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "WithdrawalPenaltyUpdated",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "addAllowedToken"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "allowedTokens",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_bytes32",
                "type": "bytes32"
            }
        ],
        "stateMutability": "pure",
        "type": "function",
        "name": "bytes32ToString",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_name",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "_targetAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_deadline",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint8",
                "name": "_milestoneType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "_fixedAmount",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "createMilestone"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_milestoneId",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function",
        "name": "deposit"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_milestoneId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "depositToken"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_milestoneId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "emergencyWithdraw"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getMilestoneCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_milestoneId",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getMilestoneDetails",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "name",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "targetAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "currentAmount",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "completed",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "active",
                "type": "bool"
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint8",
                "name": "milestoneType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "fixedAmount",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getUserTokenSavings",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "isTokenAllowed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "milestones",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "name",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "targetAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "currentAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "status",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "tokenAddress",
                "type": "address"
            },
            {
                "internalType": "uint8",
                "name": "milestoneType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "fixedAmount",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "minSavingsAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "pause"
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "paused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "platformFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "removeAllowedToken"
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "renounceOwnership"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_newMinAmount",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "setMinSavingsAmount"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_newFee",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "setPlatformFee"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_newTreasury",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "setTreasuryAddress"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_newPenalty",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "setWithdrawalPenalty"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "transferOwnership"
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "treasuryAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "unpause"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "users",
        "outputs": [
            {
                "internalType": "bool",
                "name": "exists",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "totalSavings",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_milestoneId",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "withdraw"
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "withdrawalPenalty",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    }
];

