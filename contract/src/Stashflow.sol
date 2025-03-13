// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/utils/Pausable.sol";

// errors
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

/**
 * @title Stashflow
 * @dev A contract for saving based on milestones with target amounts and deadlines
 */
contract Stashflow is ReentrancyGuard, Ownable, Pausable {
    // Status constants
    uint8 constant STATUS_INACTIVE = 0;
    uint8 constant STATUS_ACTIVE = 1;
    uint8 constant STATUS_COMPLETED = 2;
    
    // Milestone structure - optimized for gas efficiency
    struct Milestone {
        bytes32 name;          // name (32 bytes)
        uint256 targetAmount;  // Target amount to save
        uint256 deadline;      // Deadline timestamp
        uint256 currentAmount; // Current amount saved
        uint8 status;          // Status: 0=inactive, 1=active, 2=completed
    }
    
    // User structure
    struct User {
        bool exists;
        uint256 totalSavings;
        uint256[] milestoneIds;
    }
    
    // Mapping from user address to their User struct
    mapping(address => User) public users;
    
    // Mapping from user address and milestone ID to Milestone
    mapping(address => mapping(uint256 => Milestone)) public milestones;
    
    // Counter for milestone IDs
    uint256 private _milestoneIdCounter;
    
    // Minimum savings amount
    uint256 public minSavingsAmount = 0.01 ether;
    
    // Platform fee (in basis points, 1% = 100)
    uint256 public platformFee = 50; // 0.5%
    
    // Events
    event MilestoneCreated(address indexed user, uint256 indexed milestoneId, bytes32 name, uint256 targetAmount, uint256 deadline);
    event Deposit(address indexed user, uint256 indexed milestoneId, uint256 amount);
    event MilestoneCompleted(address indexed user, uint256 indexed milestoneId);
    event MilestoneFailed(address indexed user, uint256 indexed milestoneId);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdrawal(address indexed user, uint256 indexed milestoneId, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new savings milestone
     * @param _name Name of the milestone
     * @param _targetAmount Target amount to save
     * @param _deadline Deadline timestamp for the milestone
     */
    function createMilestone(
        string memory _name,
        uint256 _targetAmount,
        uint256 _deadline
    ) external whenNotPaused {
        if (_targetAmount < minSavingsAmount) revert TargetAmountTooLow();
        if (_deadline <= block.timestamp) revert DeadlineMustBeInFuture();
        
        // Check that name is not empty and not too long for bytes32
        bytes memory nameBytes = bytes(_name);
        if (nameBytes.length == 0 || nameBytes.length > 32) revert InvalidMilestoneName();
        
        // Convert string to bytes32
        bytes32 nameBytes32;
        assembly {
            nameBytes32 := mload(add(_name, 32))
        }
        
        // Create user if doesn't exist
        if (!users[msg.sender].exists) {
            users[msg.sender].exists = true;
        }
        
        uint256 milestoneId = _milestoneIdCounter++;
        
        // Create new milestone
        Milestone storage newMilestone = milestones[msg.sender][milestoneId];
        newMilestone.name = nameBytes32;
        newMilestone.targetAmount = _targetAmount;
        newMilestone.deadline = _deadline;
        newMilestone.currentAmount = 0;
        newMilestone.status = STATUS_ACTIVE;
        
        // Add milestone ID to user's list
        users[msg.sender].milestoneIds.push(milestoneId);
        
        emit MilestoneCreated(msg.sender, milestoneId, nameBytes32, _targetAmount, _deadline);
    }
    
    /**
     * @dev Allows a user to deposit funds toward a specific milestone
     * @param _milestoneId ID of the milestone
     */
    function deposit(uint256 _milestoneId) external payable nonReentrant whenNotPaused {
        if (msg.value < minSavingsAmount) revert TargetAmountTooLow();
        if (!users[msg.sender].exists) revert UserDoesNotExist();
        
        Milestone storage milestone = milestones[msg.sender][_milestoneId];
        if (milestone.status != STATUS_ACTIVE) revert MilestoneNotActive();
        if (milestone.status == STATUS_COMPLETED) revert MilestoneAlreadyCompleted();
        if (block.timestamp > milestone.deadline) revert MilestoneDeadlinePassed();
        
        // Calculate fee
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 depositAmount = msg.value - fee;
        
        // Update milestone and user data
        milestone.currentAmount += depositAmount;
        users[msg.sender].totalSavings += depositAmount;
        
        // Transfer fee to contract owner
        (bool feeSuccess, ) = owner().call{value: fee}("");
        if (!feeSuccess) revert FeeTransferFailed();
        
        emit Deposit(msg.sender, _milestoneId, depositAmount);
        
        // Check if milestone completed
        if (milestone.currentAmount >= milestone.targetAmount) {
            milestone.status = STATUS_COMPLETED;
            emit MilestoneCompleted(msg.sender, _milestoneId);
        }
    }
    
    /**
     * @dev Allows user to withdraw funds from a completed milestone
     * @param _milestoneId ID of the milestone to withdraw from
     */
    function withdraw(uint256 _milestoneId) external nonReentrant whenNotPaused {
        if (!users[msg.sender].exists) revert UserDoesNotExist();
        
        Milestone storage milestone = milestones[msg.sender][_milestoneId];
        if (milestone.status != STATUS_ACTIVE && milestone.status != STATUS_COMPLETED) revert MilestoneNotActive();
        
        // Check if milestone is completed or deadline has passed
        bool canWithdraw = milestone.status == STATUS_COMPLETED || block.timestamp > milestone.deadline;
        if (!canWithdraw) revert CannotWithdrawBeforeCompletionOrDeadline();
        
        uint256 amountToWithdraw = milestone.currentAmount;
        if (amountToWithdraw == 0) revert NoFundsToWithdraw();
        
        // Update milestone and user data
        milestone.currentAmount = 0;
        milestone.status = STATUS_INACTIVE;
        users[msg.sender].totalSavings -= amountToWithdraw;
        
        // If deadline passed without completing, emit failure event
        if (milestone.status != STATUS_COMPLETED && block.timestamp > milestone.deadline) {
            emit MilestoneFailed(msg.sender, _milestoneId);
        }
        
        // Transfer funds to user
        (bool success, ) = msg.sender.call{value: amountToWithdraw}("");
        if (!success) revert WithdrawalFailed();
        
        emit Withdrawal(msg.sender, amountToWithdraw);
    }
    
    /**
     * @dev Allows emergency withdrawal from an active milestone with penalty
     * @param _milestoneId ID of the milestone
     */
    function emergencyWithdraw(uint256 _milestoneId) external nonReentrant whenNotPaused {
        if (!users[msg.sender].exists) revert UserDoesNotExist();
        
        Milestone storage milestone = milestones[msg.sender][_milestoneId];
        if (milestone.status != STATUS_ACTIVE) revert MilestoneNotActive();
        if (milestone.status == STATUS_COMPLETED) revert MilestoneAlreadyCompleted();
        if (milestone.currentAmount == 0) revert NoFundsToWithdraw();
        
        // Apply penalty for early withdrawal (5%)
        uint256 penalty = (milestone.currentAmount * 500) / 10000;
        uint256 amountToWithdraw = milestone.currentAmount - penalty;
        
        // Update milestone and user data
        milestone.currentAmount = 0;
        milestone.status = STATUS_INACTIVE;
        users[msg.sender].totalSavings -= milestone.currentAmount;
        
        // Transfer penalty to contract owner
        (bool penaltySuccess, ) = owner().call{value: penalty}("");
        if (!penaltySuccess) revert PenaltyTransferFailed();
        
        // Transfer remaining funds to user
        (bool success, ) = msg.sender.call{value: amountToWithdraw}("");
        if (!success) revert EmergencyWithdrawalFailed();
        
        emit EmergencyWithdrawal(msg.sender, _milestoneId, amountToWithdraw);
    }
    
    /**
     * @dev Returns the number of milestones for a user
     * @param _user Address of the user
     * @return Number of milestones
     */
    function getMilestoneCount(address _user) external view returns (uint256) {
        return users[_user].milestoneIds.length;
    }
    
    /**
     * @dev Returns milestone details
     * @param _user Address of the user
     * @param _milestoneId ID of the milestone
     * @return name Name of the milestone (as bytes32)
     * @return targetAmount Target amount for the milestone
     * @return deadline Deadline timestamp for the milestone
     * @return currentAmount Current amount saved for the milestone
     * @return completed Whether the milestone is completed
     * @return active Whether the milestone is active
     */
    function getMilestoneDetails(address _user, uint256 _milestoneId) external view returns (
        bytes32 name,
        uint256 targetAmount,
        uint256 deadline,
        uint256 currentAmount,
        bool completed,
        bool active
    ) {
        Milestone storage milestone = milestones[_user][_milestoneId];
        
        bool isCompleted = milestone.status == STATUS_COMPLETED;
        bool isActive = milestone.status == STATUS_ACTIVE;
        
        return (
            milestone.name,
            milestone.targetAmount,
            milestone.deadline,
            milestone.currentAmount,
            isCompleted,
            isActive
        );
    }
    
    /**
     * @dev Converts a bytes32 to a string (helper function for frontends)
     * @param _bytes32 The bytes32 to convert
     * @return string representation
     */
    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
    
    /**
     * @dev Updates the minimum savings amount (only owner)
     * @param _newMinAmount New minimum amount
     */
    function setMinSavingsAmount(uint256 _newMinAmount) external onlyOwner {
        minSavingsAmount = _newMinAmount;
    }
    
    /**
     * @dev Updates the platform fee (only owner)
     * @param _newFee New fee in basis points (1% = 100)
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        if (_newFee > 500) revert FeeTooHigh(); // Max 5%
        platformFee = _newFee;
    }
    
    /**
     * @dev Pauses the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
} 