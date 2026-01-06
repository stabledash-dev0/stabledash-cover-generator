#!/bin/bash

# Test script for Railway deployment
# Tests the v3 cover image generation endpoint

RAILWAY_URL="${RAILWAY_URL:-https://stabledash-cover-generator.up.railway.app}"
AUTH_TOKEN="stabledash_cover_gen_2025_secure_xyz789"

echo "🚂 Testing Stabledash Cover Generator on Railway..."
echo "📍 URL: $RAILWAY_URL"
echo "📁 Output will be saved to: ./test/"
echo ""

# Test the v3 cover image generation
echo "📸 Testing generate-cover-image-v3 endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "background": "https://cdn.sanity.io/images/ukg9h63w/production/585a2090f83d9a895c685f8b47f6036214328f45-1280x1920.png?w=2000&fit=max&fm=jpg&q=90",
    "logo": "https://cdn.sanity.io/images/ukg9h63w/production/68c22bad7ab10832ad33f970e00a0cae51fdfc83-3518x602.svg?w=2000&fit=max&fm=png&dpr=2",
    "quality": 90,
    "size": "og",
    "brandcolor": "9391FE",
    "watermark": true
  }' \
  "$RAILWAY_URL/api/generate-cover-image-v3" \
  --output ./test/generated-cover-v3-railway.jpg \
  --write-out "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n"

if [ $? -eq 0 ]; then
  echo "✅ V3 test completed! Check ./test/generated-cover-v3-railway.jpg"
  file ./test/generated-cover-v3-railway.jpg
else
  echo "❌ Test failed!"
  exit 1
fi

