import { ethers } from 'ethers';

// 手动创建launch的工具函数

// 为现有的NFT合约创建launch
export async function createLaunchForExistingNFT(
  launchContract: ethers.Contract,
  nftContractAddress: string,
  totalSupply: number,
  startTime: number,
  endTime: number,
  price: string,
  signer: ethers.Signer
): Promise<string> {
  try {
    console.log('Creating launch for existing NFT...');
    console.log('NFT Contract:', nftContractAddress);
    console.log('Total Supply:', totalSupply);
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    console.log('Price:', price);
    
    // 解析价格
    const priceWei = ethers.parseEther(price);
    
    // 创建launch
    const tx = await launchContract.createLaunch(
      nftContractAddress,
      totalSupply,
      startTime,
      endTime,
      priceWei,
      ethers.ZeroAddress // paymentToken
    );
    
    console.log('Launch creation transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Launch creation confirmed:', receipt);
    
    return tx.hash;
  } catch (error) {
    console.error('Error creating launch for existing NFT:', error);
    throw error;
  }
}

// 获取NFT工厂中的所有集合
export async function getAllNFTCollections(
  factoryAddress: string,
  provider: ethers.Provider
): Promise<string[]> {
  try {
    const factoryABI = [
      "function getAllCollections() external view returns (address[])"
    ];
    
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);
    const collections = await factoryContract.getAllCollections();
    
    console.log('All NFT collections:', collections);
    return collections;
  } catch (error) {
    console.error('Error getting NFT collections:', error);
    throw error;
  }
}

// 检查NFT合约是否已经有对应的launch
export async function checkNFTHasLaunch(
  nftContractAddress: string,
  launchContract: ethers.Contract
): Promise<boolean> {
  try {
    const launchCount = await launchContract.nextLaunchId();
    
    for (let i = 0; i < launchCount; i++) {
      const launchData = await launchContract.getLaunch(i);
      if (launchData[0] === nftContractAddress) {
        console.log(`NFT ${nftContractAddress} already has launch ID: ${i}`);
        return true;
      }
    }
    
    console.log(`NFT ${nftContractAddress} has no launch`);
    return false;
  } catch (error) {
    console.error('Error checking NFT launch:', error);
    throw error;
  }
}

// 为所有没有launch的NFT创建launch
export async function createLaunchesForAllNFTs(
  launchContract: ethers.Contract,
  factoryAddress: string,
  provider: ethers.Provider,
  signer: ethers.Signer
): Promise<string[]> {
  try {
    console.log('Creating launches for all NFTs...');
    
    // 获取所有NFT集合
    const collections = await getAllNFTCollections(factoryAddress, provider);
    console.log('Found collections:', collections);
    
    const createdLaunches: string[] = [];
    
    for (const nftAddress of collections) {
      try {
        // 检查是否已经有launch
        const hasLaunch = await checkNFTHasLaunch(nftAddress, launchContract);
        
        if (!hasLaunch) {
          console.log(`Creating launch for NFT: ${nftAddress}`);
          
          // 设置默认参数
          const now = Math.floor(Date.now() / 1000);
          const endTime = now + 24 * 60 * 60; // 24小时后结束
          const totalSupply = 1000;
          const price = '0.1';
          
          const txHash = await createLaunchForExistingNFT(
            launchContract,
            nftAddress,
            totalSupply,
            now,
            endTime,
            price,
            signer
          );
          
          createdLaunches.push(txHash);
          console.log(`Launch created for ${nftAddress}: ${txHash}`);
        }
      } catch (error) {
        console.error(`Failed to create launch for ${nftAddress}:`, error);
      }
    }
    
    console.log('Created launches:', createdLaunches);
    return createdLaunches;
  } catch (error) {
    console.error('Error creating launches for all NFTs:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).manualLaunch = {
    createLaunchForExistingNFT,
    getAllNFTCollections,
    checkNFTHasLaunch,
    createLaunchesForAllNFTs
  };
  console.log('Manual launch utils available: window.manualLaunch');
}
