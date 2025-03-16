// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {Stashflow} from "../src/Stashflow.sol";
import {TestToken} from "../src/TestToken.sol";

contract DeployAndSetupStashflowScript is Script {
    Stashflow public stashflow;
    TestToken public testToken;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Step 1: Deploy Stashflow contract
        stashflow = new Stashflow();
        console.log("Stashflow deployed at: %s", address(stashflow));

        // Step 2: Deploy TestToken with initial parameters
        testToken = new TestToken("StashStableToken", "STST", 6, 1000000);
        console.log("TestToken deployed at: %s", address(testToken));

        // Step 3: Mint some tokens to the deployer
        testToken.mint(msg.sender, 1000000 * 10**6);
        console.log("Minted 1,000,000 STST tokens to: %s", msg.sender);

        // Step 4: Add the test token to the allowed tokens list in Stashflow
        stashflow.addAllowedToken(address(testToken));
        console.log("Added token %s to Stashflow allowed tokens", address(testToken));
        
        // Step 5: Verify the token was added successfully
        bool isAllowed = stashflow.isTokenAllowed(address(testToken));
        console.log("Token is allowed: %s", isAllowed ? "true" : "false");

        vm.stopBroadcast();
    }
} 