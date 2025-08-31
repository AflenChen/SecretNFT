import React, { useState, useEffect } from 'react';
import { X, Calendar, Coins, Hash, Users, Eye, Clock, TrendingUp, Shield, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import { LaunchImage } from './ImageManager';

interface LaunchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  launch: Launch | null;
  onParticipate: (launchId: number, amount: number) => void;
  onClaimNFTs: (launchId: number) => void;
  userParticipation: UserParticipation | null;
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
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string;
}

interface UserParticipation {
  amountPaid: string;
  tokensBought: number;
  hasClaimed: boolean;
}

export default function LaunchDetailModal({ 
  isOpen, 
  onClose, 
  launch, 
  onParticipate, 
  onClaimNFTs, 
  userParticipation, 
  loading 
}: LaunchDetailModalProps) {
  const [amount, setAmount] = useState(1);
  const [showParticipateForm, setShowParticipateForm] = useState(false);

  useEffect(() => {
    if (launch) {
      setAmount(1);
      setShowParticipateForm(false);
    }
  }, [launch]);

  if (!isOpen || !launch) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTimeStatus = (startTime: number, endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < startTime) return { status: 'upcoming', color: 'text-blue-500', bgColor: 'bg-blue-500/20' };
    if (now > endTime) return { status: 'ended', color: 'text-red-500', bgColor: 'bg-red-500/20' };
    return { status: 'active', color: 'text-green-500', bgColor: 'bg-green-500/20' };
  };

  const timeStatus = getTimeStatus(launch.startTime, launch.endTime);
  const totalCost = parseFloat(launch.price) * amount;
  const progressPercentage = (launch.participants / launch.totalSupply) * 100;

  const handleParticipate = (e: React.FormEvent) => {
    e.preventDefault();
    onParticipate(launch.id, amount);
  };

  const handleClaim = () => {
    onClaimNFTs(launch.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-white">Launch Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-6">
            {/* NFT Image */}
            <div className="bg-slate-700 rounded-lg p-6 text-center">
              <LaunchImage
                imageUrl={launch.imageUrl}
                name={launch.name || `Launch #${launch.id}`}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h4 className="text-xl font-semibold text-white">{launch.name || `Launch #${launch.id}`}</h4>
              <p className="text-gray-400">{launch.symbol}</p>
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${timeStatus.bgColor} ${timeStatus.color}`}>
              <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
              <span className="font-medium">{timeStatus.status.toUpperCase()}</span>
            </div>

            {/* Description */}
            {launch.description && (
              <div className="bg-slate-700 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">Description</h5>
                <p className="text-gray-300 text-sm">{launch.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{launch.price}</div>
                <div className="text-gray-400 text-sm">Price (ETH)</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{launch.totalSupply}</div>
                <div className="text-gray-400 text-sm">Total Supply</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{launch.participants}</div>
                <div className="text-gray-400 text-sm">Participants</div>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-pink-400">
                  {((launch.participants / launch.totalSupply) * 100).toFixed(2)}%
                </div>
                <div className="text-gray-400 text-sm">Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Progress</span>
                <span className="text-gray-400 text-sm">{launch.participants} / {launch.totalSupply}</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Time Information */}
            <div className="bg-slate-700 rounded-lg p-4 space-y-3">
              <h5 className="text-white font-medium mb-3">Timeline</h5>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Start Time</div>
                  <div className="text-gray-400 text-xs">{formatTime(launch.startTime)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-white text-sm">End Time</div>
                  <div className="text-gray-400 text-xs">{formatTime(launch.endTime)}</div>
                </div>
              </div>
            </div>

            {/* User Participation */}
            {userParticipation && userParticipation.tokensBought > 0 && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <h5 className="text-green-400 font-medium mb-2">Your Participation</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">NFTs Purchased:</span>
                    <span className="text-green-400">{userParticipation.tokensBought}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="text-green-400">{userParticipation.amountPaid} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={userParticipation.hasClaimed ? "text-green-400" : "text-yellow-400"}>
                      {userParticipation.hasClaimed ? "Claimed" : "Ready to Claim"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {timeStatus.status === 'active' && !userParticipation?.hasClaimed && (
                <button
                  onClick={() => setShowParticipateForm(!showParticipateForm)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200"
                >
                  Participate in Launch
                </button>
              )}

              {userParticipation && userParticipation.tokensBought > 0 && launch.isFinalized && !userParticipation.hasClaimed && (
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Claiming...' : 'Claim NFTs'}
                </button>
              )}

              {userParticipation && userParticipation.hasClaimed && (
                <div className="w-full bg-green-500/20 border border-green-500/30 text-green-400 py-3 px-4 rounded-lg font-medium text-center">
                  ✓ NFTs Claimed Successfully
                </div>
              )}
            </div>

            {/* Participate Form */}
            {showParticipateForm && timeStatus.status === 'active' && (
              <form onSubmit={handleParticipate} className="bg-slate-700 rounded-lg p-4 space-y-4">
                <h5 className="text-white font-medium">Purchase NFTs</h5>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of NFTs
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={launch.totalSupply - launch.participants}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-white font-medium">{totalCost} ETH</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Purchase'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
