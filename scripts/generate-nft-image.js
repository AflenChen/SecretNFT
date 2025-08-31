#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create NFT image directory
const nftDir = path.join(__dirname, '..', 'nft-assets');
const imagesDir = path.join(nftDir, 'images');
const metadataDir = path.join(nftDir, 'metadata');

if (!fs.existsSync(nftDir)) {
  fs.mkdirSync(nftDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

// Generate SVG image content
function generateGenesisNFT() {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient definitions -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
    </linearGradient>
    
    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:0.1" />
    </radialGradient>
    
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:1" />
    </linearGradient>
    
    <!-- Animation definitions -->
    <animateTransform id="rotate" attributeName="transform" type="rotate" values="0 400 400;360 400 400" dur="20s" repeatCount="indefinite"/>
  </defs>
  
      <!-- Background -->
  <rect width="800" height="800" fill="url(#bgGradient)"/>
  
      <!-- Glow effects -->
  <circle cx="400" cy="400" r="350" fill="url(#glowGradient)" opacity="0.3">
    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite"/>
  </circle>
  
      <!-- Main circle -->
  <circle cx="400" cy="400" r="300" fill="none" stroke="#4ecdc4" stroke-width="3" opacity="0.8">
    <animate attributeName="r" values="300;320;300" dur="4s" repeatCount="indefinite"/>
  </circle>
  
      <!-- Inner circle -->
  <circle cx="400" cy="400" r="200" fill="none" stroke="#ff6b6b" stroke-width="2" opacity="0.6">
    <animate attributeName="r" values="200;220;200" dur="3s" repeatCount="indefinite"/>
  </circle>
  
      <!-- Core circle -->
  <circle cx="400" cy="400" r="100" fill="none" stroke="#45b7d1" stroke-width="4" opacity="0.9">
    <animate attributeName="r" values="100;120;100" dur="2s" repeatCount="indefinite"/>
  </circle>
  
      <!-- Center pattern -->
  <g transform="translate(400, 400)">
          <!-- Hexagon -->
    <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" 
             fill="none" stroke="#ff6b6b" stroke-width="3" opacity="0.8">
      <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite"/>
    </polygon>
    
          <!-- Inner hexagon -->
    <polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" 
             fill="none" stroke="#4ecdc4" stroke-width="2" opacity="0.6">
      <animateTransform attributeName="transform" type="rotate" values="360;0" dur="8s" repeatCount="indefinite"/>
    </polygon>
    
          <!-- Center point -->
    <circle cx="0" cy="0" r="15" fill="#45b7d1" opacity="0.9">
      <animate attributeName="r" values="15;20;15" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  </g>
  
      <!-- Decorative particles -->
  <g opacity="0.7">
    <circle cx="200" cy="200" r="3" fill="#ff6b6b">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="600" cy="200" r="3" fill="#4ecdc4">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="200" cy="600" r="3" fill="#45b7d1">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="600" cy="600" r="3" fill="#ff6b6b">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/>
    </circle>
  </g>
  
      <!-- Title text -->
  <text x="400" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="url(#textGradient)">
    SecretNFT
  </text>
  
      <!-- Subtitle -->
  <text x="400" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.8">
    Genesis Collection
  </text>
  
      <!-- Bottom information -->
  <text x="400" y="750" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" opacity="0.6">
    Powered by FHEVM Technology
  </text>
  
      <!-- Border decoration -->
  <rect x="50" y="50" width="700" height="700" fill="none" stroke="#4ecdc4" stroke-width="2" opacity="0.5" rx="20"/>
</svg>`;

  return svgContent;
}

// Generate metadata
function generateMetadata() {
  const metadata = {
    name: "SecretNFT Genesis #1",
    description: "The first NFT in the SecretNFT Genesis Collection. This represents the beginning of confidential NFT launches powered by Fully Homomorphic Encryption (FHE) technology.",
    image: "ipfs://QmYourImageHashHere/genesis-nft.svg",
    external_url: "https://secretnft.com",
    attributes: [
      {
        trait_type: "Collection",
        value: "Genesis"
      },
      {
        trait_type: "Rarity",
        value: "Legendary"
      },
      {
        trait_type: "Technology",
        value: "FHEVM"
      },
      {
        trait_type: "Privacy Level",
        value: "Maximum"
      },
      {
        trait_type: "Launch Type",
        value: "Confidential"
      },
      {
        trait_type: "Edition",
        value: "1 of 1"
      }
    ],
    properties: {
      files: [
        {
          uri: "genesis-nft.svg",
          type: "image/svg+xml"
        }
      ],
      category: "image",
      creators: [
        {
          address: "0x764DCef1a9De771443f472B7160cC86691F90499",
          share: 100
        }
      ]
    }
  };

  return metadata;
}

// Generate PNG version simple description
function generatePNGDescription() {
  return `# SecretNFT Genesis Collection

## Image Description
- Size: 800x800 pixels
- Format: SVG (vector graphics)
- Theme: Genesis NFT, representing the beginning of privacy protection
- Colors: Deep blue gradient background with neon color accents
- Animation: Includes rotation and pulsing effects

## Design Elements
1. **Background**: Deep blue gradient, creating a mysterious atmosphere
2. **Center Pattern**: Multiple concentric circles and hexagons
3. **Glow Effects**: Neon colored halos
4. **Text**: "SecretNFT Genesis Collection"
5. **Decoration**: Particle effects and borders

## Technical Features
- Responsive SVG design
- Built-in CSS animations
- Scalable vector graphics
- Supports transparent background

## Usage Instructions
1. Save SVG file as genesis-nft.svg
2. Upload to IPFS or other storage service
3. Update the image field in metadata
4. Use this image when deploying NFT contract
`;
}

// Main function
function main() {
  console.log('🎨 Generating SecretNFT Genesis NFT image...');
  
      // Generate SVG image
  const svgContent = generateGenesisNFT();
  const svgPath = path.join(imagesDir, 'genesis-nft.svg');
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ SVG image generated: ${svgPath}`);
  
      // Generate metadata
  const metadata = generateMetadata();
  const metadataPath = path.join(metadataDir, 'genesis-nft.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`✅ Metadata generated: ${metadataPath}`);
  
      // Generate documentation
  const description = generatePNGDescription();
  const readmePath = path.join(nftDir, 'README.md');
  fs.writeFileSync(readmePath, description);
  console.log(`✅ Documentation generated: ${readmePath}`);
  
  console.log('\n🎉 NFT resources generation completed!');
  console.log('\n📁 Generated files:');
  console.log(`   - Image: ${svgPath}`);
  console.log(`   - Metadata: ${metadataPath}`);
  console.log(`   - Documentation: ${readmePath}`);
  
  console.log('\n📋 Next steps:');
  console.log('1. View the generated SVG image');
  console.log('2. Upload image to IPFS or similar service');
  console.log('3. Update the image field in metadata');
  console.log('4. Use this image to deploy NFT collection');
}

main();
