import { ethers } from 'ethers';

// 为NFT Collection创建Launch的工具

// 为指定的NFT Collection创建Launch
export async function createLaunchForNFT(
  nftAddress: string,
  launchContract: ethers.Contract,
  signer: ethers.Signer,
  totalSupply: number = 1000,
  price: string = '0.1'
): Promise<string | null> {
  try {
    console.log('=== Creating Launch for NFT Collection ===');
    console.log('NFT Address:', nftAddress);
    console.log('Total Supply:', totalSupply);
    console.log('Price:', price);
    
    // 设置时间（立即开始，24小时后结束）
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + 24 * 60 * 60; // 24小时后
    const priceWei = ethers.parseEther(price);
    
    console.log('Launch parameters:', {
      nftAddress,
      totalSupply,
      startTime: now,
      endTime,
      price: ethers.formatEther(priceWei),
      startTimeDate: new Date(now * 1000).toISOString(),
      endTimeDate: new Date(endTime * 1000).toISOString()
    });
    
    // 创建launch
    const tx = await launchContract.createLaunch(
      nftAddress,
      totalSupply,
      now,
      endTime,
      priceWei,
      ethers.ZeroAddress // paymentToken
    );
    
    console.log('Launch creation transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Launch created successfully!');
    console.log('Transaction receipt:', receipt);
    
    return tx.hash;
  } catch (error) {
    console.error('Error creating launch for NFT Collection:', error);
    return null;
  }
}

// 检查NFT Collection是否已有Launch
export async function checkNFTLaunch(
  nftAddress: string,
  launchContract: ethers.Contract
): Promise<{ hasLaunch: boolean; launchId?: number }> {
  try {
    console.log('=== Checking NFT Launch ===');
    console.log('NFT Address:', nftAddress);
    
    const launchCount = await launchContract.nextLaunchId();
    console.log('Total launches:', launchCount.toString());
    
    for (let i = 0; i < launchCount; i++) {
      try {
        const launch = await launchContract.getLaunch(i);
        console.log(`Launch ${i} NFT contract:`, launch[0]);
        
        if (launch[0] === nftAddress) {
          console.log(`✅ Found launch for NFT at ID: ${i}`);
          return { hasLaunch: true, launchId: i };
        }
      } catch (error) {
        console.error(`Error checking launch ${i}:`, error);
      }
    }
    
    console.log('❌ No launch found for this NFT');
    return { hasLaunch: false };
  } catch (error) {
    console.error('Error checking NFT launch:', error);
    return { hasLaunch: false };
  }
}

// 完整的NFT Launch处理流程
export async function processNFTLaunch(
  nftAddress: string,
  launchContract: ethers.Contract,
  signer: ethers.Signer
): Promise<any> {
  try {
    console.log('=== PROCESSING NFT LAUNCH ===');
    console.log('NFT Address:', nftAddress);
    
    // 1. 检查是否已有Launch
    const launchCheck = await checkNFTLaunch(nftAddress, launchContract);
    
    if (launchCheck.hasLaunch) {
      console.log('NFT Collection already has launch');
      return { 
        nftAddress, 
        hasLaunch: true, 
        launchId: launchCheck.launchId,
        message: 'Launch already exists'
      };
    }
    
    // 2. 创建Launch
    console.log('Creating new launch for NFT Collection...');
    const launchTxHash = await createLaunchForNFT(
      nftAddress,
      launchContract,
      signer
    );
    
    if (launchTxHash) {
      console.log('Launch created successfully');
      return { 
        nftAddress, 
        hasLaunch: true, 
        launchTxHash,
        message: 'Launch created successfully'
      };
    } else {
      throw new Error('Failed to create launch');
    }
  } catch (error) {
    console.error('Error processing NFT launch:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).createLaunchForNFT = {
    createLaunchForNFT,
    checkNFTLaunch,
    processNFTLaunch
  };
  console.log('NFT Launch utils available: window.createLaunchForNFT');
}
