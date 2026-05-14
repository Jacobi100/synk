#!/bin/bash
# Mock Payment Trigger for Hackathon Demo
# Run this script to simulate a successful Squad payment
# Usage: ./scripts/trigger-mock-payment.sh MOCKVA1234567890 [amount]

VA_NUMBER=$1
AMOUNT=${2:-20000}

if [ -z "$VA_NUMBER" ]; then
  echo "Error: Please provide a Virtual Account Number."
  echo "Example: ./scripts/trigger-mock-payment.sh MOCKVA1715638101 20000"
  exit 1
fi

if [[ "$VA_NUMBER" == MOCKVA* ]]; then
  echo "Detected mock Virtual Account number."
  echo "Triggering local webhook directly for $VA_NUMBER..."
  
  curl -X POST http://localhost:3000/api/webhooks/squad \
    -H "Content-Type: application/json" \
    -d "{
      \"Event\": \"charge_completed\",
      \"virtual_account_number\": \"$VA_NUMBER\",
      \"transaction_reference\": \"MOCK_REF_${VA_NUMBER}\",
      \"status\": \"success\"
    }"
    
  echo -e "\n\nLocal Webhook triggered! The bounty should now be marked as 'paid'."
  exit 0
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
  SQUAD_SECRET_KEY=$(grep '^SQUAD_SECRET_KEY=' .env.local | cut -d '=' -f 2- | tr -d \" | tr -d \')
fi

if [ -z "$SQUAD_SECRET_KEY" ]; then
  echo "Error: SQUAD_SECRET_KEY not found in .env.local"
  echo "Please make sure it's set in your .env.local file."
  exit 1
fi

echo "Triggering Squad simulated payment for Virtual Account: $VA_NUMBER with amount $AMOUNT kobo..."

curl -X POST https://sandbox-api-d.squadco.com/virtual-account/simulate/payment \
  -H "Authorization: Bearer $SQUAD_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"virtual_account_number\": \"$VA_NUMBER\",
    \"amount\": \"$AMOUNT\"
  }"

echo -e "\n\nWebhook should be triggered by Squad shortly! Make sure your Squad dashboard is configured to send webhooks to your local environment (e.g., via ngrok)."
