import React, { useState } from 'react';
import { X, Coins, Hash, Clock, Users } from 'lucide-react';

interface ParticipateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParticipate: (launchId: number, amount: number) => void;
  launch: Launch | null;
  loading: boolean;
}

interface Launch {
  id: number;
  nftContract: string;
  totalSupply: number;
  startTime: number;
  endTime: number;
  price: string;
  isActive: boolean;
  isFinalized: boolean;
  participants: number;
}

export default function ParticipateModal({ isOpen, onClose, onParticipate, launch, loading }: ParticipateModalProps) {
  const [amount, setAmount] = useState(1);

  if (!isOpen || !launch) return null;

  const totalCost = parseFloat(launch.price) * amount;
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeStatus = (startTime: number, endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < startTime) return { status: 'upcoming', color: 'text-blue-500' };
    if (now > endTime) return { status: 'ended', color: 'text-red-500' };
    return { status: 'active', color: 'text-green-500' };
  };

  const timeStatus = getTimeStatus(launch.startTime, launch.endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onParticipate(launch.id, amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Participate in Launch</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Launch Info */}
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-medium text-white">Launch #{launch.id}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${timeStatus.color} bg-opacity-20`}>
              {timeStatus.status.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Price per NFT:</span>
              <span className="text-white">{launch.price} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Supply:</span>
              <span className="text-white">{launch.totalSupply}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Participants:</span>
              <span className="text-white">{launch.participants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Start Time:</span>
              <span className="text-white">{formatTime(launch.startTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">End Time:</span>
              <span className="text-white">{formatTime(launch.endTime)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of NFTs to Purchase
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
                max={launch.totalSupply}
                required
              />
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Cost:</span>
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-purple-400" />
                <span className="text-lg font-semibold text-white">{totalCost.toFixed(4)} ETH</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          {timeStatus.status === 'ended' && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                This launch has ended. You cannot participate anymore.
              </p>
            </div>
          )}

          {timeStatus.status === 'upcoming' && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">
                This launch hasn't started yet. You can participate once it begins.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || timeStatus.status !== 'active'}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Participate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
