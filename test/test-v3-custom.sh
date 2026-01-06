#!/bin/bash

# Test script for v3 API with custom parameters
# Tests the v3 cover image generation endpoint with specific background, logo, and brand color

RAILWAY_URL="${RAILWAY_URL:-https://stabledash-cover-generator.up.railway.app}"
AUTH_TOKEN="stabledash_cover_gen_2025_secure_xyz789"

echo "🎨 Testing Stabledash Cover Generator v3 with custom parameters..."
echo "📍 URL: $RAILWAY_URL"
echo "📁 Output will be saved to: ./test/generated-cover-v3-custom.jpg"
echo ""

# Test the v3 cover image generation with your specific parameters
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "background": "https://cdn.sanity.io/images/ukg9h63w/production/3eb33983fdd0e0316552ef4d1039856251b011be-735x487.jpg?w=2000&fit=max&fm=jpg&q=90",
    "logo": "https://cdn.sanity.io/images/ukg9h63w/production/6e9a4f41ebf0cda823df72f1162dd3ce25f8eb38-1432x369.svg?w=2000&fit=max&fm=png&dpr=2",
    "quality": 100,
    "size": "og",
    "brandcolor": "D0DB89",
    "watermark": true
  }' \
  "$RAILWAY_URL/api/generate-cover-image-v3" \
  --output ./test/generated-cover-v3-custom.jpg \
  --write-out "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  --fail-with-body

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Test completed successfully!"
  echo "📸 Check ./test/generated-cover-v3-custom.jpg"
  file ./test/generated-cover-v3-custom.jpg
else
  echo ""
  echo "❌ Test failed! Check the output above for error details."
  exit 1
fi

