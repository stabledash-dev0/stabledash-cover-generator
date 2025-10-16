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
    "logo": "https://cdn.sanity.io/images/ukg9h63w/production/02bb076c5ad291669e4de915192dbb77cb5f5b28-507x144.svg?w=2000&fit=max&auto=format",
    "quality": 90,
    "overlay": true,
    "gradient_intensity": 0.8,
    "size": "og",
    "brandcolor": "2B61FF"
  }' \
  http://localhost:3000/api/generate-cover-image-v2 \
  --output ./test/generated-cover-v2.jpg

echo "✅ V2 test completed! Check ./test/generated-cover-v2.jpg"
