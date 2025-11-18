#!/bin/bash

# Test script for Stabledash Cover Generator API - Contributor version
# This script tests the contributor cover image generation

echo "🎨 Testing Stabledash Cover Generator API - Contributor version..."
echo "📁 Output will be saved to: ./test/"

# Test the contributor cover image generation
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789" \
  -d '{
    "background": "https://cdn.sanity.io/images/ukg9h63w/production/4a71727cf80170bcdac257055409a0e7d71ee6a4-6000x3376.jpg?w=2000&fit=max&auto=format",
    "author_cover_image_url": "https://cdn.sanity.io/images/ukg9h63w/production/5397f31ec5167a0c31bed7bc40e696dcd90228b4-538x516.png?w=2000&fit=max&auto=format",
    "author_name": "Zach Fowler",
    "logo": "https://cdn.sanity.io/images/ukg9h63w/production/8d39a58a59e6166c91ace05796f7a2ad40828c49-81x26.svg",
    "quality": 100,
    "overlay": true,
    "gradient_intensity": 0.1,
    "size": "hero",
    "brandcolor": "000000",
    "watermark": true
  }' \
  http://localhost:3000/api/generate-cover-image-contributor \
  --output ./test/generated-cover-contributor.jpg

echo "✅ Contributor test completed! Check ./test/generated-cover-contributor.jpg"

