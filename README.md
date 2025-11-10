# Stabledash Media Platform

A Next.js application for media processing and analytics, featuring a user-friendly interface for AI-powered event data extraction and cover image generation using Sharp.

## Features

- **Event Data Extraction**: AI-powered extraction of structured event data from URLs
- **Cover Image Generation**: Composite logos onto background images
- **Texture Overlay**: Add texture overlays between background and logo
- **Gradient Overlay**: Black to transparent gradient from bottom to top
- **Configurable Parameters**: Logo size, padding, image quality, and gradient intensity
- **Bearer Token Authentication**: Secure API access
- **Optimized for Render**: Docker configuration with Sharp dependencies

## API Endpoints

### POST `/api/extract-event-data`

Extracts structured event data from event webpage URLs using AI-powered analysis.

**Headers:**
```
Authorization: Bearer stabledash_cover_gen_2025_secure_xyz789
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://example.com/events/sample-event"
}
```

**Response:**
```json
{
  "eventName": "Sample Tech Summit 2025",
  "startDate": "2025-11-04",
  "endDate": "2025-11-05",
  "city": "New York",
  "country": "USA",
  "region": "united-states",
  "description": "Where the brightest minds in blockchain meet to discuss the future of finance in Web3, finance, and government.",
  "coverImageUrl": "https://example.com/assets/hero-summit.jpg",
  "organizingCompany": "Chainlink",
  "organizers": ["Chainlink Labs"],
  "sponsors": ["UBS", "Tradeweb", "Lido", "Apex", "Wisdomtree", "Aave Labs"],
  "iconUrl": "https://cdn.prod.website-files.com/.../Favicon.png",
  "logoUrl": "",
  "socialLinks": {
    "twitter": "https://twitter.com/chainlink",
    "youtube": "https://www.youtube.com/channel/UCnjkrlqaWEBSnKZQ71gdyFA",
    "instagram": "https://www.instagram.com/okx_official/?hl=en",
    "facebook": "http://www.facebook.com/swift",
    "tiktok": "https://www.tiktok.com/@okx?lang=en"
  },
  "officialUrl": "https://example.com/events/sample-event"
}
```

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
  "overlay": true,
  "gradient_intensity": 0.8
}
```

**Parameters:**
- `background` (required): URL of the background image
- `logo` (required): URL of the logo image
- `logo_width_pct` (optional): Logo width as percentage of background width (default: 0.30)
- `pad_pct` (optional): Padding as percentage of background width (default: 0.05)
- `quality` (optional): JPEG quality 1-100 (default: 90)
- `overlay` (optional): Enable texture overlay (default: true)
- `gradient_intensity` (optional): Gradient overlay intensity 0.0-1.0 (default: 0.8)

**Response:** JPEG image with appropriate headers

### GET `/api/test`

Health check endpoint.

**Response:**
```json
{
  "message": "API is working!"
}
```

## Web Interface

Visit the root URL (`/`) to access the user-friendly web interface for event data extraction. The interface provides:

- **URL Input**: Enter any event website URL
- **Real-time Extraction**: AI-powered analysis of event data
- **Rich Display**: Formatted results with images, sponsors, and organizers
- **Sample URLs**: Quick access to popular event websites
- **Error Handling**: Clear feedback for invalid URLs or extraction failures

**Features:**
- Clean, responsive design with inline CSS
- Loading states and error messages
- Image previews for event icons, logos, and cover images
- Tag-style display for sponsors and organizers
- Platform-specific social media buttons with icons and colors
- Smart social link validation and selection
- Statistics summary showing social platforms, sponsors, and organizers
- Success indicators and interactive elements
- Raw JSON data view with copy-to-clipboard functionality
- Direct links to event websites and images
- Graceful fallback to basic extraction when AI is unavailable

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
    "overlay": true,
    "gradient_intensity": 0.8
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
