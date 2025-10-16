import { NextApiRequest, NextApiResponse } from 'next'
import sharp from 'sharp'
import puppeteer from 'puppeteer'

// Configuration constants
const LOGO_HEIGHT = 200 // Balanced logo height for good visibility
const LOGO_PADDING = 40 // Fixed padding from edges in pixels
const SHOW_OVERLAY = false // Flag to enable/disable texture overlay

interface CoverImageRequest {
  background: string
  logo: string
  quality: number
  overlay?: string | boolean
  gradient_intensity?: number
  size?: 'hero' | 'thumbnail' | 'og' | 'custom'
  width?: number
  height?: number
  brandcolor?: string // Hex color without # (e.g., "FF5733")
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
    const quality = body.quality ?? 90
    const useOverlay = body.overlay !== false
    const gradientIntensity = body.gradient_intensity ?? 0.8

    // Handle size parameter - default to 'og' for social media sharing
    const size = body.size ?? 'og'
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

    // Calculate padding - use fixed pixels for consistent positioning
    const padding = LOGO_PADDING // Fixed padding from edges


    // Use HTML2PNG approach for perfect centering
    const logoBase64 = Buffer.from(logoBuffer).toString('base64')
    const logoExtension = body.logo.split('.').pop()?.toLowerCase() || 'png'
    const logoMimeType = logoExtension === 'svg' ? 'image/svg+xml' : `image/${logoExtension}`
    
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                margin: 0;
                padding: 0;
                width: ${bgWidth}px;
                height: ${bgHeight}px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
            }
            .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }
            .logo {
                max-height: ${LOGO_HEIGHT}px;
                max-width: 100%;
                object-fit: contain;
                background: white;
                padding: 20px;
                border-radius: 8px;
            }
        </style>
    </head>
    <body>
        <div class="logo-container">
            <img src="data:${logoMimeType};base64,${logoBase64}" class="logo" alt="Logo" />
        </div>
    </body>
    </html>
    `

    let logoWithTransparency: Buffer
    
    try {
      console.log('Using HTML2PNG approach for perfect centering...')
      
      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      
      // Set viewport to match our image dimensions
      await page.setViewport({ width: bgWidth, height: bgHeight })
      
      // Set the HTML content
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' })
      
      // Wait for the image to load
      await page.waitForTimeout(1000)
      
      // Take screenshot of the entire page
      const logoBuffer = await page.screenshot({
        type: 'png',
        omitBackground: true,
        fullPage: false
      })
      
      await browser.close()
      
      // Process the screenshot with Sharp
      logoWithTransparency = await sharp(logoBuffer)
        .resize(null, LOGO_HEIGHT, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
        
      console.log('HTML2PNG logo created successfully')
        
    } catch (error) {
      console.warn('HTML2PNG failed, falling back to Sharp method:', error)
      
      // Fallback to simple Sharp method
      const resizedLogo = sharp(Buffer.from(logoBuffer))
        .trim()
        .resize(null, LOGO_HEIGHT, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })

      logoWithTransparency = await resizedLogo
        .ensureAlpha()
        .png()
        .toBuffer()
    }

    // Get dimensions for positioning
    const logoMetadata = await sharp(logoWithTransparency).metadata()
    const actualLogoHeight = logoMetadata.height || LOGO_HEIGHT
    const actualLogoWidth = logoMetadata.width || LOGO_HEIGHT

    // Prepare composite layers
    const compositeLayersInput: any[] = []

    // 1. Add texture overlay first (on top of background)
    if (useOverlay && SHOW_OVERLAY) {
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

    // 3. Add brand color gradient overlay (if provided)
    if (body.brandcolor) {
      try {
        // Validate hex color (remove # if present)
        const hexColor = body.brandcolor.replace('#', '').toUpperCase()
        if (/^[0-9A-F]{6}$/.test(hexColor)) {
          // Convert hex to RGB
          const r = parseInt(hexColor.substr(0, 2), 16)
          const g = parseInt(hexColor.substr(2, 2), 16)
          const b = parseInt(hexColor.substr(4, 2), 16)
          
          // Create gradient SVG from brand color to black
          const brandGradientSvg = `
            <svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="brandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:0.8" />
                  <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.8" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#brandGrad)"/>
            </svg>
          `
          
          const brandGradient = await sharp(Buffer.from(brandGradientSvg))
            .png()
            .toBuffer()
          
          compositeLayersInput.push({
            input: brandGradient,
            top: 0,
            left: 0
          })
          
          console.log(`Brand color gradient added: #${hexColor}`)
        } else {
          console.warn('Invalid brand color format:', body.brandcolor)
        }
      } catch (error) {
        console.warn('Failed to create brand color gradient:', error)
      }
    }

    // 4. Add logo (always on top) - centered both horizontally and vertically
    const logoTop = Math.round((bgHeight - actualLogoHeight) / 2) // Center vertically using actual height
    const logoLeft = Math.round((bgWidth - actualLogoWidth) / 2) // Center horizontally using actual width
    
    console.log('=== LOGO POSITIONING DEBUG ===');
    console.log('Background dimensions:', { bgWidth, bgHeight });
    console.log('Logo dimensions:', { actualLogoWidth, actualLogoHeight });
    console.log('Calculated position:', { logoTop, logoLeft });
    console.log('Background center:', { centerX: bgWidth / 2, centerY: bgHeight / 2 });
    console.log('Logo center will be at:', { 
      logoCenterX: logoLeft + (actualLogoWidth / 2), 
      logoCenterY: logoTop + (actualLogoHeight / 2) 
    });
    console.log('Logo size ratio:', { 
      widthRatio: actualLogoWidth / bgWidth, 
      heightRatio: actualLogoHeight / bgHeight 
    });
    console.log('================================');
    
    compositeLayersInput.push({
      input: logoWithTransparency,
      top: logoTop,
      left: logoLeft
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
