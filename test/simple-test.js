const sharp = require('sharp');

async function testCentering() {
  try {
    // Create a simple test image with a colored rectangle
    const testImage = await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg()
    .toBuffer();

    // Create a simple logo (red rectangle)
    const logo = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
    .png()
    .toBuffer();

    // Calculate center position
    const bgWidth = 1200;
    const bgHeight = 630;
    const logoWidth = 200;
    const logoHeight = 100;
    
    const logoTop = Math.round((bgHeight - logoHeight) / 2);
    const logoLeft = Math.round((bgWidth - logoWidth) / 2);
    
    console.log('Test centering calculation:');
    console.log('Background:', { bgWidth, bgHeight });
    console.log('Logo:', { logoWidth, logoHeight });
    console.log('Position:', { logoTop, logoLeft });
    console.log('Should be center:', { 
      centerX: bgWidth / 2, 
      centerY: bgHeight / 2,
      logoCenterX: logoLeft + (logoWidth / 2),
      logoCenterY: logoTop + (logoHeight / 2)
    });

    // Composite the logo onto the background
    const result = await sharp(testImage)
      .composite([{
        input: logo,
        top: logoTop,
        left: logoLeft
      }])
      .jpeg()
      .toBuffer();

    // Save the test image
    const fs = require('fs');
    fs.writeFileSync('./test/centering-test.jpg', result);
    console.log('Test image saved to ./test/centering-test.jpg');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCentering();
