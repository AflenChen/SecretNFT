// Tool for generating default NFT images

// Safe base64 encoding function, supports Unicode characters
function safeBase64Encode(str: string): string {
  try {
    // First try direct encoding
    return btoa(str);
  } catch (error) {
          // If failed, use encodeURIComponent to handle Unicode characters
    const encodedStr = encodeURIComponent(str);
    return btoa(unescape(encodedStr));
  }
}

// Generate SVG default image
export function generateDefaultImage(name: string, symbol: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'
  ];
  
  const bgColor = colors[Math.floor(Math.random() * colors.length)];
  const textColor = '#ffffff';
  
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="400" height="400" fill="url(#grad)"/>
      
      <!-- Decorative circles -->
      <circle cx="100" cy="100" r="30" fill="${textColor}" opacity="0.1"/>
      <circle cx="300" cy="300" r="40" fill="${textColor}" opacity="0.1"/>
      <circle cx="350" cy="80" r="20" fill="${textColor}" opacity="0.1"/>
      
      <!-- Main text -->
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            text-anchor="middle" fill="${textColor}" filter="url(#glow)">
        ${name}
      </text>
      
      <!-- Symbol -->
      <text x="200" y="220" font-family="Arial, sans-serif" font-size="18" 
            text-anchor="middle" fill="${textColor}" opacity="0.8">
        ${symbol}
      </text>
      
      <!-- Decorative text -->
      <text x="200" y="320" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" fill="${textColor}" opacity="0.6">
        SecretNFT
      </text>
      
      <!-- Animation effects -->
      <style>
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        text { animation: pulse 2s ease-in-out infinite; }
      </style>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${safeBase64Encode(svg)}`;
}

// Generate simple placeholder image
export function generateSimplePlaceholder(name: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const bgColor = colors[Math.floor(Math.random() * colors.length)];
  
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${bgColor}"/>
      <text x="200" y="200" font-family="Arial, sans-serif" font-size="20" 
            text-anchor="middle" fill="white" dominant-baseline="middle">
        ${name}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${safeBase64Encode(svg)}`;
}

// Get default image URL
export function getDefaultImageUrl(name: string, symbol?: string): string {
      // Use simple test image
  const simpleSvg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#6366f1"/>
      <text x="200" y="200" font-family="Arial" font-size="24" text-anchor="middle" fill="white" dominant-baseline="middle">
        ${name}
      </text>
    </svg>
  `;
  
  try {
    const base64 = safeBase64Encode(simpleSvg);
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
          // Return a simple fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzYzNjZmMSIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5ORlQ8L3RleHQ+PC9zdmc+';
  }
}
