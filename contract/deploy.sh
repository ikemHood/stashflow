#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one based on .env.sample"
    exit 1
fi

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY is not set in .env file"
    exit 1
fi

if [ -z "$SEPOLIABASE_RPC_URL" ]; then
    echo "Error: SEPOLIABASE_RPC_URL is not set in .env file"
    exit 1
fi

# Deploy contracts and set up token allowances in a single script
echo "Deploying and setting up Stashflow ecosystem on Sepoliabase..."
forge script script/DeployAndSetupStashflow.s.sol:DeployAndSetupStashflowScript \
    --rpc-url $SEPOLIABASE_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "Deployment and setup successful! Your Stashflow ecosystem is ready to use."
else
    echo "Deployment failed!"
    exit 1
fi 