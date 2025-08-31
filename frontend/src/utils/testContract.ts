import { ethers } from 'ethers';

// 测试合约调用的工具函数

// 测试createLaunch函数调用
export async function testCreateLaunch(
  contract: ethers.Contract,
  nftContractAddress: string,
  totalSupply: number,
  startTime: number,
  endTime: number,
  price: string
): Promise<boolean> {
  try {
    console.log('=== Testing createLaunch ===');
    console.log('NFT Contract:', nftContractAddress);
    console.log('Total Supply:', totalSupply);
    console.log('Start Time:', startTime, '(', new Date(startTime * 1000).toISOString(), ')');
    console.log('End Time:', endTime, '(', new Date(endTime * 1000).toISOString(), ')');
    console.log('Price:', price);
    
    // 验证参数
    if (nftContractAddress === ethers.ZeroAddress) {
      console.error('Invalid NFT contract address');
      return false;
    }
    
    if (totalSupply === 0) {
      console.error('Total supply must be greater than 0');
      return false;
    }
    
    if (startTime >= endTime) {
      console.error('End time must be after start time');
      return false;
    }
    
    const priceWei = ethers.parseEther(price);
    if (priceWei === 0n) {
      console.error('Price must be greater than 0');
      return false;
    }
    
    console.log('All parameters are valid');
    console.log('Price in Wei:', priceWei.toString());
    
    // 尝试调用合约（不发送交易，只估算gas）
    const gasEstimate = await contract.createLaunch.estimateGas(
      nftContractAddress,
      totalSupply,
      startTime,
      endTime,
      priceWei,
      ethers.ZeroAddress
    );
    
    console.log('Gas estimate:', gasEstimate.toString());
    console.log('createLaunch call would succeed');
    return true;
    
  } catch (error) {
    console.error('createLaunch test failed:', error);
    return false;
  }
}

// 测试getLaunch函数调用
export async function testGetLaunch(
  contract: ethers.Contract,
  launchId: number
): Promise<any> {
  try {
    console.log('=== Testing getLaunch ===');
    console.log('Launch ID:', launchId);
    
    const launchData = await contract.getLaunch(launchId);
    
    console.log('Launch data:', {
      nftContract: launchData[0],
      totalSupply: launchData[1].toString(),
      startTime: launchData[2].toString(),
      endTime: launchData[3].toString(),
      publicPrice: ethers.formatEther(launchData[4]),
      isActive: launchData[5],
      isFinalized: launchData[6],
      paymentToken: launchData[7]
    });
    
    return launchData;
  } catch (error) {
    console.error('getLaunch test failed:', error);
    throw error;
  }
}

// 测试nextLaunchId
export async function testNextLaunchId(
  contract: ethers.Contract
): Promise<number> {
  try {
    console.log('=== Testing nextLaunchId ===');
    
    const nextId = await contract.nextLaunchId();
    console.log('Next Launch ID:', nextId.toString());
    
    return Number(nextId);
  } catch (error) {
    console.error('nextLaunchId test failed:', error);
    throw error;
  }
}

// 测试owner
export async function testOwner(
  contract: ethers.Contract
): Promise<string> {
  try {
    console.log('=== Testing owner ===');
    
    const owner = await contract.owner();
    console.log('Contract owner:', owner);
    
    return owner;
  } catch (error) {
    console.error('owner test failed:', error);
    throw error;
  }
}

// 完整的合约测试
export async function fullContractTest(
  contract: ethers.Contract,
  nftContractAddress: string
): Promise<any> {
  try {
    console.log('=== FULL CONTRACT TEST ===');
    
    // 测试owner
    const owner = await testOwner(contract);
    
    // 测试nextLaunchId
    const nextId = await testNextLaunchId(contract);
    
    // 测试createLaunch参数
    const now = Math.floor(Date.now() / 1000);
    const endTime = now + 24 * 60 * 60; // 24小时后
    const testResult = await testCreateLaunch(
      contract,
      nftContractAddress,
      1000,
      now,
      endTime,
      '0.1'
    );
    
    // 如果有现有的launch，测试getLaunch
    let existingLaunch = null;
    if (nextId > 0) {
      try {
        existingLaunch = await testGetLaunch(contract, 0);
      } catch (error) {
        console.log('No existing launches to test');
      }
    }
    
    const result = {
      owner,
      nextLaunchId: nextId,
      createLaunchTest: testResult,
      existingLaunch
    };
    
    console.log('=== FULL CONTRACT TEST RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('Full contract test failed:', error);
    throw error;
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).testContract = {
    testCreateLaunch,
    testGetLaunch,
    testNextLaunchId,
    testOwner,
    fullContractTest
  };
  console.log('Contract test utils available: window.testContract');
}
