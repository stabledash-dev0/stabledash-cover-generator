#!/bin/bash

# Test script for Stabledash Event Data Extraction API
# This script tests the event data extraction from URLs

echo "🔍 Testing Stabledash Event Data Extraction API..."
echo "📁 Output will be displayed in terminal"

# Test with a real event URL (SmartCon)
echo "Testing SmartCon event extraction..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789" \
  -d '{
    "url": "https://smartcon.chain.link/"
  }' \
  http://localhost:3000/api/extract-event-data | jq .

echo -e "\n\nTesting ETHCC event extraction..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789" \
  -d '{
    "url": "https://ethcc.io/"
  }' \
  http://localhost:3000/api/extract-event-data | jq .

echo "✅ Test completed!"
