import { ethers } from 'ethers';

// 查找NFT Collection的工具函数

// 从交易哈希中获取NFT Collection地址
export async function getNFTCollectionFromTx(
  txHash: string,
  provider: ethers.Provider
): Promise<string | null> {
  try {
    console.log('Getting NFT Collection from transaction:', txHash);
    
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log('Transaction receipt:', receipt);
    
    // 查找NFTCollectionCreated事件
    const factoryABI = [
      "event NFTCollectionCreated(address indexed collection, address indexed creator, string name, string symbol, uint256 maxSupply)"
    ];
    
    const factoryInterface = new ethers.Interface(factoryABI);
    
    for (const log of receipt.logs) {
      try {
        const parsedLog = factoryInterface.parseLog(log);
        if (parsedLog && parsedLog.name === 'NFTCollectionCreated') {
          const collectionAddress = parsedLog.args[0];
          console.log('Found NFT Collection:', collectionAddress);
          return collectionAddress;
        }
      } catch (error) {
        // 忽略无法解析的日志
        continue;
      }
    }
    
    console.log('No NFTCollectionCreated event found');
    return null;
  } catch (error) {
    console.error('Error getting NFT Collection from transaction:', error);
    return null;
  }
}

// 获取用户创建的所有NFT Collections
export async function getUserNFTCollections(
  factoryAddress: string,
  userAddress: string,
  provider: ethers.Provider
): Promise<string[]> {
  try {
    console.log('Getting NFT Collections for user:', userAddress);
    
    const factoryABI = [
      "function getCollectionsByCreator(address creator) external view returns (address[])"
    ];
    
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);
    const collections = await factoryContract.getCollectionsByCreator(userAddress);
    
    console.log('User NFT Collections:', collections);
    return collections;
  } catch (error) {
    console.error('Error getting user NFT Collections:', error);
    return [];
  }
}

// 检查NFT Collection是否已有Launch
export async function checkNFTCollectionLaunch(
  nftAddress: string,
  launchContract: ethers.Contract
): Promise<{ hasLaunch: boolean; launchId?: number }> {
  try {
    console.log('Checking if NFT Collection has launch:', nftAddress);
    
    const launchCount = await launchContract.nextLaunchId();
    
    for (let i = 0; i < launchCount; i++) {
      try {
        const launchData = await launchContract.getLaunch(i);
        if (launchData[0] === nftAddress) {
          console.log(`NFT Collection has launch ID: ${i}`);
          return { hasLaunch: true, launchId: i };
        }
      } catch (error) {
        console.error(`Error checking launch ${i}:`, error);
      }
    }
    
    console.log('NFT Collection has no launch');
    return { hasLaunch: false };
  } catch (error) {
    console.error('Error checking NFT Collection launch:', error);
    return { hasLaunch: false };
  }
}

// 为NFT Collection创建Launch
export async function createLaunchForNFTCollection(
  nftAddress: string,
  launchContract: ethers.Contract,
  signer: ethers.Signer,
  totalSupply: number = 1000,
  price: string = '0.1'
): Promise<string | null> {
  try {
    console.log('Creating launch for NFT Collection:', nftAddress);
    
    // 设置时间（立即开始，24小时后结束）
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + 24 * 60 * 60;
    const priceWei = ethers.parseEther(price);
    
    console.log('Launch parameters:', {
      nftAddress,
      totalSupply,
      startTime: now,
      endTime,
      price: ethers.formatEther(priceWei)
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
    
    return tx.hash;
  } catch (error) {
    console.error('Error creating launch for NFT Collection:', error);
    return null;
  }
}

// 完整的NFT Collection处理流程
export async function processNFTCollection(
  txHash: string,
  factoryAddress: string,
  launchContract: ethers.Contract,
  provider: ethers.Provider,
  signer: ethers.Signer
): Promise<any> {
  try {
    console.log('=== PROCESSING NFT COLLECTION ===');
    
    // 1. 从交易中获取NFT Collection地址
    const nftAddress = await getNFTCollectionFromTx(txHash, provider);
    if (!nftAddress) {
      throw new Error('Could not find NFT Collection from transaction');
    }
    
    // 2. 检查是否已有Launch
    const launchCheck = await checkNFTCollectionLaunch(nftAddress, launchContract);
    
    if (launchCheck.hasLaunch) {
      console.log('NFT Collection already has launch');
      return { nftAddress, hasLaunch: true, launchId: launchCheck.launchId };
    }
    
    // 3. 创建Launch
    const launchTxHash = await createLaunchForNFTCollection(
      nftAddress,
      launchContract,
      signer
    );
    
    if (launchTxHash) {
      console.log('Launch created successfully');
      return { nftAddress, hasLaunch: true, launchTxHash };
    } else {
      throw new Error('Failed to create launch');
    }
  } catch (error) {
    console.error('Error processing NFT Collection:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).findNFTCollection = {
    getNFTCollectionFromTx,
    getUserNFTCollections,
    checkNFTCollectionLaunch,
    createLaunchForNFTCollection,
    processNFTCollection
  };
  console.log('NFT Collection utils available: window.findNFTCollection');
}
