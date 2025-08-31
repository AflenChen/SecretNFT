import { ethers } from 'ethers';

// 调试NFT Collection的简单工具

// 简单地从交易哈希获取NFT Collection地址
export async function debugGetNFTCollection(txHash: string, provider: ethers.Provider) {
  try {
    console.log('=== DEBUG: Getting NFT Collection ===');
    console.log('Transaction hash:', txHash);
    
    // 获取交易收据
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log('Transaction receipt:', receipt);
    
    // 检查日志
    console.log('Transaction logs:', receipt.logs);
    
    // 尝试解析每个日志
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`Log ${i}:`, {
        address: log.address,
        topics: log.topics,
        data: log.data
      });
      
      // 检查是否是NFTCollectionCreated事件
      // 事件签名: NFTCollectionCreated(address,address,string,string,uint256)
      // 主题0: keccak256("NFTCollectionCreated(address,address,string,string,uint256)")
      const eventSignature = ethers.keccak256(ethers.toUtf8Bytes("NFTCollectionCreated(address,address,string,string,uint256)"));
      console.log('Event signature:', eventSignature);
      console.log('Log topic 0:', log.topics[0]);
      
      if (log.topics[0] === eventSignature) {
        console.log('✅ Found NFTCollectionCreated event!');
        
        // 解析事件数据
        const factoryABI = [
          "event NFTCollectionCreated(address indexed collection, address indexed creator, string name, string symbol, uint256 maxSupply)"
        ];
        
        try {
          const factoryInterface = new ethers.Interface(factoryABI);
          const parsedLog = factoryInterface.parseLog(log);
          console.log('Parsed event:', parsedLog);
          
          const collectionAddress = parsedLog.args[0];
          console.log('🎉 NFT Collection address:', collectionAddress);
          return collectionAddress;
        } catch (error) {
          console.error('Failed to parse event:', error);
        }
      }
    }
    
    console.log('❌ No NFTCollectionCreated event found');
    return null;
  } catch (error) {
    console.error('Error in debugGetNFTCollection:', error);
    return null;
  }
}

// 检查合约地址是否有代码
export async function debugCheckContract(address: string, provider: ethers.Provider) {
  try {
    console.log('=== DEBUG: Checking Contract ===');
    console.log('Address:', address);
    
    const code = await provider.getCode(address);
    console.log('Contract code:', code);
    console.log('Code length:', code.length);
    console.log('Has code:', code !== '0x');
    
    return code !== '0x';
  } catch (error) {
    console.error('Error checking contract:', error);
    return false;
  }
}

// 检查用户的所有NFT Collections
export async function debugGetUserCollections(factoryAddress: string, userAddress: string, provider: ethers.Provider) {
  try {
    console.log('=== DEBUG: Getting User Collections ===');
    console.log('Factory address:', factoryAddress);
    console.log('User address:', userAddress);
    
    const factoryABI = [
      "function getCollectionsByCreator(address creator) external view returns (address[])"
    ];
    
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);
    const collections = await factoryContract.getCollectionsByCreator(userAddress);
    
    console.log('User collections:', collections);
    return collections;
  } catch (error) {
    console.error('Error getting user collections:', error);
    return [];
  }
}

// 检查Launch合约状态
export async function debugLaunchContract(launchContract: ethers.Contract) {
  try {
    console.log('=== DEBUG: Launch Contract ===');
    
    const nextId = await launchContract.nextLaunchId();
    console.log('Next launch ID:', nextId.toString());
    
    if (Number(nextId) > 0) {
      console.log('Existing launches:');
      for (let i = 0; i < Number(nextId); i++) {
        try {
          const launch = await launchContract.getLaunch(i);
          console.log(`Launch ${i}:`, {
            nftContract: launch[0],
            totalSupply: launch[1].toString(),
            startTime: launch[2].toString(),
            endTime: launch[3].toString(),
            price: ethers.formatEther(launch[4]),
            isActive: launch[5],
            isFinalized: launch[6],
            paymentToken: launch[7]
          });
        } catch (error) {
          console.error(`Error getting launch ${i}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error debugging launch contract:', error);
  }
}

// 完整的调试流程
export async function debugNFTCollectionFlow(
  txHash: string,
  factoryAddress: string,
  launchContract: ethers.Contract,
  provider: ethers.Provider,
  userAddress: string
) {
  console.log('=== FULL NFT COLLECTION DEBUG ===');
  
  // 1. 从交易获取NFT Collection
  const nftAddress = await debugGetNFTCollection(txHash, provider);
  
  if (nftAddress) {
    // 2. 检查NFT Collection合约
    const hasCode = await debugCheckContract(nftAddress, provider);
    console.log('NFT Collection has code:', hasCode);
    
    // 3. 检查用户的所有Collections
    const userCollections = await debugGetUserCollections(factoryAddress, userAddress, provider);
    console.log('User collections:', userCollections);
    
    // 4. 检查Launch合约状态
    await debugLaunchContract(launchContract);
  }
  
  return { nftAddress, hasCode: nftAddress ? await debugCheckContract(nftAddress, provider) : false };
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).debugNFTCollection = {
    debugGetNFTCollection,
    debugCheckContract,
    debugGetUserCollections,
    debugLaunchContract,
    debugNFTCollectionFlow
  };
  console.log('NFT Collection debug utils available: window.debugNFTCollection');
}
