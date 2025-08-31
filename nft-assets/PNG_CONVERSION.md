# SVG to PNG Conversion Guide

## Method 1: Using Online Tools
1. Visit https://convertio.co/svg-png/
2. Upload the genesis-nft.svg file
3. Select PNG as output format
4. Set size to 800x800 pixels
5. Download the converted PNG file

## Method 2: Using Browser
1. Open genesis-nft.svg file in browser
2. Right-click on the image
3. Select "Save As"
4. Choose PNG format
5. Save as genesis-nft.png

## Method 3: Using Command Line Tools (requires ImageMagick installation)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu

# Convert SVG to PNG
convert nft-assets/images/genesis-nft.svg nft-assets/images/genesis-nft.png
```

## Method 4: Using Node.js (requires sharp installation)
```bash
npm install sharp
node -e "
const sharp = require('sharp');
sharp('nft-assets/images/genesis-nft.svg')
  .resize(800, 800)
  .png()
  .toFile('nft-assets/images/genesis-nft.png')
  .then(() => console.log('PNG generated successfully!'));
"
```

## Recommended Settings
- Size: 800x800 pixels
- Format: PNG
- Background: Transparent or dark
- Quality: High

## File Locations
- SVG file: nft-assets/images/genesis-nft.svg
- Target PNG: nft-assets/images/genesis-nft.png
