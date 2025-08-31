#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 检查是否安装了sharp
try {
  require('sharp');
} catch (error) {
  console.log('❌ Need to install sharp package to convert image');
  console.log('Please run: npm install sharp');
  process.exit(1);
}

const sharp = require('sharp');

async function convertToPNG() {
  const svgPath = path.join(__dirname, '..', 'nft-assets', 'images', 'genesis-nft.svg');
  const pngPath = path.join(__dirname, '..', 'nft-assets', 'images', 'genesis-nft.png');
  
  if (!fs.existsSync(svgPath)) {
    console.log('❌ SVG file not found:', svgPath);
    return;
  }
  
  try {
    console.log('🔄 Converting SVG to PNG...');
    
    await sharp(svgPath)
      .resize(800, 800)
      .png()
      .toFile(pngPath);
    
    console.log('✅ PNG file generated:', pngPath);
    console.log('📁 File size:', fs.statSync(pngPath).size, 'bytes');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
  }
}

convertToPNG();
