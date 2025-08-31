// Environment variable test function

export function testEnvironmentVariables() {
  console.log('=== Environment Variables Test ===');
  
  // Test Vite environment variables
  console.log('VITE_PINATA_JWT:', import.meta.env.VITE_PINATA_JWT ? '✅ Found' : '❌ Not found');
  console.log('VITE_IPFS_GATEWAY:', import.meta.env.VITE_IPFS_GATEWAY || '❌ Not found');
  console.log('VITE_SECRET_NFT_LAUNCH_ADDRESS:', import.meta.env.VITE_SECRET_NFT_LAUNCH_ADDRESS || '❌ Not found');
  
  // Test JWT token format
  const jwt = import.meta.env.VITE_PINATA_JWT;
  if (jwt) {
    console.log('JWT Token length:', jwt.length);
    console.log('JWT Token starts with:', jwt.substring(0, 20) + '...');
    
    // Check if it's a valid JWT format
    const parts = jwt.split('.');
    if (parts.length === 3) {
      console.log('✅ JWT format appears valid (3 parts)');
    } else {
      console.log('❌ JWT format appears invalid');
    }
  }
  
  // Test all environment variables
  console.log('All VITE_ environment variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
  
  console.log('=== End Environment Variables Test ===');
}

// Available in browser console
if (typeof window !== 'undefined') {
  (window as any).testEnvVars = testEnvironmentVariables;
  console.log('Environment test function available: window.testEnvVars()');
}
