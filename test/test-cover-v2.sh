#!/bin/bash

# Test script for Stabledash Cover Generator API v2
# This script tests the v2 cover image generation with the provided Sanity images

echo "🎨 Testing Stabledash Cover Generator API v2..."
echo "📁 Output will be saved to: ./test/"

# Test the v2 cover image generation with your specific images
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789" \
  -d '{
    "background": "https://cdn.sanity.io/images/ukg9h63w/production/88debc8831cde9f90bde7c850cd33dcb99236cae-3840x2160.png?rect=79,0,3761,997&w=2000&fit=max&auto=format",
    "logo": "https://cdn.sanity.io/images/ukg9h63w/production/2b9e5e9c619849b6eb24bd844c88a7de746b99dc-475x122.svg",
    "quality": 100,
    "overlay": true,
    "gradient_intensity": 0.1,
    "size": "og",
    "brandcolor": "2B61FF",
    "watermark": true
  }' \
  http://stabledash-cover-generator.onrender.com/api/generate-cover-image-v2 \
  --output ./test/generated-cover-v2.jpg

echo "✅ V2 test completed! Check ./test/generated-cover-v2.jpg"
