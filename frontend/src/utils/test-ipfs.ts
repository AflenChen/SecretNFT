// IPFS upload test script
import { uploadToIPFS } from './ipfs';

// Test function
export async function testIPFSUpload() {
  try {
    console.log('Testing IPFS upload...');
    
    // Create a test file
    const testContent = 'Hello from SecretNFT! This is a test file for IPFS upload.';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('Test file created:', testFile.name, testFile.size, 'bytes');
    
    // Upload to IPFS
    const result = await uploadToIPFS(testFile);
    
    console.log('✅ IPFS upload successful!');
    console.log('Hash:', result.hash);
    console.log('URL:', result.url);
    console.log('Gateway:', result.gateway);
    
    return result;
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    throw error;
  }
}

// Run test in browser console
if (typeof window !== 'undefined') {
  window.testIPFSUpload = testIPFSUpload;
  console.log('IPFS test function available: window.testIPFSUpload()');
}
