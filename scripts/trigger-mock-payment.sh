#!/bin/bash
# Mock Payment Trigger for Hackathon Demo
# Run this script to simulate a successful Squad payment
# Usage: ./scripts/trigger-mock-payment.sh MOCKVA1234567890

VA_NUMBER=$1

if [ -z "$VA_NUMBER" ]; then
  echo "Error: Please provide a Virtual Account Number."
  echo "Example: ./scripts/trigger-mock-payment.sh MOCKVA1715638101"
  exit 1
fi

echo "Triggering mock payment for Virtual Account: $VA_NUMBER..."

curl -X POST http://localhost:3000/api/webhooks/squad \
  -H "Content-Type: application/json" \
  -d "{
    \"Event\": \"charge_completed\",
    \"virtual_account_number\": \"$VA_NUMBER\",
    \"transaction_reference\": \"MOCK_REF_${VA_NUMBER}\",
    \"status\": \"success\"
  }"

echo -e "\n\nWebhook triggered! The bounty should now be marked as 'paid'."
