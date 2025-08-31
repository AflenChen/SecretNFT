import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Plus, Eye, Clock, Users, TrendingUp, Shield, Zap, CheckCircle, Image } from 'lucide-react';
import CreateLaunchModal from './components/CreateLaunchModal';
import ParticipateModal from './components/ParticipateModal';
import LaunchDetailModal from './components/LaunchDetailModal';
import WalletManager from './components/WalletManager';
import NFTPublisher from './components/NFTPublisher';
import WalletSelector from './components/WalletSelector';
import { LaunchImage } from './components/ImageManager';
import { getNFTStatus } from './utils/ipfs';
import { getDefaultImageUrl } from './utils/defaultImage';
import CONTRACT_ADDRESSES from './config/contracts';

// Contract ABIs
const SecretNFTLaunchABI = [
  "function getLaunch(uint256 _launchId) external view returns (address nftContract, uint256 totalSupply, uint256 startTime, uint256 endTime, uint256 publicPrice, bool isActive, bool isFinalized, address paymentToken)",
  "function createLaunch(address _nftContract, uint256 _totalSupply, uint256 _startTime, uint256 _endTime, uint256 _secretPrice, address _paymentToken) external",
  "function secretPurchase(uint256 _launchId, uint256 _amount) external payable",
  "function finalizeLaunch(uint256 _launchId) external",
  "function claimNFTs(uint256 _launchId) external",
  "function getParticipants(uint256 _launchId) external view returns (address[])",
  "function getUserParticipation(uint256 _launchId, address _user) external view returns (uint256 amountPaid, uint256 tokensBought, bool hasClaimed)",
  "function nextLaunchId() external view returns (uint256)",
  "function owner() external view returns (address)"
];

const SecretNFTABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function baseURI() external view returns (string)",
  "function contractURI() external view returns (string)"
];

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
  status?: 'upcoming' | 'active' | 'expired';
}

interface UserParticipation {
  amountPaid: string;
  tokensBought: number;
  hasClaimed: boolean;
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

function App() {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [nftContract, setNftContract] = useState<ethers.Contract | null>(null);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showParticipateModal, setShowParticipateModal] = useState(false);
  const [showNFTPublisher, setShowNFTPublisher] = useState(false);
  const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
  const [userParticipations, setUserParticipations] = useState<Map<number, UserParticipation>>(new Map());
  const [isOwner, setIsOwner] = useState(false);
  const [showLaunchDetailModal, setShowLaunchDetailModal] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const [nftImageUrls, setNftImageUrls] = useState<Map<string, string>>(new Map()); // Store NFT contract address to image URL mapping

  // Contract addresses from deployed contracts
  const SECRET_NFT_LAUNCH_ADDRESS = CONTRACT_ADDRESSES.SECRET_NFT_LAUNCH_ADDRESS;
  const SECRET_NFT_ADDRESS = CONTRACT_ADDRESSES.SECRET_NFT_ADDRESS;

  useEffect(() => {
    checkWalletConnection();
    setupWalletListeners();
  }, []);

  useEffect(() => {
    if (contract && account) {
      loadLaunches();
      checkOwnership();
    }
  }, [contract, account]);

  const setupWalletListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('Account changed:', accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Reset signer and contract
          if (provider) {
            provider.getSigner().then(signer => {
              setSigner(signer);
              setupContracts(signer);
            });
          }
        } else {
          // User disconnected wallet
          disconnectWallet();
        }
      });

              // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('Chain changed:', chainId);
                  // Reconnect wallet to get new provider
        window.location.reload();
      });

              // Listen for connection status
      window.ethereum.on('connect', (connectInfo: any) => {
        console.log('Wallet connected:', connectInfo);
      });

      window.ethereum.on('disconnect', (error: any) => {
        console.log('Wallet disconnected:', error);
        disconnectWallet();
      });
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const switchToSepolia = async (walletProvider: any) => {
    if (typeof walletProvider === 'undefined') return;
    
    try {
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await walletProvider.request({
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
          alert('Failed to add Sepolia network to your wallet. Please add it manually.');
        }
      } else {
        console.error('Error switching to Sepolia network:', switchError);
        alert('Please switch to Sepolia testnet in your wallet manually.');
      }
    }
  };

  const connectWallet = async () => {
    // Show wallet selector instead of auto-detecting
    setShowWalletSelector(true);
  };

  const handleWalletSelect = async (wallet: any) => {
    setShowWalletSelector(false);
    
    try {
      console.log(`Connecting to ${wallet.name}...`);
      
      // Create provider
      const provider = new ethers.BrowserProvider(wallet.provider as any, undefined, {
        polling: true,
        pollingInterval: 1000
      });
      
      // Try multiple methods to get accounts
      let accounts;
      
      // Method 1: Try provider.send
      try {
        accounts = await provider.send("eth_requestAccounts", []);
      } catch (error) {
        console.log('Method 1 failed, trying method 2:', error);
      }
      
      // Method 2: Try direct wallet request
      if (!accounts) {
        try {
          accounts = await wallet.provider.request({ method: 'eth_requestAccounts' });
        } catch (error) {
          console.log('Method 2 failed, trying method 3:', error);
        }
      }
      
      // Method 3: Try with a delay
      if (!accounts) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          accounts = await wallet.provider.request({ method: 'eth_requestAccounts' });
        } catch (error) {
          console.log('Method 3 failed:', error);
        }
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }
      
      const account = accounts[0];
      console.log('Account found:', account);
      
      // Get signer
      const signer = await provider.getSigner();
      
      // Verify we're on the correct network (but don't block if we can't verify)
      try {
        const network = await provider.getNetwork();
        console.log('Current network:', network);
        if (network.chainId !== 11155111n) { // Sepolia chainId
          console.warn('Not on Sepolia network, but continuing...');
          // Don't block the connection, just warn
        }
      } catch (networkError) {
        console.warn('Could not verify network, continuing anyway:', networkError);
      }
      
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      
      // Set up contracts
      setupContracts(signer);
      
      console.log(`Wallet connected successfully: ${account} (${wallet.name})`);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('User rejected')) {
        alert('Wallet connection was rejected. Please try again and approve the connection in your wallet.');
      } else if (errorMessage.includes('No accounts found')) {
        alert('No accounts found. Please unlock your wallet and try again.');
      } else if (errorMessage.includes('network')) {
        alert('Network error. Please make sure you\'re connected to Sepolia testnet in your wallet.');
      } else {
        alert('Failed to connect wallet. Please try again. Make sure your wallet is unlocked and you\'re on Sepolia testnet.');
      }
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setContract(null);
    setNftContract(null);
    setIsOwner(false);
    setLaunches([]);
    setUserParticipations(new Map());
  };

  const setupContracts = (signer: ethers.JsonRpcSigner) => {
    const contract = new ethers.Contract(
      SECRET_NFT_LAUNCH_ADDRESS,
      SecretNFTLaunchABI,
      signer
    );
    setContract(contract);

    const nftContract = new ethers.Contract(
      SECRET_NFT_ADDRESS,
      SecretNFTABI,
      signer
    );
    setNftContract(nftContract);
  };

  const checkOwnership = async () => {
    if (!contract) return;
    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const loadLaunches = async () => {
    if (!contract) {
  
      return;
    }
    
    setLoading(true);
    try {
      const launchCount = await contract.nextLaunchId();
      const launchesData: Launch[] = [];
      
      for (let i = 0; i < launchCount; i++) {
        try {
          const launchData = await contract.getLaunch(i);
          const participants = await contract.getParticipants(i);
          
          // Get NFT contract info
          let name = '', symbol = '';
          try {
            const nftContractInstance = new ethers.Contract(launchData[0], SecretNFTABI, provider);
            name = await nftContractInstance.name();
            symbol = await nftContractInstance.symbol();
          } catch (error) {
            console.error('Failed to get NFT information:', error);
            name = `Launch #${i}`;
            symbol = 'NFT';
          }

          // Get user participation
          if (account) {
            try {
              const participation = await contract.getUserParticipation(i, account);
              userParticipations.set(i, {
                amountPaid: ethers.formatEther(participation[0]),
                tokensBought: Number(participation[1]),
                hasClaimed: participation[2]
              });
            } catch (error) {
              console.error('Failed to get user participation:', error);
              userParticipations.set(i, {
                amountPaid: '0',
                tokensBought: 0,
                hasClaimed: false
              });
            }
          }
          
          // Get NFT status
          const status = getNFTStatus(Number(launchData[2]), Number(launchData[3]));
          
                      // Get NFT image URL
          let imageUrl = undefined;
          try {
                          // First try to get from saved mapping (newly created NFTs)
            imageUrl = nftImageUrls.get(launchData[0]);
            
                          if (!imageUrl) {
                // Try to get image URL from NFT contract's baseURI
              try {
                const nftContractInstance = new ethers.Contract(launchData[0], [
                  'function baseURI() view returns (string)',
                  'function tokenURI(uint256 tokenId) view returns (string)'
                ], provider);
                
                const baseURI = await nftContractInstance.baseURI();
                
                                  if (baseURI && baseURI.length > 0) {
                    // Convert IPFS URL to HTTP URL
                  if (baseURI.startsWith('ipfs://')) {
                    const ipfsHash = baseURI.replace('ipfs://', '').replace(/\/$/, '');
                                          // Use IPFS address directly as image URL
                    imageUrl = `https://jade-far-clownfish-106.mypinata.cloud/ipfs/${ipfsHash}`;
                                      } else {
                      // If not IPFS URL, use directly
                    imageUrl = baseURI.replace(/\/$/, '') + '/image.png';
                  }
                                  } else {
                    // If no baseURI, use generated default image
                  imageUrl = getDefaultImageUrl(name, symbol);
                }
                              } catch (contractError) {
                  // If getting baseURI fails, use generated default image
                imageUrl = getDefaultImageUrl(name, symbol);
              }
            }
            
                      } catch (error) {
              // If image generation fails, use a simple placeholder
            imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzYzNjZmMSIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5ORlQ8L3RleHQ+PC9zdmc+';
          }



          launchesData.push({
            id: i,
            nftContract: launchData[0],
            totalSupply: Number(launchData[1]),
            startTime: Number(launchData[2]),
            endTime: Number(launchData[3]),
            price: ethers.formatEther(launchData[4]), // publicPrice
            isActive: launchData[5],
            isFinalized: launchData[6],
            participants: participants.length,
            name,
            symbol,
            description: `Launch #${i} - ${name} Collection`,
            imageUrl,
            status
          });
        } catch (error) {
          console.error(`Error loading launch ${i}:`, error);
          // Continue processing next launch, don't stop due to one error
        }
      }
      
      setLaunches(launchesData);
      setUserParticipations(new Map(userParticipations));
    } catch (error) {
      console.error('Error loading launches:', error);
      setLaunches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLaunch = async (launchData: any) => {
    if (!contract || !signer) return;
    
    try {
      setLoading(true);
      
      // Convert datetime to timestamp
      const startTime = Math.floor(new Date(launchData.startTime).getTime() / 1000);
      const endTime = Math.floor(new Date(launchData.endTime).getTime() / 1000);
      const price = ethers.parseEther(launchData.price);
      
      // Create launch transaction
      const tx = await contract.createLaunch(
        SECRET_NFT_ADDRESS, // NFT contract address
        launchData.totalSupply,
        startTime,
        endTime,
        price, // Simulated confidential price
        ethers.ZeroAddress // Use ETH as payment
      );
      
      await tx.wait();
      
      // Reload launches
      await loadLaunches();
      setShowCreateModal(false);
      
      alert('Launch created successfully!');
    } catch (error) {
      console.error('Error creating launch:', error);
      if (error instanceof Error) {
        alert(`Failed to create launch: ${error.message}`);
      } else {
        alert('Failed to create launch. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNFT = async (nftData: NFTData) => {
    if (!signer || !contract) {
      alert('Please connect your wallet first!');
      return;
    }
    
    try {
      setLoading(true);
      

      
      // Check network
      const network = await signer.provider?.getNetwork();
      if (network?.chainId !== 11155111n) { // Sepolia testnet
        alert('Please switch to Sepolia testnet to create NFT collections!');
        return;
      }
      
      // Use newly created NFT contract address, if not available use default address
      const nftContractAddress = nftData.nftContractAddress || CONTRACT_ADDRESSES.SECRET_NFT_ADDRESS;
      
      // Parse time
      const startTime = Math.floor(new Date(nftData.startTime).getTime() / 1000);
      const endTime = Math.floor(new Date(nftData.endTime).getTime() / 1000);
      const price = ethers.parseEther(nftData.price);
      
      // Validate time
      if (startTime >= endTime) {
        alert('End time must be after start time!');
        return;
      }
      

      
      // Create launch - requires 6 parameters: nftContract, totalSupply, startTime, endTime, secretPrice, paymentToken
      const createLaunchTx = await contract.createLaunch(
        nftContractAddress,
        nftData.maxSupply,
        startTime,
        endTime,
        price,
        ethers.ZeroAddress // paymentToken - Use ETH as payment token
      );
      
      await createLaunchTx.wait();
      
      // Save NFT contract address to image URL mapping
      if (nftData.nftContractAddress && nftData.imageUrl) {
        setNftImageUrls(prev => new Map(prev).set(nftData.nftContractAddress!, nftData.imageUrl));

      }
      
      // Reload launches list
      await loadLaunches();
      
      setShowNFTPublisher(false);
      alert(`NFT collection "${nftData.name}" created and launch started successfully!`);
    } catch (error) {
      console.error('Error publishing NFT:', error);
      if (error instanceof Error) {
        alert(`Failed to publish NFT: ${error.message}`);
      } else {
        alert('Failed to publish NFT. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async (launchId: number, amount: number) => {
    if (!contract || !signer) return;
    
    try {
      setLoading(true);
      
      const launch = launches.find(l => l.id === launchId);
      if (!launch) {
        alert('Launch not found');
        return;
      }
      
      const totalCost = parseFloat(launch.price) * amount;

      
      // Purchase transaction
      const tx = await contract.secretPurchase(
        launchId,
        amount,
        { value: ethers.parseEther(totalCost.toString()) }
      );
      
      await tx.wait();
      
      // Reload launches and participations
      await loadLaunches();
      setShowParticipateModal(false);
      
      alert('Participation successful! You can claim your NFTs after the launch ends.');
    } catch (error) {
      console.error('Error participating:', error);
      if (error instanceof Error) {
        alert(`Failed to participate: ${error.message}`);
      } else {
        alert('Failed to participate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimNFTs = async (launchId: number) => {
    if (!contract || !signer) return;
    
    try {
      setLoading(true);
      
      const tx = await contract.claimNFTs(launchId);
      await tx.wait();
      
      // Reload participations
      await loadLaunches();
      
      alert('NFTs claimed successfully! Check your wallet.');
    } catch (error) {
      console.error('Error claiming NFTs:', error);
      alert('Failed to claim NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getTimeStatus = (startTime: number, endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < startTime) return { status: 'upcoming', color: 'text-blue-500' };
    if (now > endTime) return { status: 'ended', color: 'text-red-500' };
    return { status: 'active', color: 'text-green-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                  SecretNFT
                </h1>
                <p className="text-sm text-gray-400">Confidential NFT Launch Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {account ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowNFTPublisher(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <Image className="w-4 h-4" />
                    <span>Create NFT</span>
                  </button>








                  {isOwner && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Launch</span>
                    </button>
                  )}
                  <WalletManager
                    account={account}
                    onConnect={connectWallet}
                    onDisconnect={disconnectWallet}
                  />
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
            Launch NFTs with Complete Privacy
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the future of NFT launches with fully homomorphic encryption. 
            Your purchase amounts, prices, and allocations remain confidential on-chain.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-purple-400 mb-2">{launches.length}</div>
              <div className="text-gray-400">Launches Created</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {launches.reduce((sum, launch) => sum + launch.participants, 0)}
              </div>
              <div className="text-gray-400">Participants</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {launches.reduce((sum, launch) => sum + parseFloat(launch.price) * launch.participants, 0).toFixed(2)}
              </div>
              <div className="text-gray-400">ETH Raised</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-pink-400 mb-2">100%</div>
              <div className="text-gray-400">Privacy Guaranteed</div>
            </div>
          </div>
        </div>

        {/* Launches Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-bold text-white">Active Launches</h3>
            <div className="flex items-center space-x-2 text-gray-400">
              <TrendingUp className="w-5 h-5" />
              <span>Live Updates</span>
            </div>
          </div>
          


          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading launches...</p>
            </div>
          ) : launches.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-4"></div>
                  <div className="h-3 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : launches.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Launches Yet</h3>
              <p className="text-gray-400 mb-6">Be the first to create an NFT launch!</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowNFTPublisher(true)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Create NFT Collection
                </button>
                {isOwner && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Create Launch
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {launches.map((launch) => {
                const timeStatus = getTimeStatus(launch.startTime, launch.endTime);
                const participation = userParticipations.get(launch.id);
                
                return (
                  <div key={launch.id} className="group bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                    {/* NFT Image */}
                    <div className="mb-4">
                      <LaunchImage
                        imageUrl={launch.imageUrl}
                        name={launch.name || `Launch #${launch.id}`}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />

                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-white font-semibold">{launch.name || `Launch #${launch.id}`}</span>
                          <div className="text-xs text-gray-400">{launch.symbol}</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${timeStatus.color} bg-opacity-20`}>
                        {timeStatus.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Supply</span>
                        <span className="text-white">{launch.totalSupply}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price</span>
                        <span className="text-purple-400 font-medium">{launch.price} ETH</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Participants</span>
                        <span className="text-white">{launch.participants}</span>
                      </div>
                      {participation && participation.tokensBought > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Your Purchase</span>
                          <span className="text-green-400">{participation.tokensBought} NFTs</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Start: {formatTime(launch.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>End: {formatTime(launch.endTime)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {participation && participation.tokensBought > 0 && launch.isFinalized && !participation.hasClaimed ? (
                        <button
                          onClick={() => handleClaimNFTs(launch.id)}
                          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Claim NFTs
                        </button>
                      ) : participation && participation.tokensBought > 0 && participation.hasClaimed ? (
                        <div className="flex-1 flex items-center justify-center space-x-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Claimed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedLaunch(launch);
                            setShowParticipateModal(true);
                          }}
                          disabled={timeStatus.status !== 'active'}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {timeStatus.status === 'active' ? 'Participate' : timeStatus.status}
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedLaunch(launch);
                          setShowLaunchDetailModal(true);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Confidential Pricing</h4>
            <p className="text-gray-400">NFT prices are encrypted on-chain, ensuring fair and private price discovery.</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Instant Participation</h4>
            <p className="text-gray-400">Participate in launches instantly with encrypted purchase amounts.</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Fair Allocation</h4>
            <p className="text-gray-400">Transparent and fair NFT allocation based on encrypted participation data.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 SecretNFT Platform. Built with FHEVM technology.</p>
            <div className="mt-4 flex justify-center">
              <a 
                href="https://github.com/AflenChen/SecretNFT" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateLaunchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateLaunch={handleCreateLaunch}
        loading={loading}
      />

      <ParticipateModal
        isOpen={showParticipateModal}
        onClose={() => setShowParticipateModal(false)}
        onParticipate={handleParticipate}
        launch={selectedLaunch}
        loading={loading}
      />

      <NFTPublisher
        isOpen={showNFTPublisher}
        onClose={() => setShowNFTPublisher(false)}
        onPublish={handlePublishNFT}
        loading={loading}
      />

             <LaunchDetailModal
         isOpen={showLaunchDetailModal}
         onClose={() => setShowLaunchDetailModal(false)}
         launch={selectedLaunch}
         userParticipation={userParticipations.get(selectedLaunch?.id || 0) || null}
         onParticipate={handleParticipate}
         onClaimNFTs={handleClaimNFTs}
         loading={loading}
       />

       <WalletSelector
         isOpen={showWalletSelector}
         onWalletSelect={handleWalletSelect}
         onClose={() => setShowWalletSelector(false)}
       />

       
    </div>
  );
}

export default App;
