// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IStashflow
 * @dev Interface for the Stashflow contract that defines all external functions and events
 */
interface IStashflow {
    // Error declarations
    error TargetAmountTooLow();
    error DeadlineMustBeInFuture();
    error UserDoesNotExist();
    error MilestoneNotActive();
    error MilestoneAlreadyCompleted();
    error MilestoneDeadlinePassed();
    error CannotWithdrawBeforeCompletionOrDeadline();
    error NoFundsToWithdraw();
    error FeeTransferFailed();
    error WithdrawalFailed();
    error PenaltyTransferFailed();
    error EmergencyWithdrawalFailed();
    error FeeTooHigh();
    error InvalidMilestoneName();
    error TokenNotAllowed();
    error InvalidFixedDepositAmount();
    error InvalidTokenTransfer();
    error OnlyNativeTokenAllowed();
    error InvalidTokenAmount();
    error PenaltyTooHigh();

    // Structs
    struct Milestone {
        bytes32 name;
        uint256 targetAmount;
        uint256 deadline;
        uint256 currentAmount;
        uint8 status;
        address tokenAddress;
        uint8 milestoneType;
        uint256 fixedAmount;
    }

    // Events
    event MilestoneCreated(address indexed user, uint256 indexed milestoneId, bytes32 name, uint256 targetAmount, uint256 deadline, address tokenAddress, uint8 milestoneType, uint256 fixedAmount);
    event Deposit(address indexed user, uint256 indexed milestoneId, uint256 amount, address tokenAddress);
    event MilestoneCompleted(address indexed user, uint256 indexed milestoneId);
    event MilestoneFailed(address indexed user, uint256 indexed milestoneId);
    event Withdrawal(address indexed user, uint256 amount, address tokenAddress);
    event EmergencyWithdrawal(address indexed user, uint256 indexed milestoneId, uint256 amount, address tokenAddress);
    event TokenAdded(address indexed tokenAddress);
    event TokenRemoved(address indexed tokenAddress);
    event WithdrawalPenaltyUpdated(uint256 newPenalty);
    event TreasuryAddressUpdated(address indexed oldTreasury, address indexed newTreasury);

    // View functions
    function users(address user) external view returns (bool exists, uint256 totalSavings);
    function milestones(address user, uint256 milestoneId) external view returns (
        bytes32 name,
        uint256 targetAmount,
        uint256 deadline,
        uint256 currentAmount,
        uint8 status,
        address tokenAddress,
        uint8 milestoneType,
        uint256 fixedAmount
    );
    function minSavingsAmount() external view returns (uint256);
    function platformFee() external view returns (uint256);
    function withdrawalPenalty() external view returns (uint256);
    function allowedTokens(address tokenAddress) external view returns (bool);
    function treasuryAddress() external view returns (address);
    function getMilestoneCount(address _user) external view returns (uint256);
    function getMilestoneDetails(address _user, uint256 _milestoneId) external view returns (
        bytes32 name,
        uint256 targetAmount,
        uint256 deadline,
        uint256 currentAmount,
        bool completed,
        bool active,
        address tokenAddress,
        uint8 milestoneType,
        uint256 fixedAmount
    );
    function getUserTokenSavings(address _user, address _tokenAddress) external view returns (uint256);
    function bytes32ToString(bytes32 _bytes32) external pure returns (string memory);
    function isTokenAllowed(address _tokenAddress) external view returns (bool);

    // User-facing functions
    function createMilestone(
        bytes32 _name,
        uint256 _targetAmount,
        uint256 _deadline,
        address _tokenAddress,
        uint8 _milestoneType,
        uint256 _fixedAmount
    ) external;
    
    function deposit(uint256 _milestoneId) external payable;
    
    function depositToken(uint256 _milestoneId, uint256 _amount) external;
    
    function withdraw(uint256 _milestoneId) external;
    
    function emergencyWithdraw(uint256 _milestoneId) external;

    // Admin functions
    function setMinSavingsAmount(uint256 _newMinAmount) external;
    
    function setPlatformFee(uint256 _newFee) external;
    
    function setWithdrawalPenalty(uint256 _newPenalty) external;
    
    function setTreasuryAddress(address _newTreasury) external;
    
    function addAllowedToken(address _tokenAddress) external;
    
    function removeAllowedToken(address _tokenAddress) external;
    
    function pause() external;
    
    function unpause() external;
} 