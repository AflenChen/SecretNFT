import { ethers } from 'ethers';

// NFT工具函数

export interface NFTInfo {
  name: string;
  symbol: string;
  baseURI: string;
  totalSupply: number;
  currentTokenId: number;
  imageUrl?: string;
}

// 获取NFT合约的完整信息
export async function getNFTInfo(
  nftContractAddress: string,
  provider: ethers.Provider
): Promise<NFTInfo> {
  try {
    const nftABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function baseURI() external view returns (string)",
      "function totalSupply() external view returns (uint256)",
      "function currentTokenId() external view returns (uint256)",
      "function maxSupply() external view returns (uint256)"
    ];
    
    const nftContract = new ethers.Contract(nftContractAddress, nftABI, provider);
    
    const [name, symbol, baseURI, totalSupply, currentTokenId] = await Promise.all([
      nftContract.name(),
      nftContract.symbol(),
      nftContract.baseURI(),
      nftContract.totalSupply(),
      nftContract.currentTokenId()
    ]);
    
    return {
      name,
      symbol,
      baseURI,
      totalSupply: Number(totalSupply),
      currentTokenId: Number(currentTokenId)
    };
  } catch (error) {
    console.error('Error getting NFT info:', error);
    throw error;
  }
}

// 从baseURI构建图片URL
export function buildImageUrlFromBaseURI(baseURI: string, imageName: string = 'image.png'): string {
  if (!baseURI || baseURI === '') {
    return '';
  }
  
  try {
    if (baseURI.startsWith('ipfs://')) {
      // IPFS协议URL，转换为HTTP网关URL
      const ipfsHash = baseURI.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}/${imageName}`;
    } else if (baseURI.startsWith('http')) {
      // HTTP URL，直接拼接
      return `${baseURI}${imageName}`;
    } else {
      // 其他情况，尝试构建完整URL
      return `${baseURI}/${imageName}`;
    }
  } catch (error) {
    console.error('Error building image URL:', error);
    return '';
  }
}

// 获取NFT的图片URL
export async function getNFTImageUrl(
  nftContractAddress: string,
  provider: ethers.Provider,
  fallbackImageUrl?: string
): Promise<string> {
  try {
    const nftInfo = await getNFTInfo(nftContractAddress, provider);
    
    if (nftInfo.baseURI) {
      const imageUrl = buildImageUrlFromBaseURI(nftInfo.baseURI);
      if (imageUrl) {
        return imageUrl;
      }
    }
    
    // 如果没有baseURI或构建失败，使用fallback
    return fallbackImageUrl || `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(nftInfo.name)}`;
  } catch (error) {
    console.error('Error getting NFT image URL:', error);
    return fallbackImageUrl || 'https://via.placeholder.com/400x400/6366f1/ffffff?text=NFT';
  }
}

// 验证IPFS URL是否可访问
export async function validateIPFSImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error validating IPFS image URL:', error);
    return false;
  }
}

// 获取NFT的元数据
export async function getNFTMetadata(
  nftContractAddress: string,
  tokenId: number,
  provider: ethers.Provider
): Promise<any> {
  try {
    const nftABI = [
      "function tokenURI(uint256 tokenId) external view returns (string)"
    ];
    
    const nftContract = new ethers.Contract(nftContractAddress, nftABI, provider);
    const tokenURI = await nftContract.tokenURI(tokenId);
    
    if (tokenURI) {
      const response = await fetch(tokenURI);
      if (response.ok) {
        return await response.json();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    return null;
  }
}
