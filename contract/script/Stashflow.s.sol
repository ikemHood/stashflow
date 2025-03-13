// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {Stashflow} from "../src/Stashflow.sol";

contract StashflowScript is Script {
    Stashflow public stashflow;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        stashflow = new Stashflow();
        console.log("Stashflow deployed at: %s", address(stashflow));

        vm.stopBroadcast();
    }
} 