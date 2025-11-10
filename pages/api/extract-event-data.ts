import { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer'

interface ExtractEventDataRequest {
  url: string
}

interface EventData {
  eventName: string
  startDate: string
  endDate: string
  city: string
  country: string
  region: string
  description: string
  coverImageUrl: string
  organizingCompany: string
  organizers: string[]
  sponsors: string[]
  iconUrl: string
  logoUrl: string
  socialLinks: { [key: string]: string }
  officialUrl: string
}

const EVENT_EXTRACTION_PROMPT = `#CONTEXT#

Extract structured event details from the event webpage provided in <page_content>. The goal is to visit the event link and return only the requested fields exactly as they appear on the page.

#OBJECTIVE#

From the link of the event in <url>, extract and return the following fields as JSON:

- eventName
- startDate
- endDate
- city
- country
- region
- description
- coverImageUrl
- organizingCompany
- organizers
- sponsors
- iconUrl
- logoUrl
- socialLinks
- officialUrl

#INSTRUCTIONS#

1. Navigate to the URL provided in <url>. If it redirects, follow the redirect to the final canonical event page.

2. Identify and extract the requested fields directly from on-page content (titles, schedule/date sections, location blocks, meta tags, JSON-LD, Open Graph/Twitter tags) without executing JavaScript interactions.

3. Field guidance:

   - eventName: The official event title displayed on the page or in structured metadata (e.g., og:title, JSON-LD name).

   - startDate / endDate: Use the explicit dates on the page or in structured data. Normalize to ISO-8601 format YYYY-MM-DD. If only a single date is present, use it for startDate and leave endDate empty.

   - city / country / region: Extract from the location section. If the location shows a city and country, map accordingly. Map the country to one of these predefined regions: united-states, canada, europe, asia-pacific, latin-america, middle-east, africa. Leave region blank if the country doesn't fit these regions.

   - description: One concise summary sentence/short paragraph describing the event's purpose. Prefer meta description, hero subtitle, or first descriptive paragraph.

   - coverImageUrl: Prefer og:image or a prominent hero/cover image URL. Return the absolute URL.

   - organizingCompany: The primary organization producing or hosting the event (look for "Hosted by," "Organized by," footer org, or JSON-LD organizer.name).

   - organizers: Array of all organizations involved in organizing the event. Include the primary organizer and any co-organizers, partners, or supporting organizations mentioned.

   - sponsors: Array of all sponsor company names mentioned on the page or sponsors page. Look for sponsor logos, "Sponsored by" sections, partner lists, and gold/platinum/silver sponsor tiers.

   - iconUrl: The event's icon or logo URL. Prefer favicon, apple-touch-icon, or a small logo version. If not found, check social media profiles (Twitter/X) for profile images.

   - logoUrl: The event's main logo URL. Look for PNG/SVG images in header, footer, or navigation that contain the event name or appear to be the primary logo. Prefer larger logo images over small icons.

   - socialLinks: Object containing validated social media URLs. Review the extracted social links and select the most appropriate URL for each platform (X.com/Twitter, YouTube, Discord, Telegram, Instagram, Facebook, TikTok). Prioritize official organizational accounts over promotional or event-specific accounts. Return as key-value pairs (e.g., {"twitter": "https://x.com/officialaccount", "youtube": "https://youtube.com/@officialchannel"}).

   - officialUrl: The primary event homepage URL (canonical URL if available).

4. Do not infer or fabricate values. If a field is not present on the page, return an empty string for strings or empty array for arrays.

5. Strip tracking parameters from URLs where possible (e.g., remove utm_*). Return absolute URLs only.

6. Ensure all text is clean: remove excessive whitespace and newline characters.

7. For arrays (organizers, sponsors): Extract actual names as they appear. Deduplicate if the same organization appears multiple times.

8. For socialLinks object: Extract URLs from footer, header, or social media sections. Keys should be platform names (twitter, youtube, linkedin, discord, telegram, etc.). Values should be the full URLs.

9. Output must be valid JSON with exactly the keys listed in the Objective, in this order.

#EXAMPLES#

Example input:

- <url>: https://example.com/events/sample-event

Example output:

{
  "eventName": "Sample Tech Summit 2025",
  "startDate": "2025-09-12",
  "endDate": "2025-09-13",
  "city": "San Francisco",
  "country": "USA",
  "region": "united-states",
  "description": "A two-day summit bringing together leaders to discuss emerging technology trends and applications.",
  "coverImageUrl": "https://example.com/assets/hero-summit.jpg",
  "organizingCompany": "Example Events Co.",
  "organizers": ["Example Events Co.", "Tech Partners Inc."],
  "sponsors": ["Google", "Microsoft", "Amazon", "Apple"],
  "iconUrl": "https://example.com/favicon.ico",
  "logoUrl": "https://example.com/assets/logo.png",
  "socialLinks": {
    "twitter": "https://x.com/exampleevents",
    "linkedin": "https://linkedin.com/company/example-events",
    "youtube": "https://youtube.com/@exampleevents"
  },
  "officialUrl": "https://example.com/events/sample-event"
}`

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

    const body: ExtractEventDataRequest = req.body

    // Validate required fields
    if (!body.url) {
      return res.status(400).json({
        error: 'Missing required field: url'
      })
    }

    // Validate URL format
    try {
      new URL(body.url)
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format'
      })
    }

    console.log('Fetching page content from:', body.url)

    // Fetch page content using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ]
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

    // Set timeout and navigate
    await page.setDefaultNavigationTimeout(30000)
    await page.goto(body.url, { waitUntil: 'networkidle0' })

    // Extract page content
    const pageContent = await page.evaluate(() => {
      // Get text content
      const textContent = document.body.innerText || ''

      // Get meta tags
      const metaTags: { [key: string]: string } = {}
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property')
        const content = meta.getAttribute('content')
        if (name && content) {
          metaTags[name] = content
        }
      })

      // Get JSON-LD structured data
      const jsonLdScripts: any[] = []
      document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '')
          jsonLdScripts.push(data)
        } catch (e) {
          // Ignore invalid JSON
        }
      })

      // Get Open Graph and Twitter meta tags
      const ogTags: { [key: string]: string } = {}
      document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(meta => {
        const property = meta.getAttribute('property') || meta.getAttribute('name')
        const content = meta.getAttribute('content')
        if (property && content) {
          ogTags[property] = content
        }
      })

      // Extract favicon and icon URLs
      const iconUrls: string[] = []
      document.querySelectorAll('link[rel*="icon"], link[rel*="apple-touch"]').forEach(link => {
        const href = link.getAttribute('href')
        if (href) {
          try {
            const absoluteUrl = new URL(href, window.location.origin).href
            iconUrls.push(absoluteUrl)
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      })

      // Add default favicon locations
      const defaultFavicons = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png']
      defaultFavicons.forEach(favicon => {
        try {
          const absoluteUrl = new URL(favicon, window.location.origin).href
          if (!iconUrls.includes(absoluteUrl)) {
            iconUrls.push(absoluteUrl)
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      })

      // Extract social media links
      const socialLinks: { [key: string]: string } = {}
      const socialSelectors = [
        'a[href*="twitter.com"]', 'a[href*="x.com"]',
        'a[href*="youtube.com"]', 'a[href*="youtu.be"]',
        'a[href*="discord.gg"]', 'a[href*="discord.com"]',
        'a[href*="t.me"]', 'a[href*="telegram.org"]',
        'a[href*="instagram.com"]', 'a[href*="facebook.com"]',
        'a[href*="tiktok.com"]'
      ]

      // Collect YouTube URLs separately to prioritize channel URLs
      const youtubeUrls: string[] = []

      socialSelectors.forEach(selector => {
        const links = document.querySelectorAll(selector)
        links.forEach(link => {
          const href = link.getAttribute('href')
          if (href) {
            try {
              const absoluteUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).href
              const url = new URL(absoluteUrl)

              // Determine platform
              let platform = ''
              if (url.hostname.includes('twitter.com') || url.hostname.includes('x.com')) {
                platform = 'twitter'
              } else if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                platform = 'youtube'
                // Collect YouTube URLs separately for prioritization
                youtubeUrls.push(absoluteUrl)
              } else if (url.hostname.includes('discord.gg') || url.hostname.includes('discord.com')) {
                platform = 'discord'
              } else if (url.hostname.includes('t.me') || url.hostname.includes('telegram.org')) {
                platform = 'telegram'
              } else if (url.hostname.includes('instagram.com')) {
                platform = 'instagram'
              } else if (url.hostname.includes('facebook.com')) {
                platform = 'facebook'
              } else if (url.hostname.includes('tiktok.com')) {
                platform = 'tiktok'
              }

              if (platform && platform !== 'youtube' && !socialLinks[platform]) {
                socialLinks[platform] = absoluteUrl
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        })
      })

      // Process YouTube URLs - prioritize channel URLs
      if (youtubeUrls.length > 0) {
        // Prioritize channel URLs over video/playlist URLs
        const channelUrls = youtubeUrls.filter(url =>
          url.includes('/channel/') ||
          url.includes('/c/') ||
          url.includes('/user/') ||
          url.includes('/@') ||
          url.includes('youtube.com/') && !url.includes('/watch') && !url.includes('/playlist')
        )

        // Use channel URL if available, otherwise use any YouTube URL
        socialLinks.youtube = channelUrls.length > 0 ? channelUrls[0] : youtubeUrls[0]
      }

      // Extract logo URLs - look for images in header/footer that might be logos
      const logoUrls: string[] = []
      const logoSelectors = [
        'header img[src*=".png"]', 'header img[src*=".svg"]',
        'footer img[src*=".png"]', 'footer img[src*=".svg"]',
        '.logo img[src*=".png"]', '.logo img[src*=".svg"]',
        'nav img[src*=".png"]', 'nav img[src*=".svg"]',
        '.brand img[src*=".png"]', '.brand img[src*=".svg"]'
      ]

      logoSelectors.forEach(selector => {
        const images = document.querySelectorAll(selector)
        images.forEach(img => {
          const src = img.getAttribute('src')
          if (src && (src.includes('.png') || src.includes('.svg'))) {
            try {
              const absoluteUrl = src.startsWith('http') ? src : new URL(src, window.location.origin).href
              logoUrls.push(absoluteUrl)
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        })
      })

      // Also look for images with alt text containing event name or "logo"
      const allImages = document.querySelectorAll('img[alt]')
      const eventNameLower = document.title.toLowerCase()
      allImages.forEach(img => {
        const alt = img.getAttribute('alt')?.toLowerCase() || ''
        const src = img.getAttribute('src')
        if (src && (src.includes('.png') || src.includes('.svg')) &&
            (alt.includes('logo') || alt.includes(eventNameLower) ||
             eventNameLower.includes(alt))) {
          try {
            const absoluteUrl = src.startsWith('http') ? src : new URL(src, window.location.origin).href
            if (!logoUrls.includes(absoluteUrl)) {
              logoUrls.push(absoluteUrl)
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      })

      return {
        url: window.location.href,
        title: document.title,
        textContent: textContent.substring(0, 50000), // Limit content size
        metaTags,
        jsonLd: jsonLdScripts,
        ogTags,
        iconUrls,
        logoUrls,
        extractedSocialLinks: socialLinks
      }
    })

    // Try to fetch sponsors page content
    let sponsorsPageContent = ''
    const sponsorsPaths = ['/sponsors', '/partners', '/supporters', '/sponsor', '/partner']

    for (const path of sponsorsPaths) {
      try {
        const sponsorsUrl = new URL(body.url).origin + path
        console.log('Trying to fetch sponsors page:', sponsorsUrl)

        const sponsorsPage = await browser.newPage()
        await sponsorsPage.setDefaultNavigationTimeout(10000) // Shorter timeout for sponsors pages

        const response = await sponsorsPage.goto(sponsorsUrl, {
          waitUntil: 'networkidle0',
          timeout: 10000
        })

        if (response && response.ok()) {
          const sponsorsText = await sponsorsPage.evaluate(() => {
            return document.body.innerText || ''
          })
          sponsorsPageContent += `\n\nSPONSORS PAGE (${path}):\n${sponsorsText}`
          console.log(`Successfully fetched sponsors content from ${path}`)
        }

        await sponsorsPage.close()
      } catch (error) {
        console.log(`Sponsors page ${path} not found or failed to load`)
      }
    }

    await browser.close()

    console.log('Page content extracted, sending to OpenRouter...')

    // Check if OpenRouter API key is configured
    const hasApiKey = !!process.env.OPENROUTER_API_KEY

    let eventData: EventData | undefined

    // Try AI validation first, fall back to basic extraction if it fails
    let useAiValidation = hasApiKey

    if (useAiValidation) {
      try {
        console.log('Attempting AI validation and enhancement')

        // Prepare the prompt for OpenRouter
        const fullPrompt = `${EVENT_EXTRACTION_PROMPT}

#INPUT#
<url>${body.url}</url>
<main_page_content>${JSON.stringify(pageContent, null, 2)}</main_page_content>
${sponsorsPageContent ? `<sponsors_page_content>${sponsorsPageContent}</sponsors_page_content>` : ''}

Return only valid JSON with no additional text or formatting:`

        // Call OpenRouter API
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://stabledash-cover-generator.vercel.app',
            'X-Title': 'Stabledash Event Data Extractor'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              {
                role: 'user',
                content: fullPrompt
              }
            ],
            temperature: 0.1,
            max_tokens: 2000
          })
        })

        if (openRouterResponse.ok) {
          const openRouterData = await openRouterResponse.json()
          const aiResponse = openRouterData.choices?.[0]?.message?.content

          if (aiResponse) {
            console.log('AI response received, parsing JSON...')

            // Parse the AI response as JSON
            try {
              // Clean the response - remove any markdown formatting
              const cleanedResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()
              eventData = JSON.parse(cleanedResponse)
              console.log('Successfully used AI validation')
            } catch (parseError) {
              console.error('Failed to parse AI response as JSON, falling back to basic extraction:', aiResponse)
              useAiValidation = false
            }
          } else {
            console.log('No AI response content, falling back to basic extraction')
            useAiValidation = false
          }
        } else {
          const errorText = await openRouterResponse.text()
          console.error('OpenRouter API error:', errorText)
          console.log('Falling back to basic extraction due to API error')
          useAiValidation = false
        }
      } catch (apiError) {
        console.error('Error calling OpenRouter API:', apiError)
        console.log('Falling back to basic extraction due to API call error')
        useAiValidation = false
      }
    }

    // If AI validation failed or wasn't available, use basic extraction
    if (!useAiValidation) {
      // Fallback: return extracted data without AI validation
      console.log('Using fallback mode without AI validation')

      // Create basic event data structure from extracted content
      eventData = {
        eventName: pageContent.title || 'Unknown Event',
        startDate: '',
        endDate: '',
        city: '',
        country: '',
        region: '',
        description: '',
        coverImageUrl: '',
        organizingCompany: '',
        organizers: [],
        sponsors: [],
        iconUrl: pageContent.iconUrls?.[0] || '',
        logoUrl: pageContent.logoUrls?.[0] || '',
        socialLinks: pageContent.extractedSocialLinks || {},
        officialUrl: body.url
      }

      // Try to extract some basic information from meta tags
      if (pageContent.metaTags) {
        if (pageContent.metaTags['og:title']) {
          eventData.eventName = pageContent.metaTags['og:title']
        }
        if (pageContent.metaTags['og:description']) {
          eventData.description = pageContent.metaTags['og:description']
        }
        if (pageContent.metaTags['og:image']) {
          eventData.coverImageUrl = pageContent.metaTags['og:image']
        }
      }
    }

    // Validate the response has the required fields
    if (!eventData) {
      return res.status(500).json({
        error: 'No event data was extracted'
      })
    }

    const requiredFields = ['eventName', 'startDate', 'endDate', 'city', 'country', 'region', 'description', 'coverImageUrl', 'organizingCompany', 'organizers', 'sponsors', 'iconUrl', 'logoUrl', 'socialLinks', 'officialUrl']
    for (const field of requiredFields) {
      if (!(field in eventData)) {
        return res.status(500).json({
          error: `Missing required field: ${field}`
        })
      }
      // Validate array fields
      if (['organizers', 'sponsors'].includes(field) && !Array.isArray(eventData[field as keyof EventData])) {
        return res.status(500).json({
          error: `Field ${field} must be an array`
        })
      }
      // Validate object fields
      if (field === 'socialLinks' && typeof eventData[field] !== 'object') {
        return res.status(500).json({
          error: `Field ${field} must be an object`
        })
      }
    }

    console.log('Event data extracted successfully:', eventData ? 'with AI validation' : 'basic extraction')

    // Return the extracted event data
    res.status(200).json(eventData)

  } catch (error) {
    console.error('Error extracting event data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
