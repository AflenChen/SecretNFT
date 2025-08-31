import { ethers } from 'ethers';

// Debug utility functions

// Check launch contract status
export async function debugLaunchContract(
  contract: ethers.Contract
): Promise<any> {
  try {
    console.log('=== Launch Contract Debug ===');
    
    // Get launch count
    const launchCount = await contract.nextLaunchId();
    console.log('Total launches:', launchCount.toString());
    
    // Get all launch information
    const launches = [];
    for (let i = 0; i < launchCount; i++) {
      try {
        const launchData = await contract.getLaunch(i);
        const participants = await contract.getParticipants(i);
        
        launches.push({
          id: i,
          nftContract: launchData[0],
          totalSupply: launchData[1].toString(),
          startTime: launchData[2].toString(),
          endTime: launchData[3].toString(),
          price: ethers.formatEther(launchData[4]),
          isActive: launchData[5],
          isFinalized: launchData[6],
          paymentToken: launchData[7],
          participants: participants.length
        });
      } catch (error) {
        console.error(`Error getting launch ${i}:`, error);
      }
    }
    
    console.log('All launches:', launches);
    return { launchCount: launchCount.toString(), launches };
  } catch (error) {
    console.error('Error debugging launch contract:', error);
    throw error;
  }
}

// Check NFT factory contract status
export async function debugNFTFactory(
  factoryAddress: string,
  provider: ethers.Provider
): Promise<any> {
  try {
    console.log('=== NFT Factory Debug ===');
    
    const factoryABI = [
      "function getAllCollections() external view returns (address[])",
      "function getCollectionsByCreator(address creator) external view returns (address[])",
      "function creationFee() external view returns (uint256)"
    ];
    
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);
    
    // Get creation fee
    const creationFee = await factoryContract.creationFee();
    console.log('Creation fee:', ethers.formatEther(creationFee), 'ETH');
    
    // Get all collections
    const allCollections = await factoryContract.getAllCollections();
    console.log('All collections:', allCollections);
    
    return { creationFee: ethers.formatEther(creationFee), allCollections };
  } catch (error) {
    console.error('Error debugging NFT factory:', error);
    throw error;
  }
}

// Check NFT contract status
export async function debugNFTContract(
  nftAddress: string,
  provider: ethers.Provider
): Promise<any> {
  try {
    console.log('=== NFT Contract Debug ===');
    console.log('NFT Address:', nftAddress);
    
    const nftABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function baseURI() external view returns (string)",
      "function totalSupply() external view returns (uint256)",
      "function currentTokenId() external view returns (uint256)",
      "function maxSupply() external view returns (uint256)",
      "function mintingEnabled() external view returns (bool)"
    ];
    
    const nftContract = new ethers.Contract(nftAddress, nftABI, provider);
    
    const [name, symbol, baseURI, totalSupply, currentTokenId, maxSupply, mintingEnabled] = await Promise.all([
      nftContract.name(),
      nftContract.symbol(),
      nftContract.baseURI(),
      nftContract.totalSupply(),
      nftContract.currentTokenId(),
      nftContract.maxSupply(),
      nftContract.mintingEnabled()
    ]);
    
    const nftInfo = {
      name,
      symbol,
      baseURI,
      totalSupply: totalSupply.toString(),
      currentTokenId: currentTokenId.toString(),
      maxSupply: maxSupply.toString(),
      mintingEnabled
    };
    
    console.log('NFT Info:', nftInfo);
    return nftInfo;
  } catch (error) {
    console.error('Error debugging NFT contract:', error);
    throw error;
  }
}

// 完整的调试函数
export async function fullDebug(
  launchContract: ethers.Contract,
  factoryAddress: string,
  provider: ethers.Provider
): Promise<any> {
  console.log('=== FULL DEBUG START ===');
  
  try {
    // 调试launch合约
    const launchDebug = await debugLaunchContract(launchContract);
    
    // 调试NFT工厂
    const factoryDebug = await debugNFTFactory(factoryAddress, provider);
    
    // 调试每个NFT合约
    const nftDebugs = [];
    for (const launch of launchDebug.launches) {
      console.log(`\n--- Debugging NFT Contract: ${launch.nftContract} ---`);
      try {
        const nftDebug = await debugNFTContract(launch.nftContract, provider);
        nftDebugs.push({ launchId: launch.id, nftContract: launch.nftContract, ...nftDebug });
      } catch (error) {
        console.error(`Failed to debug NFT contract ${launch.nftContract}:`, error);
        nftDebugs.push({ launchId: launch.id, nftContract: launch.nftContract, error: error.message });
      }
    }
    
    const result = {
      launchContract: launchDebug,
      nftFactory: factoryDebug,
      nftContracts: nftDebugs
    };
    
    console.log('=== FULL DEBUG RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error in full debug:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).debugUtils = {
    debugLaunchContract,
    debugNFTFactory,
    debugNFTContract,
    fullDebug
  };
  console.log('Debug utils available: window.debugUtils');
}
