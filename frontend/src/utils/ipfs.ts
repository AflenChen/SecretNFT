// IPFS上传工具函数
export interface IPFSUploadResult {
  hash: string;
  url: string;
  gateway: string;
}

// 使用Pinata IPFS服务（需要API密钥）
export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    console.log('Starting IPFS upload for file:', file.name, 'Size:', file.size, 'bytes');
    
    // 检查环境变量
    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT || pinataJWT === 'your-pinata-jwt-token') {
      throw new Error('Pinata JWT token not configured. Please check your .env file.');
    }
    
    console.log('Pinata JWT token found, length:', pinataJWT.length);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加元数据
    const metadata = {
      name: file.name,
      description: `Uploaded via SecretNFT platform`,
      keyvalues: {
        platform: 'SecretNFT',
        timestamp: new Date().toISOString()
      }
    };
    formData.append('pinataMetadata', JSON.stringify(metadata));

    console.log('Sending request to Pinata...');
    
    // 使用Pinata API上传
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`
      },
      body: formData
    });

    console.log('Pinata response status:', response.status);
    console.log('Pinata response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata API error response:', errorText);
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Pinata upload successful:', result);
    
    const uploadResult = {
      hash: result.IpfsHash,
      url: `ipfs://${result.IpfsHash}`,
      gateway: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    };
    
    console.log('Upload result:', uploadResult);
    return uploadResult;
    
  } catch (error) {
    console.error('IPFS upload error:', error);
    
    // 不要返回模拟数据，而是抛出错误
    throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 上传NFT元数据到IPFS
export async function uploadMetadataToIPFS(metadata: any): Promise<IPFSUploadResult> {
  try {
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    });

    return await uploadToIPFS(metadataFile);
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
}

// 从IPFS获取图片URL
export function getIPFSImageUrl(ipfsHash: string, gateway: string = 'https://gateway.pinata.cloud'): string {
  if (!ipfsHash) return '';
  
  // 如果已经是完整URL，直接返回
  if (ipfsHash.startsWith('http')) {
    return ipfsHash;
  }
  
  // 如果是IPFS协议格式，转换为HTTP URL
  if (ipfsHash.startsWith('ipfs://')) {
    const hash = ipfsHash.replace('ipfs://', '');
    return `${gateway}/ipfs/${hash}`;
  }
  
  // 如果只是哈希值，直接拼接
  return `${gateway}/ipfs/${ipfsHash}`;
}

// 检查NFT是否过期
export function isNFTExpired(endTime: number): boolean {
  return Date.now() > endTime * 1000;
}

// 获取NFT状态
export function getNFTStatus(startTime: number, endTime: number): 'upcoming' | 'active' | 'expired' {
  const now = Date.now() / 1000;
  
  if (now < startTime) {
    return 'upcoming';
  } else if (now >= startTime && now <= endTime) {
    return 'active';
  } else {
    return 'expired';
  }
}
