# Stabledash Cover Generator - Deployment Guide

## V2 Generator Features

### New API Endpoint: `/api/generate-cover-image-v2`

**Enhanced Features:**
- ✅ **Perfect Logo Centering** - HTML2PNG approach for pixel-perfect positioning
- ✅ **Brand Color Gradient** - Custom hex color support with `brandcolor` parameter
- ✅ **Watermark Branding** - Optional Stabledash logo at bottom-center
- ✅ **200px Logo Size** - Balanced visibility
- ✅ **Professional Spacing** - Proper margins and positioning

### API Parameters

```json
{
  "background": "https://example.com/background.jpg",
  "logo": "https://example.com/logo.png",
  "quality": 90,
  "overlay": true,
  "gradient_intensity": 0.8,
  "size": "og",
  "brandcolor": "2B61FF",  // NEW: Hex color without #
  "watermark": true        // NEW: Enable watermark
}
```

### Deployment to Render

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `stabledash-dev0/stabledash-cover-generator`

2. **Configuration:**
   - **Name:** `stabledash-cover-generator-v2`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/test`

3. **Environment Variables:**
   - No additional environment variables needed
   - All configuration is handled via API parameters

### Testing the Deployment

```bash
# Test V2 endpoint
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
    "brandcolor": "2B61FF",
    "watermark": true
  }' \
  https://your-app-name.onrender.com/api/generate-cover-image-v2 \
  --output cover-v2.jpg
```

### Dependencies

- **Next.js 14** - Framework
- **Sharp** - Image processing
- **Puppeteer** - HTML2PNG rendering
- **Node-fetch** - HTTP requests

### Performance Notes

- **HTML2PNG** adds ~2-3 seconds to generation time
- **Fallback** to Sharp method if Puppeteer fails
- **Caching** enabled for generated images
- **Memory usage** optimized for Render's free tier
