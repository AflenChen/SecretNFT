import React, { useState } from 'react';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';

interface WalletManagerProps {
  account: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletManager({ account, onConnect, onDisconnect }: WalletManagerProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  if (!account) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Account Info */}
      <div className="bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2">
        <span className="text-green-400 text-sm font-medium">
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleConnect}
        className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Refresh</span>
      </button>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect</span>
      </button>
    </div>
  );
}
