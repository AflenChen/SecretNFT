import { ethers } from 'ethers';

// 合约工具函数

// 验证launch数据的真实性
export async function validateLaunchData(
  contract: ethers.Contract,
  launchId: number,
  expectedData: any
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // 获取合约中的实际数据
    const launchData = await contract.getLaunch(launchId);
    const participants = await contract.getParticipants(launchId);
    
    // 验证数据
    if (launchData[0] !== expectedData.nftContract) {
      errors.push(`NFT Contract mismatch: expected ${expectedData.nftContract}, got ${launchData[0]}`);
    }
    
    if (Number(launchData[1]) !== expectedData.totalSupply) {
      errors.push(`Total Supply mismatch: expected ${expectedData.totalSupply}, got ${launchData[1]}`);
    }
    
    if (Number(launchData[2]) !== expectedData.startTime) {
      errors.push(`Start Time mismatch: expected ${expectedData.startTime}, got ${launchData[2]}`);
    }
    
    if (Number(launchData[3]) !== expectedData.endTime) {
      errors.push(`End Time mismatch: expected ${expectedData.endTime}, got ${launchData[3]}`);
    }
    
    const actualPrice = ethers.formatEther(launchData[4]);
    if (actualPrice !== expectedData.price) {
      errors.push(`Price mismatch: expected ${expectedData.price}, got ${actualPrice}`);
    }
    
    if (launchData[5] !== expectedData.isActive) {
      errors.push(`Active status mismatch: expected ${expectedData.isActive}, got ${launchData[5]}`);
    }
    
    if (launchData[6] !== expectedData.isFinalized) {
      errors.push(`Finalized status mismatch: expected ${expectedData.isFinalized}, got ${launchData[6]}`);
    }
    
    if (participants.length !== expectedData.participants) {
      errors.push(`Participants count mismatch: expected ${expectedData.participants}, got ${participants.length}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Validation error: ${error}`);
    return {
      isValid: false,
      errors
    };
  }
}

// 获取launch的详细统计信息
export async function getLaunchStats(
  contract: ethers.Contract,
  launchId: number
): Promise<{
  totalRaised: string;
  totalSold: number;
  participantCount: number;
  averagePurchase: string;
}> {
  try {
    const participants = await contract.getParticipants(launchId);
    let totalRaised = ethers.parseEther('0');
    let totalSold = 0;
    
    // 计算总筹集金额和总销售数量
    for (const participant of participants) {
      const participation = await contract.getUserParticipation(launchId, participant);
      totalRaised += participation[0]; // amountPaid
      totalSold += Number(participation[1]); // tokensBought
    }
    
    const averagePurchase = participants.length > 0 
      ? ethers.formatEther(totalRaised / BigInt(participants.length))
      : '0';
    
    return {
      totalRaised: ethers.formatEther(totalRaised),
      totalSold,
      participantCount: participants.length,
      averagePurchase
    };
  } catch (error) {
    console.error('Error getting launch stats:', error);
    return {
      totalRaised: '0',
      totalSold: 0,
      participantCount: 0,
      averagePurchase: '0'
    };
  }
}

// 验证用户参与数据
export async function validateUserParticipation(
  contract: ethers.Contract,
  launchId: number,
  userAddress: string,
  expectedParticipation: any
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const participation = await contract.getUserParticipation(launchId, userAddress);
    
    const actualAmountPaid = ethers.formatEther(participation[0]);
    if (actualAmountPaid !== expectedParticipation.amountPaid) {
      errors.push(`Amount paid mismatch: expected ${expectedParticipation.amountPaid}, got ${actualAmountPaid}`);
    }
    
    if (Number(participation[1]) !== expectedParticipation.tokensBought) {
      errors.push(`Tokens bought mismatch: expected ${expectedParticipation.tokensBought}, got ${participation[1]}`);
    }
    
    if (participation[2] !== expectedParticipation.hasClaimed) {
      errors.push(`Claimed status mismatch: expected ${expectedParticipation.hasClaimed}, got ${participation[2]}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push(`Validation error: ${error}`);
    return {
      isValid: false,
      errors
    };
  }
}

// 格式化大数字显示
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 格式化ETH金额显示
export function formatETH(amount: string): string {
  const num = parseFloat(amount);
  if (num >= 1) {
    return num.toFixed(4);
  } else if (num >= 0.001) {
    return num.toFixed(6);
  } else {
    return num.toFixed(8);
  }
}
