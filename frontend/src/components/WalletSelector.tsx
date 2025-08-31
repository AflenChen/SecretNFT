import React, { useState, useEffect } from 'react';

interface WalletInfo {
  name: string;
  provider: any;
  icon: string;
  isInstalled: boolean;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onWalletSelect: (wallet: WalletInfo) => void;
  onClose: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ isOpen, onWalletSelect, onClose }) => {
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    detectWallets();
  }, []);

  const detectWallets = () => {
    const wallets: WalletInfo[] = [];

    // MetaMask
    if (typeof window.ethereum !== 'undefined') {
      wallets.push({
        name: 'MetaMask',
        provider: window.ethereum,
        icon: '🦊',
        isInstalled: true
      });
    }

    // OKX Wallet
    if (typeof window.okxwallet !== 'undefined') {
      wallets.push({
        name: 'OKX Wallet',
        provider: window.okxwallet,
        icon: '🔵',
        isInstalled: true
      });
    }

    // Coinbase Wallet
    if (typeof window.coinbaseWalletExtension !== 'undefined') {
      wallets.push({
        name: 'Coinbase Wallet',
        provider: window.coinbaseWalletExtension,
        icon: '🟠',
        isInstalled: true
      });
    }

    // Trust Wallet
    if (typeof window.trustwallet !== 'undefined') {
      wallets.push({
        name: 'Trust Wallet',
        provider: window.trustwallet,
        icon: '🔷',
        isInstalled: true
      });
    }

    // Binance Wallet
    if (typeof window.BinanceChain !== 'undefined') {
      wallets.push({
        name: 'Binance Wallet',
        provider: window.BinanceChain,
        icon: '🟡',
        isInstalled: true
      });
    }

    // Add popular wallets that might not be installed
    const popularWallets = [
      { name: 'MetaMask', icon: '🦊', url: 'https://metamask.io/' },
      { name: 'OKX Wallet', icon: '🔵', url: 'https://www.okx.com/web3' },
      { name: 'Coinbase Wallet', icon: '🟠', url: 'https://www.coinbase.com/wallet' },
      { name: 'Trust Wallet', icon: '🔷', url: 'https://trustwallet.com/' },
      { name: 'Binance Wallet', icon: '🟡', url: 'https://www.bnbchain.org/en/binance-wallet' }
    ];

    // Add non-installed popular wallets
    popularWallets.forEach(wallet => {
      const isAlreadyAdded = wallets.some(w => w.name === wallet.name);
      if (!isAlreadyAdded) {
        wallets.push({
          name: wallet.name,
          provider: null,
          icon: wallet.icon,
          isInstalled: false
        });
      }
    });

    setAvailableWallets(wallets);
  };

  const handleWalletSelect = async (wallet: WalletInfo) => {
    if (!wallet.isInstalled) {
      // Open wallet download page
      const walletUrls: { [key: string]: string } = {
        'MetaMask': 'https://metamask.io/',
        'OKX Wallet': 'https://www.okx.com/web3',
        'Coinbase Wallet': 'https://www.coinbase.com/wallet',
        'Trust Wallet': 'https://trustwallet.com/',
        'Binance Wallet': 'https://www.bnbchain.org/en/binance-wallet'
      };
      
      const url = walletUrls[wallet.name];
      if (url) {
        window.open(url, '_blank');
      }
      return;
    }

    try {
      // Auto-switch to Sepolia testnet
      await switchToSepolia(wallet.provider);
      onWalletSelect(wallet);
    } catch (error) {
      console.error('Error switching network:', error);
      // Continue anyway, let the main app handle the connection
      onWalletSelect(wallet);
    }
  };

  const switchToSepolia = async (provider: any) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18
              },
              rpcUrls: [
                'https://rpc.sepolia.org',
                'https://eth-sepolia.public.blastapi.io',
                'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
              ],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          // Don't throw, let the main app handle it
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">选择钱包</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          {availableWallets.map((wallet, index) => (
            <button
              key={index}
              onClick={() => handleWalletSelect(wallet)}
              className={`w-full p-4 border rounded-lg flex items-center space-x-3 transition-colors ${
                wallet.isInstalled
                  ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{wallet.name}</div>
                <div className="text-sm text-gray-500">
                  {wallet.isInstalled ? '已安装' : '点击安装'}
                </div>
              </div>
              {!wallet.isInstalled && (
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  安装
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          连接钱包后会自动切换到 Sepolia 测试网
        </div>
      </div>
    </div>
  );
};

export default WalletSelector;
