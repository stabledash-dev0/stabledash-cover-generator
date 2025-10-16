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
  watermark?: boolean // Enable watermark logo at bottom-center
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
      await page.waitForFunction(() => document.readyState === 'complete')
      
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

    // 5. Add watermark logo (if enabled)
    if (body.watermark) {
      try {
        // Inline Stabledash logo SVG
        const watermarkSvg = `
          <svg width="245" height="40" viewBox="0 0 245 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M235.14 10.9811C240.146 10.9811 244.346 13.7139 244.346 19.9831V39.0588H240.039V21.0548C240.039 17.5183 238.37 14.732 234.063 14.732C229.218 14.732 225.988 17.7862 225.988 22.0193V39.0588H221.681V0.746704H225.988V14.9999H226.095C227.549 13.0709 230.456 10.9811 235.14 10.9811Z" fill="white"/>
            <path d="M208.135 22.8275C213.035 24.0063 218.58 24.8101 218.58 31.5616C218.58 36.5448 214.004 39.8134 207.759 39.8134C199.36 39.8134 195.484 35.8482 195.215 29.9541H199.522C199.791 33.0083 200.868 36.0626 207.759 36.0626C212.442 36.0626 214.273 33.6513 214.273 31.8295C214.273 27.8643 210.666 27.65 206.736 26.6855C202.537 25.6674 196.292 25.1851 196.292 18.7551C196.292 14.4685 200.114 10.9855 206.574 10.9855C213.411 10.9855 217.072 14.8435 217.503 19.5589H213.196C212.765 17.4691 211.742 14.7364 206.574 14.7364C202.698 14.7364 200.598 16.2903 200.598 18.4336C200.598 21.6486 204.313 21.9165 208.135 22.8275Z" fill="white"/>
            <path d="M187.422 18.7015C187.422 16.5582 186.237 14.7364 181.823 14.7364C176.601 14.7364 174.878 16.2367 174.609 20.2019H170.302C170.571 14.9507 173.855 10.9855 181.823 10.9855C187.045 10.9855 191.729 13.0217 191.729 19.6125V32.9011C191.729 35.0445 192.105 36.2233 194.851 35.9018V38.9025C193.721 39.2776 193.128 39.3312 192.321 39.3312C189.737 39.3312 188.175 38.6346 187.422 35.6339H187.314C185.591 38.2059 182.523 39.8134 178 39.8134C172.455 39.8134 168.956 36.652 168.956 32.0438C168.956 25.8281 173.586 24.2206 180.692 22.8811C185.322 22.0237 187.422 21.4343 187.422 18.7015ZM178.431 36.0626C183.546 36.0626 187.422 33.7585 187.422 28.5073V23.9527C186.614 24.7565 183.976 25.5066 181.069 26.0961C175.739 27.2213 173.263 28.5609 173.263 31.8295C173.263 34.5086 174.878 36.0626 178.431 36.0626Z" fill="white"/>
            <path d="M161.488 0.746704H165.795V39.0588H161.488V35.6831H161.381C159.766 37.7728 157.182 39.809 152.767 39.809C145.876 39.809 140.385 34.3971 140.385 25.3951C140.385 16.393 145.876 10.9811 152.767 10.9811C157.182 10.9811 159.766 12.9101 161.381 15.2678H161.488V0.746704ZM153.198 36.0581C158.312 36.0581 161.488 31.8251 161.488 25.3951C161.488 18.965 158.312 14.732 153.198 14.732C147.545 14.732 144.692 20.0367 144.692 25.3951C144.692 30.7534 147.545 36.0581 153.198 36.0581Z" fill="white"/>
            <path d="M126.002 36.0626C131.494 36.0626 133.539 32.5261 134.024 30.6506H138.331C136.931 35.7411 133.001 39.8134 126.164 39.8134C117.819 39.8134 112.759 33.9728 112.759 25.3995C112.759 16.2903 117.927 10.9855 125.949 10.9855C134.562 10.9855 138.761 16.8261 138.761 26.5247H117.066C117.066 31.4544 120.027 36.0626 126.002 36.0626ZM125.949 14.7364C120.78 14.7364 117.066 18.38 117.066 22.7739H134.455C134.455 18.38 131.117 14.7364 125.949 14.7364Z" fill="white"/>
            <path d="M104.986 0.746704H109.293V39.0588H104.986V0.746704Z" fill="white"/>
            <path d="M89.1767 10.9811C96.0677 10.9811 101.559 16.393 101.559 25.3951C101.559 34.3971 96.0677 39.809 89.1767 39.809C84.7622 39.809 82.1781 37.7728 80.563 35.6831H80.4553V39.0588H76.1484V0.746704H80.4553V15.2678H80.563C82.1781 12.9101 84.7622 10.9811 89.1767 10.9811ZM88.746 36.0581C94.3988 36.0581 97.2521 30.7534 97.2521 25.3951C97.2521 20.0367 94.3988 14.732 88.746 14.732C83.6316 14.732 80.4553 18.965 80.4553 25.3951C80.4553 31.8251 83.6316 36.0581 88.746 36.0581Z" fill="white"/>
            <path d="M66.577 18.7015C66.577 16.5582 65.3926 14.7364 60.9781 14.7364C55.756 14.7364 54.0333 16.2367 53.7641 20.2019H49.4572C49.7264 14.9507 53.0104 10.9855 60.9781 10.9855C66.2002 10.9855 70.8839 13.0217 70.8839 19.6125V32.9011C70.8839 35.0445 71.2607 36.2233 74.0064 35.9018V38.9025C72.8758 39.2776 72.2836 39.3312 71.4761 39.3312C68.892 39.3312 67.3307 38.6346 66.577 35.6339H66.4693C64.7466 38.2059 61.678 39.8134 57.1557 39.8134C51.6107 39.8134 48.1113 36.652 48.1113 32.0438C48.1113 25.8281 52.7412 24.2206 59.8475 22.8811C64.4774 22.0237 66.577 21.4343 66.577 18.7015ZM57.5864 36.0626C62.7008 36.0626 66.577 33.7585 66.577 28.5073V23.9527C65.7695 24.7565 63.1315 25.5066 60.2244 26.0961C54.8946 27.2213 52.4182 28.5609 52.4182 31.8295C52.4182 34.5086 54.0333 36.0626 57.5864 36.0626Z" fill="white"/>
            <path d="M46.3512 15.4845H40.9676V31.9346C40.9676 35.0425 42.6903 35.5783 46.3512 35.3104V39.0612C45.3821 39.2755 44.2516 39.3827 43.121 39.3827C39.4602 39.3827 36.6607 37.936 36.6607 32.3633V15.4845H32.623V11.7337H36.6607V2.62451H40.9676V11.7337H46.3512V15.4845Z" fill="white"/>
            <path d="M16.2584 16.7183C24.926 18.8617 30.5787 20.3084 30.5787 29.0425C30.5787 34.6152 26.4334 39.8128 16.6891 39.8128C7.59085 39.8128 0.538358 34.9903 0 26.2026H4.84522C5.38358 31.4538 8.61373 35.5261 16.6891 35.5261C23.3647 35.5261 25.7335 32.4719 25.7335 29.0425C25.7335 23.7914 22.8802 22.8269 14.2665 20.8443C8.50606 19.5047 1.61507 17.5221 1.61507 10.074C1.61507 4.01906 6.29879 0.000305176 14.8048 0.000305176C22.9879 0.000305176 28.6945 4.17981 29.3405 12.1102H24.4953C23.7954 6.96615 20.8883 4.28698 14.8048 4.28698C9.36743 4.28698 6.4603 6.37674 6.4603 9.53816C6.4603 14.6286 10.6057 15.3252 16.2584 16.7183Z" fill="white"/>
          </svg>
        `
        
        // Process watermark with Sharp
        const watermarkBuffer = await sharp(Buffer.from(watermarkSvg))
          .resize(null, 20, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()
        
        // Get watermark dimensions
        const watermarkMetadata = await sharp(watermarkBuffer).metadata()
        const watermarkWidth = watermarkMetadata.width || 0
        const watermarkHeight = watermarkMetadata.height || 0
        
        // Position watermark at bottom-center
        const watermarkTop = bgHeight - watermarkHeight - 40 // 40px from bottom
        const watermarkLeft = Math.round((bgWidth - watermarkWidth) / 2) // Center horizontally
        
        compositeLayersInput.push({
          input: watermarkBuffer,
          top: watermarkTop,
          left: watermarkLeft
        })
        
        console.log(`Watermark added at position: ${watermarkTop}, ${watermarkLeft}`)
        
      } catch (error) {
        console.warn('Failed to add watermark:', error)
      }
    }

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
