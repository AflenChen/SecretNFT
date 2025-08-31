import { ethers } from 'ethers';

// Simplified error diagnosis tool

// Simple network check
export async function simpleNetworkCheck(provider: ethers.Provider) {
  try {
    console.log('=== Simple Network Check ===');
    const network = await provider.getNetwork();
    console.log('Network:', network);
    return { success: true, network };
  } catch (error) {
    console.error('Network check failed:', error);
    return { success: false, error: error.message };
  }
}

// Simple contract check
export async function simpleContractCheck(contract: ethers.Contract) {
  try {
    console.log('=== Simple Contract Check ===');
    
    // Try to call owner function
    const owner = await contract.owner();
    console.log('Contract owner:', owner);
    
    // Try to call nextLaunchId function
    const nextId = await contract.nextLaunchId();
    console.log('Next launch ID:', nextId.toString());
    
    return { success: true, owner, nextLaunchId: nextId.toString() };
  } catch (error) {
    console.error('Contract check failed:', error);
    return { success: false, error: error.message };
  }
}

// Simple wallet check
export async function simpleWalletCheck(signer: ethers.Signer) {
  try {
    console.log('=== Simple Wallet Check ===');
    const address = await signer.getAddress();
    console.log('Wallet address:', address);
    return { success: true, address };
  } catch (error) {
    console.error('Wallet check failed:', error);
    return { success: false, error: error.message };
  }
}

// Simple address check
export async function simpleAddressCheck(provider: ethers.Provider, address: string) {
  try {
    console.log('=== Simple Address Check ===');
    console.log('Checking address:', address);
    
    const code = await provider.getCode(address);
    const hasCode = code !== '0x';
    
    console.log('Has code:', hasCode);
    console.log('Code length:', code.length);
    
    return { success: true, hasCode, codeLength: code.length };
  } catch (error) {
    console.error('Address check failed:', error);
    return { success: false, error: error.message };
  }
}

// Complete simple diagnosis
export async function simpleDiagnosis(
  provider: ethers.Provider,
  signer: ethers.Signer,
  contract: ethers.Contract,
  addresses: any
) {
  console.log('=== SIMPLE DIAGNOSIS START ===');
  
  const results = {};
  
      // 1. Network check
  console.log('\n1. Checking network...');
  results.network = await simpleNetworkCheck(provider);
  
      // 2. Wallet check
  console.log('\n2. Checking wallet...');
  results.wallet = await simpleWalletCheck(signer);
  
      // 3. Contract check
  console.log('\n3. Checking contract...');
  results.contract = await simpleContractCheck(contract);
  
  // 4. 地址检查
  console.log('\n4. Checking contract addresses...');
  results.addresses = {};
  for (const [name, address] of Object.entries(addresses)) {
    if (typeof address === 'string' && address.startsWith('0x')) {
      console.log(`Checking ${name}: ${address}`);
      results.addresses[name] = await simpleAddressCheck(provider, address);
    }
  }
  
  console.log('\n=== SIMPLE DIAGNOSIS COMPLETE ===');
  console.log('Results:', JSON.stringify(results, null, 2));
  
  return results;
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).simpleDiagnosis = {
    simpleNetworkCheck,
    simpleContractCheck,
    simpleWalletCheck,
    simpleAddressCheck,
    simpleDiagnosis
  };
  console.log('Simple diagnosis utils available: window.simpleDiagnosis');
}
