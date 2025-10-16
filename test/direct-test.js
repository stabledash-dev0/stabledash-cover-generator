const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('Testing API directly...');
    
    const response = await fetch('http://localhost:3000/api/generate-cover-image-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer stabledash_cover_gen_2025_secure_xyz789'
      },
      body: JSON.stringify({
        background: 'https://cdn.sanity.io/images/ukg9h63w/production/88debc8831cde9f90bde7c850cd33dcb99236cae-3840x2160.png?rect=79,0,3761,997&w=2000&fit=max&auto=format',
        logo: 'https://cdn.sanity.io/images/ukg9h63w/production/02bb076c5ad291669e4de915192dbb77cb5f5b28-507x144.svg?w=2000&fit=max&auto=format',
        quality: 90,
        overlay: true,
        gradient_intensity: 0.8,
        size: 'og'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }
    
    const buffer = await response.buffer();
    console.log('API Response size:', buffer.length);
    
    // Save the response
    const fs = require('fs');
    fs.writeFileSync('./test/direct-test-result.jpg', buffer);
    console.log('Direct test result saved to ./test/direct-test-result.jpg');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
