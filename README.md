# SecretNFT Platform

A confidential NFT launch platform using FHEVM (Fully Homomorphic Encryption Virtual Machine) for true privacy in blockchain transactions.

## 🌐 Live Demo

**Visit the live application:** [https://secret-nft.vercel.app/](https://secret-nft.vercel.app/)

## 🎥 Demo Video

<video width="100%" controls>
  <source src="https://github.com/AflenChen/SecretNFT/raw/main/demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

**Direct Download**: [demo.mp4](https://github.com/AflenChen/SecretNFT/raw/main/demo.mp4)

## 🚀 Features

### Core Functionality
- **Confidential NFT Launches**: Create NFT launches with encrypted pricing
- **Private Purchase Records**: All purchase amounts and participant data are encrypted
- **FHEVM Integration**: True homomorphic encryption for on-chain privacy
- **Multi-Network Support**: Deploy on Sepolia testnet and mainnet
- **User-Friendly Interface**: Modern React frontend with wallet integration

### Privacy Features
- **Encrypted Price Discovery**: NFT prices remain confidential during launches
- **Private Participation**: Purchase amounts are encrypted and only visible to authorized parties
- **Confidential Metadata**: NFT attributes can be encrypted using FHE operations
- **Secure Access Control**: Role-based decryption permissions

## 🏗️ Architecture

### Smart Contracts

#### 1. **SecretNFTLaunchFHE.sol** - Main Launch Contract
- **FHE Variables**: Uses `euint32` and `euint64` for encrypted data
- **Confidential Pricing**: NFT prices stored as encrypted values
- **Private Statistics**: Total raised and sold amounts are encrypted
- **User Participation**: Purchase records encrypted per user

#### 2. **SecretNFTFHE.sol** - Confidential NFT Contract
- **Encrypted Metadata**: NFT attributes stored as FHE variables
- **Access Control**: Authorized decryptors can view confidential data
- **FHE Operations**: Support for encrypted comparisons and aggregations
- **Public Interface**: Standard ERC721 with additional privacy features

#### 3. **SecretNFTFactoryFHE.sol** - Factory Contract
- **Collection Creation**: Deploy new confidential NFT collections
- **Creator Registration**: Automatic registration with launch contract
- **Initial Minting**: Support for creating collections with initial encrypted NFTs

### Frontend Application
- **React + TypeScript**: Modern web application
- **Ethers.js**: Blockchain interaction
- **Tailwind CSS**: Beautiful, responsive UI
- **MetaMask Integration**: Seamless wallet connection
- **IPFS Support**: Decentralized metadata storage

## 🔧 Technology Stack

### Blockchain
- **Solidity ^0.8.24**: Smart contract development
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **OpenZeppelin**: Secure contract libraries
- **Hardhat**: Development and deployment framework

### Frontend
- **React 18**: User interface
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Ethers.js**: Ethereum interaction

### Infrastructure
- **Vercel**: Frontend deployment
- **IPFS (Pinata)**: Decentralized storage
- **Sepolia Testnet**: Testing environment

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AflenChen/SecretNFT.git
   cd SecretNFT
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Add your configuration values
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Start development**
   ```bash
   # Terminal 1: Start local blockchain
   npm run node
   
   # Terminal 2: Start frontend
   npm run frontend:dev
   ```

## 🚀 Deployment

### Local Development
```bash
npm run deploy:local
```

### Sepolia Testnet
```bash
npm run deploy:sepolia
```

### Mainnet
```bash
npm run deploy:mainnet
```

## 🔐 FHEVM Features

### Encrypted Data Types
- **euint32**: 32-bit encrypted unsigned integers
- **euint64**: 64-bit encrypted unsigned integers

### FHE Operations
- **Addition**: `TFHE.add(a, b)`
- **Multiplication**: `TFHE.mul(a, b)`
- **Comparison**: `TFHE.gt(a, b)`, `TFHE.eq(a, b)`
- **Encryption/Decryption**: `TFHE.encrypt()`, `TFHE.decrypt()`

### Privacy Guarantees
- **Price Confidentiality**: NFT prices remain hidden during launches
- **Purchase Privacy**: Individual purchase amounts are encrypted
- **Metadata Protection**: Sensitive NFT attributes can be encrypted
- **Access Control**: Only authorized parties can decrypt data

## 📋 Usage

### Creating an NFT Collection
1. Connect your MetaMask wallet
2. Navigate to "Create NFT Collection"
3. Fill in collection details (name, symbol, metadata)
4. Upload image to IPFS
5. Deploy collection contract

### Launching an NFT
1. Select your NFT collection
2. Set launch parameters (supply, timing)
3. Set confidential price (encrypted)
4. Create launch

### Participating in a Launch
1. Browse available launches
2. Connect wallet to Sepolia testnet
3. Purchase NFTs with encrypted amounts
4. Claim NFTs after launch finalization

## 🔒 Security Features

- **Reentrancy Protection**: All external calls protected
- **Access Control**: Role-based permissions
- **Input Validation**: Comprehensive parameter checks
- **Emergency Functions**: Owner can pause or withdraw funds
- **FHE Security**: Cryptographic privacy guarantees

## 🌐 Networks

- **Sepolia Testnet**: Primary testing environment
- **Mainnet**: Production deployment (when ready)
- **Local Hardhat**: Development and testing

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/AflenChen/SecretNFT/issues)
- **Documentation**: See [docs/](docs/) folder for detailed guides
- **Community**: Join our discussions on GitHub

## 🎯 Roadmap

- [ ] **FHEVM Mainnet Deployment**: Deploy to mainnet with full FHE support
- [ ] **Advanced Privacy Features**: Additional FHE operations and privacy guarantees
- [ ] **Mobile App**: Native mobile application
- [ ] **Cross-Chain Support**: Multi-chain deployment
- [ ] **DAO Governance**: Community governance for platform decisions

---

**Built with ❤️ using FHEVM for true blockchain privacy**
