import React, { useState, useRef } from 'react';
import { Upload, Image, FileText, Hash, Coins, X, Plus, Trash2, Calendar } from 'lucide-react';
import { ethers } from 'ethers';
import CONTRACT_ADDRESSES from '../config/contracts';
import { NFTCollectionImage } from './ImageManager';
import { uploadToIPFS, uploadMetadataToIPFS, getIPFSImageUrl } from '../utils/ipfs';
import { formatTimeForDisplay, getCurrentTime, getTimeIn24Hours, validateTimes } from '../utils/timeUtils';

interface NFTPublisherProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (nftData: NFTData) => void;
  loading: boolean;
  provider?: ethers.BrowserProvider | null;
  signer?: ethers.JsonRpcSigner | null;
}

interface NFTData {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
  price: string;
  startTime: string;
  endTime: string;
  imageFile: File | null;
  imageUrl: string;
  ipfsHash?: string;
  nftContractAddress?: string;
  attributes: Array<{ trait_type: string; value: string }>;
  externalUrl: string;
}

// NFT Factory ABI
const NFTFactoryABI = [
  "function createNFTCollection(string memory _name, string memory _symbol, uint256 _maxSupply, string memory _baseURI) external payable returns (address)",
  "function creationFee() external view returns (uint256)",
  "event NFTCollectionCreated(address indexed collectionAddress, address indexed creator, string name, string symbol, uint256 maxSupply)"
];

export default function NFTPublisher({ isOpen, onClose, onPublish, provider, signer }: NFTPublisherProps) {
      // Set default time
  const now = new Date();
      const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // End after 24 hours
  
  const [formData, setFormData] = useState<NFTData>({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 1000,
    price: '0.1',
    startTime: now.toISOString().slice(0, 16), // Format as datetime-local
    endTime: endTime.toISOString().slice(0, 16),
    imageFile: null,
    imageUrl: '',
    attributes: [],
    externalUrl: ''
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showAttributes, setShowAttributes] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deploymentStep, setDeploymentStep] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleInputChange = (field: keyof NFTData, value: string | number | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
          if (!formData.imageFile) {
        alert('Please upload an image for your NFT collection');
        setLoading(false);
        return;
      }

      if (!formData.name || !formData.symbol) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!formData.startTime || !formData.endTime) {
        alert('Please set start and end times for your NFT collection');
        setLoading(false);
        return;
      }

    // Check time logic
    const startTime = new Date(formData.startTime).getTime();
    const endTime = new Date(formData.endTime).getTime();
    const now = Date.now();

    // Remove restriction that start time must be in the future, allow immediate start
    // if (startTime <= now) {
    //   alert('Start time must be in the future');
    //   return;
    // }

    if (endTime <= startTime) {
      alert('End time must be after start time');
      setLoading(false);
      return;
    }

    // Check if provider and signer are available
    if (!provider || !signer) {
      alert('Please connect your wallet first!');
      setLoading(false);
      return;
    }

    try {
      setUploadProgress(0);
      setDeploymentStep('Checking wallet connection...');

      // Check network
      try {
        const network = await provider.getNetwork();
        console.log('Current network:', network);
        if (network.chainId !== 11155111n) { // Sepolia testnet
          alert('Please switch to Sepolia testnet to create NFT collections!');
          setLoading(false);
          return;
        }
      } catch (networkError) {
        console.warn('Could not verify network, continuing anyway:', networkError);
        // Don't block the process if we can't verify the network
      }

      setUploadProgress(20);
      setDeploymentStep('Preparing NFT collection...');

      // Create NFT factory contract instance
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESSES.SECRET_NFT_FACTORY_ADDRESS,
        NFTFactoryABI,
        signer
      );

      // Get creation fee
      const creationFee = await factoryContract.creationFee();
      console.log('Creation fee:', ethers.formatEther(creationFee), 'ETH');

      setUploadProgress(40);
      setDeploymentStep('Uploading image to IPFS...');

      // Real IPFS upload
      let imageHash = '';
      let baseURI = '';
      
      if (formData.imageFile) {
        try {
          const uploadResult = await uploadToIPFS(formData.imageFile);
          imageHash = uploadResult.hash;
          baseURI = `ipfs://${imageHash}/`;
          console.log('Image uploaded to IPFS successfully:', uploadResult);
        } catch (uploadError) {
          console.error('IPFS upload failed:', uploadError);
          alert(`IPFS upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setUploadProgress(0);
          setDeploymentStep('');
          return;
        }
      } else {
        // If no image file, use default hash
        imageHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
        baseURI = `ipfs://${imageHash}/`;
        console.log('No image file provided, using default hash:', imageHash);
      }

      setUploadProgress(60);
      setDeploymentStep('Deploying NFT contract...');

      // Deploy NFT contract
      const createCollectionTx = await factoryContract.createNFTCollection(
        formData.name,
        formData.symbol,
        formData.maxSupply,
        baseURI,
        { value: creationFee }
      );

      setUploadProgress(80);
      setDeploymentStep('Waiting for transaction confirmation...');

      // Wait for transaction confirmation
      const receipt = await createCollectionTx.wait();
      console.log('Transaction receipt:', receipt);

      // Find NFTCollectionCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          return parsedLog?.name === 'NFTCollectionCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = factoryContract.interface.parseLog(event);
        if (parsedEvent) {
          const collectionAddress = parsedEvent.args[0];
          console.log('NFT Collection deployed to:', collectionAddress);

          setUploadProgress(90);
          setDeploymentStep('Creating launch for NFT collection...');

          // Call parent component's publish function, passing NFT contract address and image info
          try {
            await onPublish({
              ...formData,
                              nftContractAddress: collectionAddress, // Pass newly created NFT contract address
              imageUrl: formData.imageFile ? `https://gateway.pinata.cloud/ipfs/${imageHash}` : `${baseURI}image.png`,
              ipfsHash: imageHash,
              startTime: formData.startTime,
              endTime: formData.endTime
            });

            setUploadProgress(100);
            setDeploymentStep('NFT collection and launch created successfully!');

            // Delay to let user see 100% completion
            setTimeout(() => {
                              // Reset form
              const resetNow = new Date();
              const resetEndTime = new Date(resetNow.getTime() + 24 * 60 * 60 * 1000);
              
              setFormData({
                name: '',
                symbol: '',
                description: '',
                maxSupply: 1000,
                price: '0.1',
                                  startTime: resetNow.toISOString().slice(0, 16), // Format as datetime-local
                endTime: resetEndTime.toISOString().slice(0, 16),
                imageFile: null,
                imageUrl: '',
                attributes: [],
                externalUrl: ''
              });
              setPreviewUrl('');
              setShowAttributes(false);
              setUploadProgress(0);
              setDeploymentStep('');

              alert(`🎉 NFT collection "${formData.name}" created successfully!\n\n📋 Contract address: ${collectionAddress}\n🌐 IPFS Hash: ${imageHash}\n🔗 Launch created and ready for participation!`);
                          }, 1500); // Reset after 1.5 seconds
          } catch (launchError) {
            console.error('Error creating launch:', launchError);
            setUploadProgress(95);
            setDeploymentStep('NFT collection created, but launch creation failed. You can create launch manually.');
            
            // Reset after delay
            setTimeout(() => {
              setUploadProgress(0);
              setDeploymentStep('');
              alert(`NFT collection created successfully!\nContract address: ${collectionAddress}\n\nLaunch creation failed. You can create launch manually using the "Register & Create Launch" button.`);
            }, 2000);
          }
        } else {
          throw new Error('Failed to parse NFTCollectionCreated event');
        }
      } else {
        throw new Error('Failed to find NFTCollectionCreated event');
      }

    } catch (error) {
      console.error('Error publishing NFT:', error);
      setUploadProgress(0);
      setDeploymentStep('');
      setLoading(false);
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('User rejected')) {
        alert('Transaction was rejected by user. Please try again and approve the transaction in your wallet.');
      } else if (errorMessage.includes('insufficient funds')) {
        alert('Insufficient funds for transaction. Please make sure you have enough ETH for gas fees and creation fee.');
      } else if (errorMessage.includes('network') || errorMessage.includes('RPC')) {
        alert('Network connection error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('could not coalesce error')) {
        alert('Wallet connection error. Please try refreshing the page and reconnecting your wallet.');
      } else {
        alert(`Failed to create NFT collection: ${errorMessage}`);
      }
    }
  };

  const resetForm = () => {
    // Set default time to start immediately
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // End after 24 hours
    
    setFormData({
      name: '',
      symbol: '',
      description: '',
      maxSupply: 1000,
      price: '0.1',
              startTime: now.toISOString().slice(0, 16), // Format as datetime-local
      endTime: endTime.toISOString().slice(0, 16),
      imageFile: null,
      imageUrl: '',
      attributes: [],
      externalUrl: ''
    });
    setPreviewUrl('');
    setShowAttributes(false);
    setUploadProgress(0);
    setDeploymentStep('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-white">Create NFT Collection</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Deployment Progress */}
        {uploadProgress > 0 && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                <span className="text-sm font-medium text-gray-200">{deploymentStep}</span>
              </div>
              <span className="text-sm font-bold text-purple-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
            </div>
            {uploadProgress === 100 && (
              <div className="mt-2 text-center">
                <span className="text-green-400 text-sm font-medium">✅ Complete!</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Image Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Collection Image *
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl('');
                          setFormData(prev => ({ ...prev, imageFile: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* External URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  External URL
                </label>
                <input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://your-website.com"
                />
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="My Awesome Collection"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="MAC"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your NFT collection..."
                />
              </div>

              {/* Supply and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Supply *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.maxSupply}
                      onChange={(e) => handleInputChange('maxSupply', parseInt(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1000"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price per NFT (ETH) *
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.1"
                      min="0.001"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Start and End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('startTime', getCurrentTime());
                    }}
                    className="mt-1 text-xs text-purple-400 hover:text-purple-300"
                  >
                    {formData.startTime ? `Start: ${formatTimeForDisplay(formData.startTime)}` : 'Start Now'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const endTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                      handleInputChange('endTime', endTime.toISOString().slice(0, 16));
                    }}
                    className="mt-1 text-xs text-purple-400 hover:text-purple-300"
                  >
                    {formData.endTime ? `End: ${new Date(formData.endTime).toLocaleString()}` : 'End in 24h'}
                  </button>
                </div>
              </div>

              {/* Attributes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Attributes
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAttributes(!showAttributes)}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    {showAttributes ? 'Hide' : 'Show'} Attributes
                  </button>
                </div>
                
                {showAttributes && (
                  <div className="space-y-3">
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={attr.trait_type}
                          onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Trait Type"
                        />
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Value"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAttribute}
                      className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Attribute</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-slate-600">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.symbol || !formData.imageFile || !formData.startTime || !formData.endTime}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Collection...</span>
                </>
              ) : (
                <>
                  <span>Create Collection</span>
                  <span className="text-xs opacity-75">(NFT + Launch)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
