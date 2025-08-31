import { ethers } from 'ethers';

// 检查owner的工具

// 检查Launch合约的owner
export async function checkLaunchOwner(launchContract: ethers.Contract) {
  try {
    console.log('=== Checking Launch Contract Owner ===');
    
    const owner = await launchContract.owner();
    console.log('Launch contract owner:', owner);
    
    return owner;
  } catch (error) {
    console.error('Error checking launch owner:', error);
    return null;
  }
}

// 检查当前用户是否是owner
export async function checkIfUserIsOwner(
  launchContract: ethers.Contract,
  userAddress: string
) {
  try {
    console.log('=== Checking If User Is Owner ===');
    console.log('User address:', userAddress);
    
    const owner = await launchContract.owner();
    console.log('Launch contract owner:', owner);
    
    const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
    console.log('Is user owner:', isOwner);
    
    return { owner, isOwner };
  } catch (error) {
    console.error('Error checking if user is owner:', error);
    return { owner: null, isOwner: false };
  }
}

// 获取部署者地址（从部署脚本中获取）
export function getDeployerAddress() {
  // 从部署日志中获取的部署者地址
  const deployerAddress = '0x764DCef1a9De771443f472B7160cC86691F90499';
  console.log('Deployer address:', deployerAddress);
  return deployerAddress;
}

// 完整的权限检查
export async function fullPermissionCheck(
  launchContract: ethers.Contract,
  userAddress: string
) {
  console.log('=== FULL PERMISSION CHECK ===');
  
  const ownerCheck = await checkIfUserIsOwner(launchContract, userAddress);
  const deployerAddress = getDeployerAddress();
  
  console.log('Permission check results:', {
    userAddress,
    contractOwner: ownerCheck.owner,
    deployerAddress,
    isUserOwner: ownerCheck.isOwner,
    isUserDeployer: userAddress.toLowerCase() === deployerAddress.toLowerCase()
  });
  
  return {
    userAddress,
    contractOwner: ownerCheck.owner,
    deployerAddress,
    isUserOwner: ownerCheck.isOwner,
    isUserDeployer: userAddress.toLowerCase() === deployerAddress.toLowerCase()
  };
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).checkOwner = {
    checkLaunchOwner,
    checkIfUserIsOwner,
    getDeployerAddress,
    fullPermissionCheck
  };
  console.log('Owner check utils available: window.checkOwner');
}
