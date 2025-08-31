// 浏览器控制台诊断工具

// 在浏览器控制台中直接运行的诊断函数
export function consoleDiagnosis() {
  console.log('=== CONSOLE DIAGNOSIS ===');
  
  // 检查window.ethereum
  if (typeof window.ethereum !== 'undefined') {
    console.log('✅ MetaMask is installed');
    console.log('MetaMask:', window.ethereum);
  } else {
    console.log('❌ MetaMask is not installed');
    return;
  }
  
  // 检查是否连接
  if (window.ethereum.isConnected()) {
    console.log('✅ MetaMask is connected');
  } else {
    console.log('❌ MetaMask is not connected');
  }
  
  // 检查网络
  window.ethereum.request({ method: 'eth_chainId' })
    .then((chainId: string) => {
      console.log('Chain ID:', chainId);
      if (chainId === '0xaa36a7') {
        console.log('✅ Connected to Sepolia testnet');
      } else {
        console.log('❌ Not connected to Sepolia testnet');
        console.log('Expected: 0xaa36a7, Got:', chainId);
      }
    })
    .catch((error: any) => {
      console.error('Failed to get chain ID:', error);
    });
  
  // 检查账户
  window.ethereum.request({ method: 'eth_accounts' })
    .then((accounts: string[]) => {
      if (accounts.length > 0) {
        console.log('✅ Wallet connected');
        console.log('Account:', accounts[0]);
      } else {
        console.log('❌ No wallet connected');
      }
    })
    .catch((error: any) => {
      console.error('Failed to get accounts:', error);
    });
  
  // 检查合约地址
  console.log('Contract addresses:');
  console.log('- Launch:', '0x9C83422DECce5a1b89620D24Ca471b5eeFd2f739');
  console.log('- NFT:', '0xA3CBFF00B706bCFAB305b9879E4fAb4FA8D9799E');
  console.log('- Factory:', '0x79a5868D75C010AeCa29624797B525536F13C891');
}

// 检查合约代码
export async function checkContractCode(address: string) {
  try {
    console.log(`Checking contract code at ${address}...`);
    
    const response = await fetch('https://eth-sepolia.g.alchemy.com/v2/Jf6yAV5m2XGr41Ly0VSw5GjmDU6xdMTa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1
      })
    });
    
    const data = await response.json();
    
    if (data.result && data.result !== '0x') {
      console.log('✅ Contract has code');
      console.log('Code length:', data.result.length);
    } else {
      console.log('❌ Contract has no code');
    }
    
    return data.result;
  } catch (error) {
    console.error('Failed to check contract code:', error);
    return null;
  }
}

// 检查所有合约
export async function checkAllContracts() {
  console.log('=== CHECKING ALL CONTRACTS ===');
  
  const addresses = [
    { name: 'Launch', address: '0x9C83422DECce5a1b89620D24Ca471b5eeFd2f739' },
    { name: 'NFT', address: '0xA3CBFF00B706bCFAB305b9879E4fAb4FA8D9799E' },
    { name: 'Factory', address: '0x79a5868D75C010AeCa29624797B525536F13C891' }
  ];
  
  for (const { name, address } of addresses) {
    console.log(`\n--- ${name} Contract ---`);
    await checkContractCode(address);
  }
}

// 在浏览器控制台中可用
if (typeof window !== 'undefined') {
  (window as any).consoleDiagnosis = {
    consoleDiagnosis,
    checkContractCode,
    checkAllContracts
  };
  console.log('Console diagnosis utils available:');
  console.log('- window.consoleDiagnosis.consoleDiagnosis()');
  console.log('- window.consoleDiagnosis.checkAllContracts()');
  console.log('- window.consoleDiagnosis.checkContractCode(address)');
}
