#!/bin/bash

# Test script for Stabledash Cover Generator API v3
# This script tests the v3 cover image generation (Puppeteer-only version)

echo "🎨 Testing Stabledash Cover Generator API v3 (Puppeteer-only)..."
echo "📁 Output will be saved to: ./test/"

# Test the v3 cover image generation with your specific images
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789" \
  -d '{
    "background": "https://cdn.sanity.io/images/ukg9h63w/production/88debc8831cde9f90bde7c850cd33dcb99236cae-3840x2160.png?rect=79,0,3761,997&w=2000&fit=max&auto=format",
    "logo": "https://cdn.sanity.io/images/ukg9h63w/production/8d39a58a59e6166c91ace05796f7a2ad40828c49-81x26.svg",
    "quality": 100,
    "overlay": true,
    "gradient_intensity": 0.1,
    "size": "og",
    "brandcolor": "F82FB6",
    "watermark": true
  }' \
  https://stabledash-cover-generator.onrender.com/api/generate-cover-image-v3 \
  --output ./test/generated-cover-v3.jpg

echo "✅ V3 test completed! Check ./test/generated-cover-v3.jpg"

