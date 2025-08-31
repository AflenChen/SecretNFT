import { ethers } from 'ethers';

// 检查合约状态的工具

// 检查合约是否有代码
export async function checkContractCode(address: string, provider: ethers.Provider) {
  try {
    console.log('=== Checking Contract Code ===');
    console.log('Address:', address);
    
    const code = await provider.getCode(address);
    console.log('Contract code length:', code.length);
    console.log('Has code:', code !== '0x');
    
    if (code === '0x') {
      console.log('❌ Contract has no code - address is empty');
      return false;
    } else {
      console.log('✅ Contract has code');
      return true;
    }
  } catch (error) {
    console.error('Error checking contract code:', error);
    return false;
  }
}

// 检查NFT合约的基本函数
export async function checkNFTContract(address: string, provider: ethers.Provider) {
  try {
    console.log('=== Checking NFT Contract ===');
    console.log('Address:', address);
    
    const nftABI = [
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function totalSupply() external view returns (uint256)",
      "function baseURI() external view returns (string)"
    ];
    
    const nftContract = new ethers.Contract(address, nftABI, provider);
    
    // 检查每个函数
    const results = {};
    
    try {
      const name = await nftContract.name();
      console.log('✅ name():', name);
      results.name = name;
    } catch (error) {
      console.log('❌ name() failed:', error.message);
      results.name = null;
    }
    
    try {
      const symbol = await nftContract.symbol();
      console.log('✅ symbol():', symbol);
      results.symbol = symbol;
    } catch (error) {
      console.log('❌ symbol() failed:', error.message);
      results.symbol = null;
    }
    
    try {
      const totalSupply = await nftContract.totalSupply();
      console.log('✅ totalSupply():', totalSupply.toString());
      results.totalSupply = totalSupply.toString();
    } catch (error) {
      console.log('❌ totalSupply() failed:', error.message);
      results.totalSupply = null;
    }
    
    try {
      const baseURI = await nftContract.baseURI();
      console.log('✅ baseURI():', baseURI);
      results.baseURI = baseURI;
    } catch (error) {
      console.log('❌ baseURI() failed:', error.message);
      results.baseURI = null;
    }
    
    return results;
  } catch (error) {
    console.error('Error checking NFT contract:', error);
    return null;
  }
}

// 检查Launch合约状态
export async function checkLaunchContract(launchContract: ethers.Contract) {
  try {
    console.log('=== Checking Launch Contract ===');
    
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
    console.error('Error checking launch contract:', error);
  }
}

// 完整的合约状态检查
export async function fullContractStatusCheck(
  nftAddress: string,
  launchContract: ethers.Contract,
  provider: ethers.Provider
) {
  console.log('=== FULL CONTRACT STATUS CHECK ===');
  
  // 1. 检查NFT合约代码
  const hasCode = await checkContractCode(nftAddress, provider);
  
  // 2. 如果合约有代码，检查NFT函数
  let nftInfo = null;
  if (hasCode) {
    nftInfo = await checkNFTContract(nftAddress, provider);
  }
  
  // 3. 检查Launch合约
  await checkLaunchContract(launchContract);
  
  return {
    nftAddress,
    hasCode,
    nftInfo
  };
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).checkContractStatus = {
    checkContractCode,
    checkNFTContract,
    checkLaunchContract,
    fullContractStatusCheck
  };
  console.log('Contract status check utils available: window.checkContractStatus');
}
