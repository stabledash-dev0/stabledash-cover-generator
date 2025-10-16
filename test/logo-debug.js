const sharp = require('sharp');

async function debugLogo() {
  try {
    console.log('Fetching logo...');
    const logoUrl = 'https://cdn.sanity.io/images/ukg9h63w/production/02bb076c5ad291669e4de915192dbb77cb5f5b28-507x144.svg?w=2000&fit=max&auto=format';
    const response = await fetch(logoUrl);
    const logoBuffer = await response.arrayBuffer();
    
    console.log('Original logo size:', logoBuffer.byteLength);
    
    // Process logo with Sharp
    const processed = sharp(Buffer.from(logoBuffer))
      .trim()
      .resize(null, 300, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    
    const metadata = await processed.metadata();
    console.log('Processed logo metadata:', metadata);
    
    const logoOutput = await processed
      .ensureAlpha()
      .png()
      .toBuffer();
    
    console.log('Logo output size:', logoOutput.length);
    
    // Create a test background with grid lines to show centering
    const bgWidth = 1200;
    const bgHeight = 630;
    
    // Create background with grid
    const backgroundSvg = `
      <svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <line x1="${bgWidth/2}" y1="0" x2="${bgWidth/2}" y2="${bgHeight}" stroke="red" stroke-width="2"/>
        <line x1="0" y1="${bgHeight/2}" x2="${bgWidth}" y2="${bgHeight/2}" stroke="red" stroke-width="2"/>
        <circle cx="${bgWidth/2}" cy="${bgHeight/2}" r="10" fill="red"/>
      </svg>
    `;
    
    const background = await sharp(Buffer.from(backgroundSvg))
      .png()
      .toBuffer();
    
    // Calculate center position
    const logoTop = Math.round((bgHeight - metadata.height) / 2);
    const logoLeft = Math.round((bgWidth - metadata.width) / 2);
    
    console.log('Centering calculation:');
    console.log('Background:', { bgWidth, bgHeight });
    console.log('Logo:', { width: metadata.width, height: metadata.height });
    console.log('Position:', { logoTop, logoLeft });
    console.log('Logo center will be at:', { 
      centerX: logoLeft + (metadata.width / 2), 
      centerY: logoTop + (metadata.height / 2) 
    });
    
    // Composite logo onto background
    const result = await sharp(background)
      .composite([{
        input: logoOutput,
        top: logoTop,
        left: logoLeft
      }])
      .jpeg()
      .toBuffer();
    
    // Save result
    const fs = require('fs');
    fs.writeFileSync('./test/logo-debug.jpg', result);
    console.log('Debug image saved to ./test/logo-debug.jpg');
    console.log('The red lines and circle show the center. The logo should be centered there.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugLogo();
