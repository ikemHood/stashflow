// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import { 
    Stashflow,
    TargetAmountTooLow,
    DeadlineMustBeInFuture,
    UserDoesNotExist,
    MilestoneNotActive,
    MilestoneAlreadyCompleted,
    MilestoneDeadlinePassed,
    CannotWithdrawBeforeCompletionOrDeadline,
    NoFundsToWithdraw,
    FeeTransferFailed,
    WithdrawalFailed,
    PenaltyTransferFailed,
    EmergencyWithdrawalFailed,
    FeeTooHigh,
    InvalidMilestoneName
} from "../src/Stashflow.sol";

contract StashflowTest is Test {
    Stashflow public savings;
    address public owner;
    address public user1;
    address public user2;
    
    uint256 constant USER_STARTING_BALANCE = 10 ether;
    uint256 constant MILESTONE_TARGET = 1 ether;
    uint256 constant DEPOSIT_AMOUNT = 0.5 ether;
    
    // Events we want to test - updated for bytes32 names
    event MilestoneCreated(address indexed user, uint256 indexed milestoneId, bytes32 name, uint256 targetAmount, uint256 deadline);
    event Deposit(address indexed user, uint256 indexed milestoneId, uint256 amount);
    event MilestoneCompleted(address indexed user, uint256 indexed milestoneId);
    
    // Helper function to convert string to bytes32 for testing
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
    
    function setUp() public {
        // Make this test contract the owner
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Fund test accounts
        vm.deal(owner, USER_STARTING_BALANCE); // Fund the owner too
        vm.deal(user1, USER_STARTING_BALANCE);
        vm.deal(user2, USER_STARTING_BALANCE);
        
        // Deploy contract with this test contract as owner
        vm.prank(owner);
        savings = new Stashflow();
    }
    
    function test_CreateMilestone() public {
        uint256 futureDatetime = block.timestamp + 30 days;
        string memory milestoneName = "Vacation Fund";
        bytes32 milestoneNameBytes32 = stringToBytes32(milestoneName);
        
        // Set up expectations for events
        vm.expectEmit(true, true, false, true);
        emit MilestoneCreated(user1, 0, milestoneNameBytes32, MILESTONE_TARGET, futureDatetime);
        
        // Create milestone
        vm.startPrank(user1);
        savings.createMilestone(milestoneName, MILESTONE_TARGET, futureDatetime);
        vm.stopPrank();
        
        // Verify milestone was created
        assertEq(savings.getMilestoneCount(user1), 1);
        
        (
            bytes32 name,
            uint256 targetAmount,
            ,  // Ignore deadline in comparison
            uint256 currentAmount,
            bool completed,
            bool active
        ) = savings.getMilestoneDetails(user1, 0);
        
        assertEq(name, milestoneNameBytes32);
        assertEq(targetAmount, MILESTONE_TARGET);
        assertEq(currentAmount, 0);
        assertEq(completed, false);
        assertEq(active, true);
    }
    
    function test_Deposit() public {
        // Create milestone first
        vm.startPrank(user1);
        savings.createMilestone("Vacation Fund", MILESTONE_TARGET, block.timestamp + 30 days);
        
        // Calculate expected deposit amount after fee
        uint256 platformFee = (DEPOSIT_AMOUNT * 50) / 10000; // 0.5% fee
        uint256 expectedDeposit = DEPOSIT_AMOUNT - platformFee;
        
        // Set up expectations for events - use the exact same parameters as the emit statement
        vm.expectEmit();
        emit Deposit(user1, 0, expectedDeposit);
        
        // Make deposit
        savings.deposit{value: DEPOSIT_AMOUNT}(0);
        vm.stopPrank();
        
        // Verify deposit was processed
        (,,,uint256 currentAmount,,) = savings.getMilestoneDetails(user1, 0);
        assertEq(currentAmount, expectedDeposit);
    }
    
    function test_CompleteAndWithdraw() public {
        // Create milestone
        vm.startPrank(user1);
        savings.createMilestone("Vacation Fund", MILESTONE_TARGET, block.timestamp + 30 days);
        
        // Deposit enough to complete
        uint256 deposit1 = DEPOSIT_AMOUNT;
        uint256 deposit2 = MILESTONE_TARGET; // This will complete the milestone
        
        // First deposit
        savings.deposit{value: deposit1}(0);
        
        // Calculate expected fees
        uint256 fee1 = (deposit1 * 50) / 10000;
        uint256 fee2 = (deposit2 * 50) / 10000;
        
        // Expected deposit amounts after fees
        uint256 expectedDeposit1 = deposit1 - fee1;
        uint256 expectedDeposit2 = deposit2 - fee2;
        
        // Record balances
        uint256 balanceBefore = user1.balance;
        
        // Set up expectations for completion event on second deposit
        vm.expectEmit();
        emit MilestoneCompleted(user1, 0);
        
        // Second deposit - should complete milestone
        savings.deposit{value: deposit2}(0);
        
        // Verify the milestone is completed before withdrawal
        (,,,,bool completedBeforeWithdraw, bool activeBeforeWithdraw) = savings.getMilestoneDetails(user1, 0);
        assertEq(completedBeforeWithdraw, true);
        assertEq(activeBeforeWithdraw, false); // Once completed, it's no longer active

        // Withdraw funds
        savings.withdraw(0);
        vm.stopPrank();
        
        // Verify user received funds
        uint256 balanceAfter = user1.balance;
        
        // Expected withdrawal = sum of deposits after fees
        uint256 expectedWithdrawal = expectedDeposit1 + expectedDeposit2;
        
        // Check balance difference accounting for gas costs (using approximate check)
        assertGt(balanceAfter, balanceBefore - deposit1 - deposit2 + expectedWithdrawal - 0.1 ether); // Allow for gas costs
        
        // Verify milestone status after withdrawal
        (,,,,bool completedAfterWithdraw, bool activeAfterWithdraw) = savings.getMilestoneDetails(user1, 0);
        assertEq(completedAfterWithdraw, false); // Status is now inactive
        assertEq(activeAfterWithdraw, false);
    }
    
    function test_EmergencyWithdrawal() public {
        // Create milestone
        vm.startPrank(user1);
        savings.createMilestone("Vacation Fund", MILESTONE_TARGET, block.timestamp + 30 days);
        
        // Deposit some funds
        savings.deposit{value: DEPOSIT_AMOUNT}(0);
        
        // Calculate expected values
        uint256 fee = (DEPOSIT_AMOUNT * 50) / 10000;
        uint256 depositAmount = DEPOSIT_AMOUNT - fee;
        uint256 penalty = (depositAmount * 500) / 10000; // 5% penalty
        uint256 expectedWithdrawal = depositAmount - penalty;
        
        // Record balance before emergency withdrawal
        uint256 balanceBefore = user1.balance;
        
        // Emergency withdraw
        savings.emergencyWithdraw(0);
        vm.stopPrank();
        
        // Verify user received funds minus penalty
        uint256 balanceAfter = user1.balance;
        
        // Check balance difference accounting for gas costs (using approximate check)
        assertGt(balanceAfter, balanceBefore - DEPOSIT_AMOUNT + expectedWithdrawal - 0.1 ether); // Allow for gas costs
        
        // Verify milestone status
        (,,,,bool completed, bool active) = savings.getMilestoneDetails(user1, 0);
        assertEq(completed, false);
        assertEq(active, false);
    }
    
    function test_RevertWhen_DeadlinePassed() public {
        // Create milestone with short deadline
        vm.startPrank(user1);
        savings.createMilestone("Vacation Fund", MILESTONE_TARGET, block.timestamp + 1 days);
        
        // Warp to after deadline
        vm.warp(block.timestamp + 2 days);
        
        // Try to deposit - should revert with MilestoneDeadlinePassed error
        vm.expectRevert(MilestoneDeadlinePassed.selector);
        savings.deposit{value: DEPOSIT_AMOUNT}(0);
        vm.stopPrank();
    }
    
    function test_WithdrawAfterDeadline() public {
        // Create milestone
        vm.startPrank(user1);
        savings.createMilestone("Vacation Fund", MILESTONE_TARGET, block.timestamp + 7 days);
        
        // Deposit some funds
        savings.deposit{value: DEPOSIT_AMOUNT}(0);
        
        // Warp to after deadline
        vm.warp(block.timestamp + 8 days);
        
        // Withdraw funds after deadline
        savings.withdraw(0);
        vm.stopPrank();
        
        // Verify milestone status
        (,,,,bool completed, bool active) = savings.getMilestoneDetails(user1, 0);
        assertEq(completed, false);
        assertEq(active, false);
    }
    
    // Test bytes32ToString helper function
    function test_Bytes32ToString() public view {
        string memory original = "Test String";
        bytes32 asBytes32 = stringToBytes32(original);
        string memory converted = savings.bytes32ToString(asBytes32);
        
        // Compare strings by comparing their keccak256 hashes
        assertEq(keccak256(bytes(original)), keccak256(bytes(converted)));
    }
    
    // Receive function to allow the contract to receive ETH (needed for fees)
    receive() external payable {}
} 