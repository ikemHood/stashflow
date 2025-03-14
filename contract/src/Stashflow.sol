// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IStashflow.sol";

/**
 * @title Stashflow
 * @dev A contract for saving based on milestones with target amounts and deadlines
 */
contract Stashflow is ReentrancyGuard, Ownable, Pausable, IStashflow {
    using SafeERC20 for IERC20;
    
    // Status constants
    uint8 constant STATUS_INACTIVE = 0;
    uint8 constant STATUS_ACTIVE = 1;
    uint8 constant STATUS_COMPLETED = 2;
    
    // Milestone type constants
    uint8 constant TYPE_FIXED_DEPOSIT = 0;
    uint8 constant TYPE_FLEXIBLE_DEPOSIT = 1;
    
    // User structure
    struct User {
        bool exists;
        uint256 totalSavings;
        uint256[] milestoneIds;
        mapping(address => uint256) tokenSavings; // Total savings per token
    }
    
    // Mapping from user address to their User struct
    mapping(address => User) public users;
    
    // Mapping from user address and milestone ID to Milestone
    mapping(address => mapping(uint256 => Milestone)) public milestones;
    
    // Counter for milestone IDs
    uint256 private _milestoneIdCounter;
    
    // Minimum savings amount (in wei for ETH, smallest unit for tokens)
    uint256 public minSavingsAmount = 0.01 ether;
    
    // Platform fee (in basis points, 1% = 100)
    uint256 public platformFee = 50; // 0.5%
    
    // Early withdrawal penalty (in basis points, 1% = 100)
    uint256 public withdrawalPenalty = 500; // 5%
    
    // Allowed tokens mapping
    mapping(address => bool) public allowedTokens;
    
    // Treasury address that receives fees and penalties
    address public treasuryAddress;
     
    constructor() Ownable(msg.sender) {
        // Native ETH is always allowed
        allowedTokens[address(0)] = true;
        
        // Initially set treasury to owner
        treasuryAddress = msg.sender;
    }
    
    /**
     * @dev Creates a new savings milestone
     * @param _name Name of the milestone (32 bytes)
     * @param _targetAmount Target amount to save
     * @param _deadline Deadline timestamp for the milestone
     * @param _tokenAddress Address of token (address(0) for native ETH)
     * @param _milestoneType Type of milestone (0=fixed, 1=random deposit amounts)
     * @param _fixedAmount Fixed deposit amount (if applicable)
     */
    function createMilestone(
        bytes32 _name,
        uint256 _targetAmount,
        uint256 _deadline,
        address _tokenAddress,
        uint8 _milestoneType,
        uint256 _fixedAmount
    ) external whenNotPaused {
        if (_targetAmount < minSavingsAmount) revert TargetAmountTooLow();
        if (_deadline <= block.timestamp) revert DeadlineMustBeInFuture();
        if (!allowedTokens[_tokenAddress]) revert TokenNotAllowed();
        if (_milestoneType == TYPE_FIXED_DEPOSIT && _fixedAmount == 0) revert InvalidFixedDepositAmount();
        if (_milestoneType > TYPE_FLEXIBLE_DEPOSIT) revert InvalidMilestoneName();
    
        // Create user if doesn't exist
        if (!users[msg.sender].exists) {
            users[msg.sender].exists = true;
        }
        
        uint256 milestoneId = _milestoneIdCounter++;
        
        // Create new milestone
        Milestone storage newMilestone = milestones[msg.sender][milestoneId];
        newMilestone.name = _name;
        newMilestone.targetAmount = _targetAmount;
        newMilestone.deadline = _deadline;
        newMilestone.currentAmount = 0;
        newMilestone.status = STATUS_ACTIVE;
        newMilestone.tokenAddress = _tokenAddress;
        newMilestone.milestoneType = _milestoneType;
        newMilestone.fixedAmount = _fixedAmount;
        
        // Add milestone ID to user's list
        users[msg.sender].milestoneIds.push(milestoneId);
        
        emit MilestoneCreated(
            msg.sender, 
            milestoneId, 
            _name, 
            _targetAmount, 
            _deadline, 
            _tokenAddress, 
            _milestoneType, 
            _fixedAmount
        );
    }
    
    /**
     * @dev Allows a user to deposit native ETH toward a specific milestone
     * @param _milestoneId ID of the milestone
     */
    function deposit(uint256 _milestoneId) external payable nonReentrant whenNotPaused {
        Milestone storage milestone = milestones[msg.sender][_milestoneId];
        
        // Ensure milestone uses native token
        if (milestone.tokenAddress != address(0)) revert OnlyNativeTokenAllowed();
        
        _validateDepositRequirements(msg.sender, _milestoneId, msg.value);
        
        // For fixed deposits, ensure the amount matches
        if (milestone.milestoneType == TYPE_FIXED_DEPOSIT && msg.value != milestone.fixedAmount) {
            revert InvalidTokenAmount();
        }
        
        // Calculate fee
        uint256 fee = (msg.value * platformFee) / 10000;
        uint256 depositAmount = msg.value - fee;
        
        // Update milestone and user data
        milestone.currentAmount += depositAmount;
        users[msg.sender].totalSavings += depositAmount;
        
        // Transfer fee to treasury
        (bool feeSuccess, ) = treasuryAddress.call{value: fee}("");
        if (!feeSuccess) revert FeeTransferFailed();
        
        emit Deposit(msg.sender, _milestoneId, depositAmount, address(0));
        
        _checkMilestoneCompletion(msg.sender, _milestoneId);
    }
    
    /**
     * @dev Allows a user to deposit ERC20 tokens toward a specific milestone
     * @param _milestoneId ID of the milestone
     * @param _amount Amount of tokens to deposit
     */
    function depositToken(uint256 _milestoneId, uint256 _amount) external nonReentrant whenNotPaused {
        Milestone storage milestone = milestones[msg.sender][_milestoneId];
        
        // Ensure milestone uses ERC20 token
        address tokenAddress = milestone.tokenAddress;
        if (tokenAddress == address(0)) revert InvalidTokenTransfer();
        
        _validateDepositRequirements(msg.sender, _milestoneId, _amount);
        
        // For fixed deposits, ensure the amount matches
        if (milestone.milestoneType == TYPE_FIXED_DEPOSIT && _amount != milestone.fixedAmount) {
            revert InvalidTokenAmount();
        }
        
        // Calculate fee
        uint256 fee = (_amount * platformFee) / 10000;
        uint256 depositAmount = _amount - fee;
        
        // Transfer tokens from user to contract
        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), depositAmount);
        
        // Transfer fee to treasury
        if (fee > 0) {
            token.safeTransferFrom(msg.sender, treasuryAddress, fee);
        }
        
        // Update milestone and user data
        milestone.currentAmount += depositAmount;
        users[msg.sender].tokenSavings[tokenAddress] += depositAmount;
        
        emit Deposit(msg.sender, _milestoneId, depositAmount, tokenAddress);
        
        _checkMilestoneCompletion(msg.sender, _milestoneId);
    }
    
    /**
     * @dev Validates deposit requirements
     * @param _user User address
     * @param _milestoneId Milestone ID
     * @param _amount Amount being deposited
     */
    function _validateDepositRequirements(address _user, uint256 _milestoneId, uint256 _amount) internal view {
        if (_amount < minSavingsAmount) revert TargetAmountTooLow();
        if (!users[_user].exists) revert UserDoesNotExist();
        
        Milestone storage milestone = milestones[_user][_milestoneId];
        if (milestone.status != STATUS_ACTIVE) revert MilestoneNotActive();
        if (milestone.status == STATUS_COMPLETED) revert MilestoneAlreadyCompleted();
        if (block.timestamp > milestone.deadline) revert MilestoneDeadlinePassed();
    }
    
    /**
     * @dev Checks if milestone is completed after deposit
     * @param _user User address
     * @param _milestoneId Milestone ID
     */
    function _checkMilestoneCompletion(address _user, uint256 _milestoneId) internal {
        Milestone storage milestone = milestones[_user][_milestoneId];
        
        // Check if milestone completed
        if (milestone.currentAmount >= milestone.targetAmount) {
            milestone.status = STATUS_COMPLETED;
            emit MilestoneCompleted(_user, _milestoneId);
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
        
        address tokenAddress = milestone.tokenAddress;
        
        // Update user's total savings
        if (tokenAddress == address(0)) {
            users[msg.sender].totalSavings -= amountToWithdraw;
        } else {
            users[msg.sender].tokenSavings[tokenAddress] -= amountToWithdraw;
        }
        
        // If deadline passed without completing, emit failure event
        if (milestone.status != STATUS_COMPLETED && block.timestamp > milestone.deadline) {
            emit MilestoneFailed(msg.sender, _milestoneId);
        }
        
        // Transfer funds to user
        if (tokenAddress == address(0)) {
            // Native ETH
            (bool success, ) = msg.sender.call{value: amountToWithdraw}("");
            if (!success) revert WithdrawalFailed();
        } else {
            // ERC20 token
            IERC20(tokenAddress).safeTransfer(msg.sender, amountToWithdraw);
        }
        
        emit Withdrawal(msg.sender, amountToWithdraw, tokenAddress);
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
        
        // Apply configured penalty for early withdrawal
        uint256 penalty = (milestone.currentAmount * withdrawalPenalty) / 10000;
        uint256 amountToWithdraw = milestone.currentAmount - penalty;
        
        // Update milestone and user data
        milestone.currentAmount = 0;
        milestone.status = STATUS_INACTIVE;
        
        address tokenAddress = milestone.tokenAddress;
        
        // Update user's total savings
        if (tokenAddress == address(0)) {
            users[msg.sender].totalSavings -= milestone.currentAmount;
            
            // Transfer penalty to treasury
            (bool penaltySuccess, ) = treasuryAddress.call{value: penalty}("");
            if (!penaltySuccess) revert PenaltyTransferFailed();
            
            // Transfer remaining funds to user
            (bool success, ) = msg.sender.call{value: amountToWithdraw}("");
            if (!success) revert EmergencyWithdrawalFailed();
        } else {
            users[msg.sender].tokenSavings[tokenAddress] -= milestone.currentAmount;
            
            // Transfer penalty to treasury
            IERC20 token = IERC20(tokenAddress);
            token.safeTransfer(treasuryAddress, penalty);
            
            // Transfer remaining funds to user
            token.safeTransfer(msg.sender, amountToWithdraw);
        }
        
        emit EmergencyWithdrawal(msg.sender, _milestoneId, amountToWithdraw, tokenAddress);
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
     * @return tokenAddress Address of the token
     * @return milestoneType Type of milestone (0=fixed, 1=random)
     * @return fixedAmount Fixed deposit amount (if applicable)
     */
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
            isActive,
            milestone.tokenAddress,
            milestone.milestoneType,
            milestone.fixedAmount
        );
    }
    
    /**
     * @dev Returns user's total savings in a specific token
     * @param _user Address of the user
     * @param _tokenAddress Address of the token (address(0) for native ETH)
     * @return Total savings in the specified token
     */
    function getUserTokenSavings(address _user, address _tokenAddress) external view returns (uint256) {
        if (_tokenAddress == address(0)) {
            return users[_user].totalSavings;
        } else {
            return users[_user].tokenSavings[_tokenAddress];
        }
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
     * @dev Updates the withdrawal penalty (only owner)
     * @param _newPenalty New penalty in basis points (1% = 100)
     */
    function setWithdrawalPenalty(uint256 _newPenalty) external onlyOwner {
        if (_newPenalty > 2000) revert PenaltyTooHigh(); // Max 20%
        withdrawalPenalty = _newPenalty;
        emit WithdrawalPenaltyUpdated(_newPenalty);
    }
    
    /**
     * @dev Updates the treasury address (only owner)
     * @param _newTreasury New treasury address
     */
    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasuryAddress;
        treasuryAddress = _newTreasury;
        emit TreasuryAddressUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @dev Adds a token to the allowed tokens list (only owner)
     * @param _tokenAddress Address of the token to add
     */
    function addAllowedToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Cannot add native token");
        allowedTokens[_tokenAddress] = true;
        emit TokenAdded(_tokenAddress);
    }
    
    /**
     * @dev Removes a token from the allowed tokens list (only owner)
     * @param _tokenAddress Address of the token to remove
     */
    function removeAllowedToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Cannot remove native token");
        allowedTokens[_tokenAddress] = false;
        emit TokenRemoved(_tokenAddress);
    }
    
    /**
     * @dev Checks if a token is allowed
     * @param _tokenAddress Address of the token to check
     * @return Whether the token is allowed
     */
    function isTokenAllowed(address _tokenAddress) external view returns (bool) {
        return allowedTokens[_tokenAddress];
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