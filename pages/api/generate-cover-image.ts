import { NextApiRequest, NextApiResponse } from 'next'
import sharp from 'sharp'

interface CoverImageRequest {
  background: string
  logo: string
  logo_width_pct: number
  pad_pct: number
  quality: number
  overlay?: string | boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
    const padPct = body.pad_pct ?? 0.05
    const quality = body.quality ?? 90
    const useOverlay = body.overlay !== false

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
    const backgroundImage = sharp(Buffer.from(backgroundBuffer))
    const backgroundMetadata = await backgroundImage.metadata()

    if (!backgroundMetadata.width || !backgroundMetadata.height) {
      return res.status(400).json({
        error: 'Invalid background image dimensions'
      })
    }

    const bgWidth = backgroundMetadata.width
    const bgHeight = backgroundMetadata.height

    // Calculate logo dimensions
    const logoWidth = Math.round(bgWidth * logoWidthPct)
    const logoHeight = Math.round((logoWidth * (backgroundMetadata.height || 1)) / (backgroundMetadata.width || 1))

    // Calculate padding
    const padding = Math.round(bgWidth * padPct)

    // Resize logo
    const resizedLogo = sharp(Buffer.from(logoBuffer))
      .resize(logoWidth, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })

    // Create logo with transparent background
    const logoWithTransparency = await resizedLogo
      .png()
      .toBuffer()

    // Prepare composite layers
    const compositeLayersInput: any[] = []

    // Add overlay if enabled
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

    // Add logo (always on top)
    compositeLayersInput.push({
      input: logoWithTransparency,
      top: bgHeight - logoHeight - padding,
      left: padding
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
