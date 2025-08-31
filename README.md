# SecretNFT - Confidential NFT Launch Platform

SecretNFT is a confidential NFT launch platform built with FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. The platform allows users to participate in NFT launches without revealing purchase information, protecting user privacy and trading strategies.

## 🚀 Features

- **Confidential Price Discovery**: Uses FHE technology to encrypt NFT prices, preventing price manipulation
- **Confidential Purchase Records**: User purchase amounts and payment amounts are completely encrypted
- **Confidential Allocation Mechanism**: The NFT allocation process remains confidential
- **Decentralized**: Based on Ethereum blockchain, no need to trust third parties
- **Modern UI**: Responsive design with dark mode support

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity**: Smart contract development language
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **OpenZeppelin**: Secure contract library
- **Hardhat**: Development framework

### Frontend
- **React**: User interface framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **Ethers.js**: Ethereum interaction
- **Vite**: Build tool

## 📁 Project Structure

```
SecretNFT/
├── contracts/                 # Smart contracts
│   ├── SecretNFTLaunch.sol   # Main launch contract
│   └── SecretNFT.sol         # NFT contract
├── deploy/                   # Deployment scripts
│   └── deploy.ts
├── scripts/                  # Example scripts
│   └── example-usage.ts
├── test/                     # Test files
│   └── SecretNFTLaunch.test.ts
├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── ...
├── hardhat.config.ts         # Hardhat configuration
├── package.json
└── README.md
```

## 🚀 Quick Start

### Requirements

- Node.js 18+
- npm or yarn
- MetaMask wallet

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key
SEPOLIA_URL=https://sepolia.rpc.zama.ai
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy Contracts

```bash
# Deploy to Sepolia testnet
npm run deploy

# Deploy to local network
npm run deploy:local
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 to view the application.

## 📖 Usage Guide

### 1. Create NFT Launch

Platform administrators can create new NFT launches:

```typescript
const secretPrice = FHE.encrypt64(ethers.parseEther("0.1"));
await secretNFTLaunch.createLaunch(
  nftContractAddress,
  100, // Total supply
  startTime,
  endTime,
  secretPrice,
  paymentTokenAddress
);
```

### 2. Confidential Purchase of NFT

Users can purchase NFTs confidentially:

```typescript
const amount = 2;
const totalAmount = pricePerNFT * BigInt(amount);
const encryptedAmount = FHE.encrypt64(totalAmount);

await secretNFTLaunch.secretPurchase(
  launchId,
  amount,
  encryptedAmount
);
```

### 3. Finalize Launch

Administrators finalize the launch and allocate NFTs:

```typescript
await secretNFTLaunch.finalizeLaunch(launchId);
```

### 4. Claim NFTs

Users claim their purchased NFTs:

```typescript
await secretNFTLaunch.claimNFTs(launchId);
```

## 🔒 Privacy Protection

SecretNFT uses FHE technology to protect the following information:

- **Price Information**: NFT confidential prices are completely encrypted on-chain
- **Purchase Records**: User purchase amounts and payment amounts are encrypted and stored
- **Allocation Information**: The NFT allocation process remains confidential
- **User Behavior**: Prevents other users from analyzing purchase patterns

## 🧪 Testing

Run the complete test suite:

```bash
npm test
```

Test coverage:
- Contract deployment
- Launch creation
- Confidential purchase
- Launch finalization
- NFT claiming
- Permission control

## 📝 Contract Addresses

After deployment, please update the contract addresses in the frontend application:

```typescript
// Update in frontend/src/App.tsx
const CONTRACT_ADDRESS = 'your_deployed_address';
```

## 🤝 Contributing

Welcome contributions! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) - FHEVM technology
- [OpenZeppelin](https://openzeppelin.com/) - Secure contract library
- [Hardhat](https://hardhat.org/) - Development framework

## 📞 Contact Us

- Project Homepage: [GitHub](https://github.com/your-username/SecretNFT)
- Issue Reports: [Issues](https://github.com/your-username/SecretNFT/issues)

---

**Note**: This is a demonstration project. Please conduct thorough security audits before using in production environments.
