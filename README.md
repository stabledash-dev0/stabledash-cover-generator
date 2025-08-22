# Stabledash Cover Image Generator

An API-only Next.js application that generates cover images using Sharp, with support for background images, logos, and texture overlays.

## Features

- **Cover Image Generation**: Composite logos onto background images
- **Texture Overlay**: Add texture overlays between background and logo
- **Configurable Parameters**: Logo size, padding, and image quality
- **Bearer Token Authentication**: Secure API access
- **Optimized for Render**: Docker configuration with Sharp dependencies

## API Endpoints

### POST `/api/generate-cover-image`

Generates a cover image by compositing a logo onto a background image with optional texture overlay.

**Headers:**
```
Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789
Content-Type: application/json
```

**Request Body:**
```json
{
  "background": "https://example.com/background.jpg",
  "logo": "https://example.com/logo.png",
  "logo_width_pct": 0.30,
  "pad_pct": 0.05,
  "quality": 90,
  "overlay": true
}
```

**Parameters:**
- `background` (required): URL of the background image
- `logo` (required): URL of the logo image
- `logo_width_pct` (optional): Logo width as percentage of background width (default: 0.30)
- `pad_pct` (optional): Padding as percentage of background width (default: 0.05)
- `quality` (optional): JPEG quality 1-100 (default: 90)
- `overlay` (optional): Enable texture overlay (default: true)

**Response:** JPEG image with appropriate headers

### GET `/api/test`

Health check endpoint.

**Response:**
```json
{
  "message": "API is working!"
}
```

## Example Usage

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789" \
  -d '{
    "background": "https://ejfcjiyxyifxjrmkchjx.supabase.co/storage/v1/object/public/backgrounds/bg1.jpg",
    "logo": "https://ejfcjiyxyifxjrmkchjx.supabase.co/storage/v1/object/public/logos/coinbase.png",
    "logo_width_pct": 0.30,
    "pad_pct": 0.05,
    "quality": 90,
    "overlay": true
  }' \
  "https://your-render-url.onrender.com/api/generate-cover-image" \
  --output cover-image.jpg
```

## Deployment

### Render (Recommended)

1. Fork or clone this repository
2. Connect to Render dashboard
3. Create new Web Service
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/test`

### Local Development

```bash
npm install
npm run dev
```

## Architecture

- **Framework**: Next.js 14 with Pages Router
- **Image Processing**: Sharp library
- **Deployment**: Render with Docker
- **Authentication**: Bearer token
- **API**: RESTful endpoints

## Security

- Bearer token authentication required for image generation
- Input validation for all parameters
- Error handling for failed image fetches
- Secure headers and caching configuration
