#!/bin/bash

# API Test Script for Stashflow
# This script tests all major routes of the application

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api/v1"
EMAIL=""
PASSWORD=""
USER_NAME=""
TEST_TOKEN_ADDRESS="0x123456789012345678901234567890abcdef1234"

# Store auth tokens
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""

# Function to print colored output
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Function to check command success
check_result() {
  if [ $? -eq 0 ]; then
    print_message "$GREEN" "SUCCESS: $1"
  else
    print_message "$RED" "FAILED: $1"
    if [ "$2" = "exit" ]; then
      exit 1
    fi
  fi
}

# Function to make a request and extract values from response
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth_header=""
  
  if [ "$4" = "auth" ] && [ ! -z "$ACCESS_TOKEN" ]; then
    auth_header="-H \"Authorization: Bearer $ACCESS_TOKEN\""
  fi
  
  print_message "$YELLOW" "Executing: $method $endpoint"
  if [ ! -z "$data" ]; then
    echo "$data" | grep -v password | sed 's/^/Request Body: /'
  fi
  
  # Debug the full command
  local cmd="curl -s -X $method \"$BASE_URL$endpoint\" -H \"Content-Type: application/json\" $auth_header"
  if [ ! -z "$data" ]; then
    cmd="$cmd -d '$data'"
  fi
  
  print_message "$YELLOW" "Full curl command (sanitized):"
  echo "$cmd" | sed 's/Bearer [a-zA-Z0-9.]*\([^"]*\)/Bearer TOKEN\1/'
  
  # Execute the command
  local response=$(eval $cmd)
  
  # Save the response to a file for debugging
  echo "$response" > /tmp/api_response.json
  print_message "$YELLOW" "Response saved to /tmp/api_response.json"
  
  # Print a sanitized response (no tokens)
  local sanitized_response=$(echo "$response" | sed 's/"token":"[^"]*"/"token":"***"/g' | sed 's/"refreshToken":"[^"]*"/"refreshToken":"***"/g')
  print_message "$YELLOW" "Response (sanitized):"
  echo "$sanitized_response" | jq '.' 2>/dev/null || echo "$sanitized_response"
  
  # Return the full response
  echo "$response"
}

# Function to extract a field from JSON response
extract_field() {
  # Try different JSON formats
  # 1. Try standard format: "field":"value"
  local value=$(echo "$1" | grep -o "\"$2\":[^,}]*" | cut -d ':' -f2- | tr -d '"{} ')
  
  # 2. If that fails, try "field":value format (without quotes for value)
  if [ -z "$value" ]; then
    value=$(echo "$1" | grep -o "\"$2\":[^,}\"]*" | cut -d ':' -f2- | tr -d '"{} ')
  fi
  
  # 3. If that fails, try data.field format (for nested objects)
  if [ -z "$value" ]; then
    value=$(echo "$1" | grep -o "\"data\":{[^}]*\"$2\":[^,}]*" | grep -o "\"$2\":[^,}]*" | cut -d ':' -f2- | tr -d '"{} ')
  fi
  
  echo "$value"
}

# Prompt for test user information
setup_test_user() {
  echo "Enter email address for testing (must be valid for verification):"
  read EMAIL
  
  echo "Enter password for testing (min 8 characters):"
  read -s PASSWORD
  echo ""
  
  echo "Enter name for testing user:"
  read USER_NAME
  
  if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$USER_NAME" ]; then
    print_message "$RED" "All fields are required"
    exit 1
  fi
}

# 1. Test User Registration (Signup)
test_registration() {
  print_message "$YELLOW" "=== Testing User Registration (Signup) ==="
  
  local payload="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$USER_NAME\"}"
  local response=$(make_request "POST" "/users/signup" "$payload")
  
  # Debug: Print full response
  print_message "$YELLOW" "Full response:"
  echo "$response"
  
  # Check if we get a success field directly
  local success=$(extract_field "$response" "success")
  print_message "$YELLOW" "Extracted success value: '$success'"
  
  # If no success field, check if we got any tokens which would indicate success
  if [ -z "$success" ] || [ "$success" != "true" ]; then
    # Try different ways to extract tokens
    ACCESS_TOKEN=$(echo "$response" | grep -o '"token":[^,}]*' | cut -d ':' -f2- | tr -d '"{} ')
    if [ -z "$ACCESS_TOKEN" ]; then
      ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":[^,}]*' | cut -d ':' -f2- | tr -d '"{} ')
    fi
    if [ -z "$ACCESS_TOKEN" ]; then
      ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d '"' -f4)
    fi
    if [ -z "$ACCESS_TOKEN" ]; then
      ACCESS_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d '"' -f4)
    fi
    
    REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":[^,}]*' | cut -d ':' -f2- | tr -d '"{} ')
    if [ -z "$REFRESH_TOKEN" ]; then
      REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*' | cut -d '"' -f4)
    fi
    
    # If we found tokens, consider it a success
    if [ ! -z "$ACCESS_TOKEN" ] && [ ! -z "$REFRESH_TOKEN" ]; then
      success="true"
    fi
  fi
  
  if [ "$success" = "true" ] || [ ! -z "$ACCESS_TOKEN" ]; then
    print_message "$GREEN" "Registration successful! Extracting tokens..."
    
    # If tokens weren't already extracted, try to extract them now
    if [ -z "$ACCESS_TOKEN" ]; then
      ACCESS_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d '"' -f4)
      if [ -z "$ACCESS_TOKEN" ]; then
        ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d '"' -f4)
      fi
    fi
    
    if [ -z "$REFRESH_TOKEN" ]; then
      REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*' | cut -d '"' -f4)
    fi
    
    USER_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d '"' -f4)
    if [ -z "$USER_ID" ]; then
      USER_ID=$(echo "$response" | grep -o '"userId":"[^"]*' | cut -d '"' -f4)
    fi
    
    # Debug: Print extracted tokens
    print_message "$YELLOW" "Extracted ACCESS_TOKEN: '${ACCESS_TOKEN:0:10}...'"
    print_message "$YELLOW" "Extracted REFRESH_TOKEN: '${REFRESH_TOKEN:0:10}...'"
    if [ ! -z "$USER_ID" ]; then
      print_message "$YELLOW" "Extracted USER_ID: '$USER_ID'"
    fi
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
      print_message "$RED" "Failed to extract tokens from signup response"
      print_message "$YELLOW" "Do you want to manually enter tokens and continue testing? (y/n)"
      read CONTINUE
      
      if [ "$CONTINUE" = "y" ]; then
        echo "Enter ACCESS_TOKEN:"
        read ACCESS_TOKEN
        
        echo "Enter REFRESH_TOKEN:"
        read REFRESH_TOKEN
        
        echo "Enter USER_ID (optional):"
        read USER_ID
        
        if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
          print_message "$RED" "ACCESS_TOKEN and REFRESH_TOKEN are required to continue"
          return 1
        fi
        
        print_message "$GREEN" "Continuing with provided tokens"
        return 0
      else
        return 1
      fi
    else
      print_message "$GREEN" "Tokens received!"
      if [ ! -z "$USER_ID" ]; then
        print_message "$YELLOW" "User ID: $USER_ID"
      fi
      return 0
    fi
  else
    print_message "$RED" "Registration failed. Check response format."
    
    # Add option to continue testing even if registration "fails"
    echo "Do you want to manually enter tokens and continue testing? (y/n)"
    read CONTINUE
    
    if [ "$CONTINUE" = "y" ]; then
      echo "Enter ACCESS_TOKEN:"
      read ACCESS_TOKEN
      
      echo "Enter REFRESH_TOKEN:"
      read REFRESH_TOKEN
      
      echo "Enter USER_ID (optional):"
      read USER_ID
      
      if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
        print_message "$RED" "ACCESS_TOKEN and REFRESH_TOKEN are required to continue"
        return 1
      fi
      
      print_message "$GREEN" "Continuing with provided tokens"
      return 0
    else
      return 1
    fi
  fi
}

# 2. Test Email Verification
test_verification() {
  print_message "$YELLOW" "=== Testing Email Verification (Requires Auth) ==="
  
  if [ -z "$ACCESS_TOKEN" ]; then
    print_message "$RED" "No access token available. Cannot verify email."
    echo "Do you want to enter an access token manually? (y/n)"
    read ENTER_TOKEN
    
    if [ "$ENTER_TOKEN" = "y" ]; then
      echo "Enter ACCESS_TOKEN:"
      read ACCESS_TOKEN
    else
      print_message "$RED" "Skipping email verification"
      return 1
    fi
  fi
  
  print_message "$YELLOW" "Using access token: ${ACCESS_TOKEN:0:10}..."
  
  echo "Enter the verification code sent to $EMAIL:"
  read VERIFICATION_CODE
  
  if [ -z "$VERIFICATION_CODE" ]; then
    print_message "$RED" "Verification code is required"
    return 1
  fi
  
  local payload="{\"code\":\"$VERIFICATION_CODE\"}"
  print_message "$YELLOW" "Sending verification request with code: $VERIFICATION_CODE"
  print_message "$YELLOW" "Auth header will be set with token: ${ACCESS_TOKEN:0:10}..."
  
  # Debug curl command that will be executed
  local auth_header="-H \"Authorization: Bearer $ACCESS_TOKEN\""
  local cmd="curl -s -X POST \"$BASE_URL/users/email/verify\" \
       -H \"Content-Type: application/json\" \
       $auth_header \
       -d '$payload'"
  
  print_message "$YELLOW" "Executing command:"
  echo "$cmd"
  
  local response=$(make_request "POST" "/users/email/verify" "$payload" "auth")
  
  # Debug full response
  print_message "$YELLOW" "Full verification response:"
  echo "$response"
  
  local success=$(extract_field "$response" "success")
  print_message "$YELLOW" "Extracted success value: '$success'"
  
  # Check for "success": true in the response
  if [[ "$success" == *"true"* ]]; then
    local message=$(extract_field "$response" "message")
    print_message "$GREEN" "Email verification successful! Message: $message"
    return 0
  else
    print_message "$RED" "Email verification failed."
    
    echo "Do you want to request a new verification code? (y/n)"
    read RESEND
    
    if [ "$RESEND" = "y" ]; then
      local resend_response=$(make_request "POST" "/users/email/resend" "{}" "auth")
      print_message "$YELLOW" "New verification code sent. Check your email."
      test_verification
    else
      print_message "$YELLOW" "Continuing without email verification"
      return 1
    fi
  fi
}

# 3. Test Login
test_login() {
  print_message "$YELLOW" "=== Testing Login ==="
  
  local payload="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
  print_message "$YELLOW" "Sending login request for email: $EMAIL"
  local response=$(make_request "POST" "/users/login" "$payload")
  
  # Debug full response
  print_message "$YELLOW" "Full login response:"
  echo "$response"
  
  local success=$(extract_field "$response" "success")
  print_message "$YELLOW" "Extracted success value: '$success'"
  
  # Check for "success": true in the response
  if [[ "$success" == *"true"* ]]; then
    # Try to extract tokens in different formats
    ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d '"' -f4)
    if [ -z "$ACCESS_TOKEN" ]; then
      ACCESS_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d '"' -f4)
    fi
    
    REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*' | cut -d '"' -f4)
    
    # Debug: Print extracted tokens
    print_message "$YELLOW" "Extracted ACCESS_TOKEN: '${ACCESS_TOKEN:0:10}...'"
    print_message "$YELLOW" "Extracted REFRESH_TOKEN: '${REFRESH_TOKEN:0:10}...'"
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
      print_message "$RED" "Failed to extract tokens from login response"
      return 1
    fi
    
    print_message "$GREEN" "Login successful! Tokens received."
    return 0
  else
    print_message "$RED" "Login failed. Response: $response"
    return 1
  fi
}

# 4. Test Get User Profile
test_get_profile() {
  print_message "$YELLOW" "=== Testing Get User Profile ==="
  
  local response=$(make_request "GET" "/users/me" "{}" "auth")
  local success=$(extract_field "$response" "success")
  
  if [ "$success" = "true" ]; then
    print_message "$GREEN" "Successfully retrieved user profile!"
  else
    print_message "$RED" "Failed to retrieve user profile."
  fi
}

# 5. Test Token Management
test_token_management() {
  print_message "$YELLOW" "=== Testing Token Management ==="
  
  # 5.1 Create a new token
  print_message "$YELLOW" "Creating a new token..."
  local create_payload="{\"address\":\"$TEST_TOKEN_ADDRESS\",\"name\":\"Test Token\",\"symbol\":\"TEST\",\"decimals\":18,\"image\":\"https://example.com/test.png\"}"
  local create_response=$(make_request "POST" "/tokens" "$create_payload" "auth")
  
  local create_success=$(extract_field "$create_response" "success")
  if [ "$create_success" = "true" ]; then
    local token_id=$(echo "$create_response" | grep -o '"id":"[^"]*' | cut -d '"' -f4)
    print_message "$GREEN" "Token created successfully! ID: $token_id"
    
    # 5.2 Get all tokens
    print_message "$YELLOW" "Getting all tokens..."
    local get_all_response=$(make_request "GET" "/tokens" "{}" "auth")
    check_result "Get all tokens"
    
    # 5.3 Get token by ID
    print_message "$YELLOW" "Getting token by ID..."
    local get_response=$(make_request "GET" "/tokens/$token_id" "{}" "auth")
    check_result "Get token by ID"
    
    # 5.4 Update token
    print_message "$YELLOW" "Updating token..."
    local update_payload="{\"name\":\"Updated Test Token\",\"symbol\":\"UTEST\"}"
    local update_response=$(make_request "PUT" "/tokens/$token_id" "$update_payload" "auth")
    check_result "Update token"
    
    # 5.5 Delete token
    print_message "$YELLOW" "Deleting token..."
    local delete_response=$(make_request "DELETE" "/tokens/$token_id" "{}" "auth")
    check_result "Delete token"
  else
    print_message "$RED" "Failed to create token"
  fi
}

# 6. Test Role Management
test_role_management() {
  print_message "$YELLOW" "=== Testing Role Management ==="
  
  # 6.1 Get all roles
  print_message "$YELLOW" "Getting all roles..."
  local get_all_response=$(make_request "GET" "/roles" "{}" "auth")
  check_result "Get all roles"
  
  # 6.2 Get all permissions
  print_message "$YELLOW" "Getting all permissions..."
  local permissions_response=$(make_request "GET" "/roles/permissions/all" "{}" "auth")
  check_result "Get all permissions"
  
  # Create a test role
  print_message "$YELLOW" "Creating a new role..."
  local create_payload="{\"name\":\"Test Role\",\"description\":\"Role for testing\",\"permissionIds\":[\"token:read\",\"token:create\"]}"
  local create_response=$(make_request "POST" "/roles" "$create_payload" "auth")
  
  local create_success=$(extract_field "$create_response" "success")
  if [ "$create_success" = "true" ]; then
    local role_id=$(echo "$create_response" | grep -o '"id":"[^"]*' | cut -d '"' -f4)
    print_message "$GREEN" "Role created successfully! ID: $role_id"
    
    # Get role by ID
    print_message "$YELLOW" "Getting role by ID..."
    local get_response=$(make_request "GET" "/roles/$role_id" "{}" "auth")
    check_result "Get role by ID"
    
    # Update role
    print_message "$YELLOW" "Updating role..."
    local update_payload="{\"description\":\"Updated test role\",\"permissionIds\":[\"token:read\",\"token:create\",\"token:update\"]}"
    local update_response=$(make_request "PUT" "/roles/$role_id" "$update_payload" "auth")
    check_result "Update role"
    
    # Delete role
    print_message "$YELLOW" "Deleting role..."
    local delete_response=$(make_request "DELETE" "/roles/$role_id" "{}" "auth")
    check_result "Delete role"
  else
    print_message "$RED" "Failed to create role"
  fi
}

# 7. Test Milestone Management
test_milestone_management() {
  print_message "$YELLOW" "=== Testing Milestone Management ==="
  
  # 7.1 Create a milestone
  print_message "$YELLOW" "Creating a new milestone..."
  local current_date=$(date +%Y-%m-%d)
  local end_date=$(date -v+30d +%Y-%m-%d 2>/dev/null || date -d "+30 days" +%Y-%m-%d)
  
  local create_payload="{\"name\":\"Test Milestone\",\"targetAmount\":1000,\"startDate\":\"$current_date\",\"endDate\":\"$end_date\",\"description\":\"Milestone for testing\",\"tokenAddress\":\"$TEST_TOKEN_ADDRESS\"}"
  local create_response=$(make_request "POST" "/milestones" "$create_payload" "auth")
  
  local create_success=$(extract_field "$create_response" "success")
  if [ "$create_success" = "true" ]; then
    local milestone_id=$(echo "$create_response" | grep -o '"id":"[^"]*' | cut -d '"' -f4)
    print_message "$GREEN" "Milestone created successfully! ID: $milestone_id"
    
    # 7.2 Get all milestones
    print_message "$YELLOW" "Getting all milestones..."
    local get_all_response=$(make_request "GET" "/milestones" "{}" "auth")
    check_result "Get all milestones"
    
    # 7.3 Get milestone by ID
    print_message "$YELLOW" "Getting milestone by ID..."
    local get_response=$(make_request "GET" "/milestones/$milestone_id" "{}" "auth")
    check_result "Get milestone by ID"
    
    # 7.4 Update milestone
    print_message "$YELLOW" "Updating milestone..."
    local update_payload="{\"name\":\"Updated Test Milestone\",\"targetAmount\":1500}"
    local update_response=$(make_request "PUT" "/milestones/$milestone_id" "$update_payload" "auth")
    check_result "Update milestone"
    
    # 7.5 Delete milestone
    print_message "$YELLOW" "Deleting milestone..."
    local delete_response=$(make_request "DELETE" "/milestones/$milestone_id" "{}" "auth")
    check_result "Delete milestone"
  else
    print_message "$RED" "Failed to create milestone"
  fi
}

# 8. Test Token Refresh
test_token_refresh() {
  print_message "$YELLOW" "=== Testing Token Refresh ==="
  
  echo "Enter a 6-digit PIN for device authentication (can be any 6 digits for testing):"
  read PIN
  
  if [ -z "$PIN" ] || [ ${#PIN} -ne 6 ] || ! [[ $PIN =~ ^[0-9]+$ ]]; then
    print_message "$RED" "PIN must be exactly 6 digits"
    test_token_refresh
    return
  fi
  
  # First set the PIN
  local set_pin_payload="{\"pin\":\"$PIN\"}"
  local set_pin_response=$(make_request "POST" "/users/device/pin" "$set_pin_payload" "auth")
  check_result "Set device PIN"
  
  # Use refresh token to get new access token
  local refresh_payload="{\"refreshToken\":\"$REFRESH_TOKEN\",\"pin\":\"$PIN\"}"
  local refresh_response=$(make_request "POST" "/users/token/refresh" "$refresh_payload")
  
  local success=$(extract_field "$refresh_response" "success")
  
  if [ "$success" = "true" ]; then
    local new_token=$(echo "$refresh_response" | grep -o '"token":"[^"]*' | cut -d '"' -f4)
    
    if [ -z "$new_token" ]; then
      print_message "$RED" "Failed to extract new access token"
    else
      ACCESS_TOKEN=$new_token
      print_message "$GREEN" "Token refresh successful! New access token received."
    fi
  else
    print_message "$RED" "Token refresh failed."
  fi
}

# 9. Test Logout
test_logout() {
  print_message "$YELLOW" "=== Testing Logout ==="
  
  local response=$(make_request "POST" "/users/logout" "{}" "auth")
  local success=$(extract_field "$response" "success")
  
  if [ "$success" = "true" ]; then
    print_message "$GREEN" "Logout successful!"
    ACCESS_TOKEN=""
    REFRESH_TOKEN=""
  else
    print_message "$RED" "Logout failed."
  fi
}

# Main function to run all tests
main() {
  if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$USER_NAME" ]; then
    setup_test_user
  fi
  
  # Test registration first
  test_registration
  
  # Store registration status
  local reg_status=$?
  
  # Continue with verification if registration succeeded or user provided tokens manually
  if [ "$reg_status" -eq 0 ] || [ ! -z "$ACCESS_TOKEN" ]; then
    # Test email verification
    test_verification
    
    # Store verification status but continue regardless
    local verify_status=$?
    
    # Ask if user wants to test login
    echo "Do you want to test login? (y/n)"
    read TEST_LOGIN
    
    if [ "$TEST_LOGIN" = "y" ]; then
      test_login
    fi
    
    # Test user profile
    echo "Do you want to test fetching user profile? (y/n)"
    read TEST_PROFILE
    
    if [ "$TEST_PROFILE" = "y" ]; then
      test_get_profile
    fi
    
    # Test token management
    echo "Do you want to test token management? (y/n)"
    read TEST_TOKENS
    
    if [ "$TEST_TOKENS" = "y" ]; then
      test_token_management
    fi
    
    # Test role management
    echo "Do you want to test role management? (y/n)"
    read TEST_ROLES
    
    if [ "$TEST_ROLES" = "y" ]; then
      test_role_management
    fi
    
    # Test milestone management
    echo "Do you want to test milestone management? (y/n)"
    read TEST_MILESTONES
    
    if [ "$TEST_MILESTONES" = "y" ]; then
      test_milestone_management
    fi
    
    # Test token refresh
    echo "Do you want to test token refresh with PIN? (y/n)"
    read TEST_REFRESH
    
    if [ "$TEST_REFRESH" = "y" ]; then
      test_token_refresh
    fi
    
    # Test logout
    echo "Do you want to test logout? (y/n)"
    read TEST_LOGOUT
    
    if [ "$TEST_LOGOUT" = "y" ]; then
      test_logout
    fi
  else
    print_message "$RED" "Registration failed and no tokens provided. Cannot proceed with tests."
  fi
  
  print_message "$GREEN" "===== API Testing Complete ====="
}

# Run the main function
main 