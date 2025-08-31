import { ethers } from 'ethers';

// 详细的错误诊断工具

// 检查网络连接
export async function checkNetworkConnection(
  provider: ethers.Provider
): Promise<any> {
  try {
    console.log('=== Network Connection Check ===');
    
    const network = await provider.getNetwork();
    console.log('Network:', {
      name: network.name,
      chainId: network.chainId.toString(),
      isSepolia: network.chainId === 11155111n
    });
    
    const blockNumber = await provider.getBlockNumber();
    console.log('Current block number:', blockNumber);
    
    const gasPrice = await provider.getFeeData();
    console.log('Gas price:', {
      gasPrice: gasPrice.gasPrice?.toString(),
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
    });
    
    return {
      network,
      blockNumber,
      gasPrice
    };
  } catch (error) {
    console.error('Network connection check failed:', error);
    throw error;
  }
}

// 检查合约地址
export async function checkContractAddresses(
  provider: ethers.Provider,
  addresses: any
): Promise<any> {
  try {
    console.log('=== Contract Address Check ===');
    
    const results = {};
    
    for (const [name, address] of Object.entries(addresses)) {
      if (typeof address === 'string' && address.startsWith('0x')) {
        try {
          const code = await provider.getCode(address);
          const balance = await provider.getBalance(address);
          
          results[name] = {
            address,
            hasCode: code !== '0x',
            codeLength: code.length,
            balance: ethers.formatEther(balance)
          };
          
          console.log(`${name}:`, results[name]);
        } catch (error) {
          results[name] = {
            address,
            error: error.message
          };
          console.error(`Error checking ${name}:`, error);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Contract address check failed:', error);
    throw error;
  }
}

// 检查钱包连接
export async function checkWalletConnection(
  provider: ethers.Provider,
  signer: ethers.Signer
): Promise<any> {
  try {
    console.log('=== Wallet Connection Check ===');
    
    const address = await signer.getAddress();
    console.log('Connected address:', address);
    
    const balance = await provider.getBalance(address);
    console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');
    
    const nonce = await provider.getTransactionCount(address);
    console.log('Transaction nonce:', nonce);
    
    return {
      address,
      balance: ethers.formatEther(balance),
      nonce
    };
  } catch (error) {
    console.error('Wallet connection check failed:', error);
    throw error;
  }
}

// 测试合约基本功能
export async function testContractBasic(
  contract: ethers.Contract
): Promise<any> {
  try {
    console.log('=== Contract Basic Test ===');
    
    // 测试owner函数
    let owner = null;
    try {
      owner = await contract.owner();
      console.log('Contract owner:', owner);
    } catch (error) {
      console.error('owner() call failed:', error);
    }
    
    // 测试nextLaunchId函数
    let nextLaunchId = null;
    try {
      nextLaunchId = await contract.nextLaunchId();
      console.log('Next launch ID:', nextLaunchId.toString());
    } catch (error) {
      console.error('nextLaunchId() call failed:', error);
    }
    
    // 测试getLaunch函数（如果有launch）
    let launchData = null;
    if (nextLaunchId && Number(nextLaunchId) > 0) {
      try {
        launchData = await contract.getLaunch(0);
        console.log('Launch 0 data:', {
          nftContract: launchData[0],
          totalSupply: launchData[1].toString(),
          startTime: launchData[2].toString(),
          endTime: launchData[3].toString(),
          publicPrice: ethers.formatEther(launchData[4]),
          isActive: launchData[5],
          isFinalized: launchData[6],
          paymentToken: launchData[7]
        });
      } catch (error) {
        console.error('getLaunch(0) call failed:', error);
      }
    }
    
    return {
      owner,
      nextLaunchId: nextLaunchId?.toString(),
      launchData
    };
  } catch (error) {
    console.error('Contract basic test failed:', error);
    throw error;
  }
}

// 完整的错误诊断
export async function fullErrorDiagnosis(
  provider: ethers.Provider,
  signer: ethers.Signer,
  contract: ethers.Contract,
  addresses: any
): Promise<any> {
  try {
    console.log('=== FULL ERROR DIAGNOSIS ===');
    
    const results = {};
    
    // 1. 检查网络连接
    try {
      results.network = await checkNetworkConnection(provider);
    } catch (error) {
      results.network = { error: error.message };
    }
    
    // 2. 检查合约地址
    try {
      results.contracts = await checkContractAddresses(provider, addresses);
    } catch (error) {
      results.contracts = { error: error.message };
    }
    
    // 3. 检查钱包连接
    try {
      results.wallet = await checkWalletConnection(provider, signer);
    } catch (error) {
      results.wallet = { error: error.message };
    }
    
    // 4. 测试合约基本功能
    try {
      results.contract = await testContractBasic(contract);
    } catch (error) {
      results.contract = { error: error.message };
    }
    
    console.log('=== DIAGNOSIS COMPLETE ===');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Full error diagnosis failed:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).errorDiagnosis = {
    checkNetworkConnection,
    checkContractAddresses,
    checkWalletConnection,
    testContractBasic,
    fullErrorDiagnosis
  };
  console.log('Error diagnosis utils available: window.errorDiagnosis');
}
