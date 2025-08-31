import { ethers } from 'ethers';

// 注册NFT Collection创建者并创建Launch的工具

// 注册NFT Collection创建者
export async function registerNFTCollectionCreator(
  nftAddress: string,
  creatorAddress: string,
  launchContract: ethers.Contract
): Promise<boolean> {
  try {
    console.log('=== Registering NFT Collection Creator ===');
    console.log('NFT Address:', nftAddress);
    console.log('Creator Address:', creatorAddress);
    
    const tx = await launchContract.registerNFTCollectionCreator(nftAddress, creatorAddress);
    console.log('Registration transaction sent:', tx.hash);
    await tx.wait();
    console.log('✅ NFT Collection creator registered successfully');
    
    return true;
  } catch (error) {
    console.error('Error registering NFT Collection creator:', error);
    return false;
  }
}

// 为NFT Collection创建Launch（现在创建者可以调用）
export async function createLaunchForCreator(
  nftAddress: string,
  launchContract: ethers.Contract,
  signer: ethers.Signer,
  totalSupply: number = 1000,
  price: string = '0.1'
): Promise<string | null> {
  try {
    console.log('=== Creating Launch for NFT Collection Creator ===');
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
    console.log('✅ Launch created successfully!');
    console.log('Transaction receipt:', receipt);
    
    return tx.hash;
  } catch (error) {
    console.error('Error creating launch for NFT Collection:', error);
    return null;
  }
}

// 完整的注册和创建Launch流程
export async function registerAndCreateLaunch(
  nftAddress: string,
  creatorAddress: string,
  launchContract: ethers.Contract,
  signer: ethers.Signer
): Promise<any> {
  try {
    console.log('=== REGISTER AND CREATE LAUNCH ===');
    console.log('NFT Address:', nftAddress);
    console.log('Creator Address:', creatorAddress);
    
    // 1. 注册NFT Collection创建者
    console.log('Step 1: Registering NFT Collection creator...');
    const registrationSuccess = await registerNFTCollectionCreator(
      nftAddress,
      creatorAddress,
      launchContract
    );
    
    if (!registrationSuccess) {
      throw new Error('Failed to register NFT Collection creator');
    }
    
    // 2. 创建Launch
    console.log('Step 2: Creating launch...');
    const launchTxHash = await createLaunchForCreator(
      nftAddress,
      launchContract,
      signer
    );
    
    if (launchTxHash) {
      console.log('✅ Registration and launch creation completed successfully');
      return {
        success: true,
        nftAddress,
        creatorAddress,
        launchTxHash,
        message: 'Registration and launch creation completed successfully'
      };
    } else {
      throw new Error('Failed to create launch');
    }
  } catch (error) {
    console.error('Error in register and create launch:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).registerAndCreateLaunch = {
    registerNFTCollectionCreator,
    createLaunchForCreator,
    registerAndCreateLaunch
  };
  console.log('Register and create launch utils available: window.registerAndCreateLaunch');
}
