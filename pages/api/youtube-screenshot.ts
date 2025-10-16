import { NextApiRequest, NextApiResponse } from 'next'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

interface YouTubeScreenshotRequest {
  videoUrl: string
  timestamp: number // in seconds
  quality?: number
  width?: number
  height?: number
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*&v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
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

    const body: YouTubeScreenshotRequest = req.body

    // Validate required fields
    if (!body.videoUrl || body.timestamp === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: videoUrl and timestamp'
      })
    }

    // Validate timestamp
    if (body.timestamp < 0) {
      return res.status(400).json({
        error: 'Timestamp must be a positive number'
      })
    }

    // Set defaults for optional fields
    const quality = body.quality ?? 90
    const width = body.width ?? 1280
    const height = body.height ?? 720

    // Extract video ID from URL
    const videoId = extractVideoId(body.videoUrl)
    if (!videoId) {
      return res.status(400).json({
        error: 'Invalid YouTube URL. Could not extract video ID.'
      })
    }

    // Format timestamp as HH:MM:SS
    const hours = Math.floor(body.timestamp / 3600)
    const minutes = Math.floor((body.timestamp % 3600) / 60)
    const seconds = Math.floor(body.timestamp % 60)
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    // Fetch the best available YouTube thumbnail
    let thumbnailBuffer: Buffer
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    
    try {
      // Try to get the highest quality thumbnail available
      let thumbnailResponse = await fetch(thumbnailUrl)
      
      if (!thumbnailResponse.ok) {
        // Fallback to high quality thumbnail
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        thumbnailResponse = await fetch(thumbnailUrl)
        
        if (!thumbnailResponse.ok) {
          // Final fallback to medium quality
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
          thumbnailResponse = await fetch(thumbnailUrl)
          
          if (!thumbnailResponse.ok) {
            return res.status(400).json({
              error: 'Failed to fetch YouTube thumbnail'
            })
          }
        }
      }
      
      thumbnailBuffer = Buffer.from(await thumbnailResponse.arrayBuffer())
      console.log('YouTube thumbnail captured successfully')
    } catch (error) {
      console.error('Error fetching screenshot:', error)
      return res.status(400).json({
        error: 'Failed to fetch YouTube screenshot'
      })
    }

    // Process the image with Sharp (resize if needed)
    const sharp = require('sharp')
    const processedImage = await sharp(thumbnailBuffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality })
      .toBuffer()

    // Generate filename
    const timestamp = Math.floor(Date.now() / 1000)
    const filename = `youtube-screenshot-${videoId}-${body.timestamp}s-${timestamp}.jpg`

    // Save the file to the project directory
    const fs = require('fs')
    const filePath = `./${filename}`
    fs.writeFileSync(filePath, processedImage)

    const result = {
      videoId,
      timestamp: body.timestamp,
      formattedTime,
      originalThumbnailUrl: thumbnailUrl,
      savedFile: filename,
      filePath: filePath,
      fileSize: processedImage.length,
      dimensions: {
        width,
        height
      },
      quality,
      note: "This is the best available YouTube thumbnail. For frame-accurate screenshots, you'll need to integrate with a browser automation service like Puppeteer or a screenshot API."
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=3600')

    // Send the result
    res.status(200).json(result)

  } catch (error) {
    console.error('Error generating YouTube screenshot:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
