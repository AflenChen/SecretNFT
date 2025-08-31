# SecretNFT Quick Start Guide

## 🚀 5-Minute Quick Start

### 1. Clone Project
```bash
git clone <repository-url>
cd SecretNFT
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment
```bash
# Copy environment variables file
cp env.example .env

# Edit .env file, add your private key
PRIVATE_KEY=your_private_key_here
SEPOLIA_URL=https://sepolia.rpc.zama.ai
```

### 4. Verify Setup
```bash
npm run setup
```

### 5. Compile Contracts
```bash
npm run compile
```

### 6. Run Tests
```bash
npm test
```

### 7. Start Frontend
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 to view the application!

## 📋 Feature Demo

### Create NFT Launch
1. Connect MetaMask wallet
2. Switch to "Create Launch" tab
3. Fill in NFT contract information
4. Set confidential price and time
5. Confirm creation

### Confidential Purchase of NFT
1. Select a launch to participate in from the launch list
2. Enter purchase amount
3. System automatically encrypts payment amount
4. Confirm purchase

### Finalize Launch
1. Wait for launch time to end
2. Administrator clicks "Finalize Launch"
3. Users claim NFTs

## 🔧 FAQ

### Q: How to get testnet ETH?
A: Visit Sepolia faucet to get test ETH

### Q: Contract deployment failed?
A: Check private key and network configuration, ensure account has sufficient ETH

### Q: Frontend cannot connect?
A: Ensure MetaMask is installed and connected to Sepolia network

### Q: FHE functionality not working?
A: Ensure using Zama's Sepolia RPC node

## 📞 Get Help

- View complete documentation: [README.md](README.md)
- Project summary: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- Submit issues: GitHub Issues

---

**Note**: This is a demonstration project. Please do not use in production environments.
