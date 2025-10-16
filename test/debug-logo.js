const sharp = require('sharp');

async function debugLogo() {
  try {
    const logoUrl = 'https://cdn.sanity.io/images/ukg9h63w/production/02bb076c5ad291669e4de915192dbb77cb5f5b28-507x144.svg?w=2000&fit=max&auto=format';
    
    console.log('Fetching logo from:', logoUrl);
    const response = await fetch(logoUrl);
    const logoBuffer = await response.arrayBuffer();
    
    console.log('Original logo size:', logoBuffer.byteLength);
    
    // Process with Sharp
    const processed = sharp(Buffer.from(logoBuffer))
      .trim()
      .resize(null, 60, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    
    const metadata = await processed.metadata();
    console.log('Processed logo metadata:', metadata);
    
    const output = await processed
      .ensureAlpha()
      .png()
      .toBuffer();
    
    console.log('Output logo size:', output.length);
    
    // Save for inspection
    const fs = require('fs');
    fs.writeFileSync('./test/debug-logo.png', output);
    console.log('Debug logo saved to ./test/debug-logo.png');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugLogo();
