import { NextApiRequest, NextApiResponse } from 'next'
import sharp from 'sharp'

interface CoverImageRequest {
  background: string
  logo: string
  logo_width_pct: number
  quality: number
  overlay?: string | boolean
  gradient_intensity?: number
  size?: 'hero' | 'thumbnail' | 'og' | 'custom'
  width?: number
  height?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Set CORS headers for POST requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  try {
    // Check authorization
    const authHeader = req.headers.authorization
    if (authHeader !== 'Bearer stabledash_cover_gen_2025_secure_xyz789') {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const body: CoverImageRequest = req.body

    // Validate required fields
    if (!body.background || !body.logo) {
      return res.status(400).json({
        error: 'Missing required fields: background and logo'
      })
    }

    // Set defaults for optional fields
    const logoWidthPct = body.logo_width_pct ?? 0.30
    const quality = body.quality ?? 90
    const useOverlay = body.overlay !== false
    const gradientIntensity = body.gradient_intensity ?? 0.8

    // Handle size parameter
    const size = body.size ?? 'custom'
    const customWidth = body.width
    const customHeight = body.height

    // Define size presets
    const sizePresets = {
      hero: { width: 1120, height: 400 },
      thumbnail: { width: 1280, height: 720 }, // 16:9 ratio
      og: { width: 1200, height: 630 }
    }

    // Fetch background image
    const backgroundResponse = await fetch(body.background)
    if (!backgroundResponse.ok) {
      return res.status(400).json({
        error: 'Failed to fetch background image'
      })
    }
    const backgroundBuffer = await backgroundResponse.arrayBuffer()

    // Fetch logo image
    const logoResponse = await fetch(body.logo)
    if (!logoResponse.ok) {
      return res.status(400).json({
        error: 'Failed to fetch logo image'
      })
    }
    const logoBuffer = await logoResponse.arrayBuffer()

    // Get background dimensions
    let backgroundImage = sharp(Buffer.from(backgroundBuffer))
    const backgroundMetadata = await backgroundImage.metadata()

    if (!backgroundMetadata.width || !backgroundMetadata.height) {
      return res.status(400).json({
        error: 'Invalid background image dimensions'
      })
    }

    let bgWidth = backgroundMetadata.width
    let bgHeight = backgroundMetadata.height

    // Resize background if size is specified
    if (size !== 'custom' && sizePresets[size]) {
      const preset = sizePresets[size]
      bgWidth = preset.width
      bgHeight = preset.height
      backgroundImage = backgroundImage.resize(bgWidth, bgHeight, { fit: 'cover' })
    } else if (size === 'custom' && customWidth && customHeight) {
      bgWidth = customWidth
      bgHeight = customHeight
      backgroundImage = backgroundImage.resize(bgWidth, bgHeight, { fit: 'cover' })
    }

    // Calculate logo dimensions
    const logoWidth = Math.round(bgWidth * logoWidthPct)
    const logoHeight = Math.round((logoWidth * (backgroundMetadata.height || 1)) / (backgroundMetadata.width || 1))

    // Calculate padding - use fixed pixels for consistent positioning
    const padding = 40 // Fixed 40px padding from edges

    // Resize logo to fit width while maintaining aspect ratio
    const resizedLogo = sharp(Buffer.from(logoBuffer))
      .resize(logoWidth, null, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })

    // Get the actual dimensions of the resized logo
    const logoMetadata = await resizedLogo.metadata()
    const actualLogoHeight = logoMetadata.height || logoHeight

    // Create logo with transparent background and make visible parts white
    // Simple approach: convert to white while preserving quality
    const logoWithTransparency = await resizedLogo
      .greyscale() // Convert to greyscale first
      .tint({ r: 255, g: 255, b: 255 }) // Make logo white
      .png()
      .toBuffer()

    // Prepare composite layers
    const compositeLayersInput: any[] = []

    // 1. Add texture overlay first (on top of background)
    if (useOverlay) {
      try {
        // Use hardcoded overlay URL for reliability
        const overlayUrl = 'https://ejfcjiyxyifxjrmkchjx.supabase.co/storage/v1/object/public/backgrounds/texture.png'

        // Fetch remote overlay
        const overlayResponse = await fetch(overlayUrl)
        if (overlayResponse.ok) {
          const overlayBuffer = Buffer.from(await overlayResponse.arrayBuffer())

          // Resize overlay to match background dimensions
          const overlayResized = await sharp(overlayBuffer)
            .resize(bgWidth, bgHeight, { fit: 'cover' })
            .png()
            .toBuffer()

          compositeLayersInput.push({
            input: overlayResized,
            top: 0,
            left: 0
          })
        } else {
          throw new Error('Failed to fetch overlay')
        }
      } catch (error) {
        console.warn('Failed to load overlay, continuing without it:', error)
      }
    }

    // 2. Add black gradient overlay (on top of overlay)
    const gradientHeight = Math.round(bgHeight * 0.4) // 40% of image height
    
    // Create a simple gradient using SVG
    const gradientSvg = `
      <svg width="${bgWidth}" height="${gradientHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,${gradientIntensity});stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(0,0,0,${gradientIntensity * 0.8});stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
      </svg>
    `

    const gradientOverlay = await sharp(Buffer.from(gradientSvg))
      .png()
      .toBuffer()

    // Add gradient overlay (positioned at bottom)
    compositeLayersInput.push({
      input: gradientOverlay,
      top: bgHeight - gradientHeight,
      left: 0
    })

    // 3. Add logo (always on top) - aligned to bottom
    compositeLayersInput.push({
      input: logoWithTransparency,
      top: bgHeight - actualLogoHeight - padding, // Align to bottom of rectangle
      left: padding/2
    })

    // Composite all layers onto background
    const finalImage = await backgroundImage
      .composite(compositeLayersInput)
      .jpeg({ quality })
      .toBuffer()

    // Set response headers
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    // Send the image
    res.send(finalImage)

  } catch (error) {
    console.error('Error generating cover image:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
