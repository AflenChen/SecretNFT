import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting SecretNFT Platform deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy SecretNFTLaunchDemo contract
  console.log("\n📦 Deploying SecretNFTLaunchDemo...");
  const SecretNFTLaunchDemo = await ethers.getContractFactory("SecretNFTLaunchDemo");
  const secretNFTLaunch = await SecretNFTLaunchDemo.deploy();
  await secretNFTLaunch.waitForDeployment();
  const secretNFTLaunchAddress = await secretNFTLaunch.getAddress();
  console.log("✅ SecretNFTLaunchDemo deployed to:", secretNFTLaunchAddress);

  // Deploy SecretNFT contract
  console.log("\n📦 Deploying SecretNFT...");
  const SecretNFT = await ethers.getContractFactory("SecretNFT");
  const secretNFT = await SecretNFT.deploy("SecretNFT Genesis", "SNG", 1000);
  await secretNFT.waitForDeployment();
  const secretNFTAddress = await secretNFT.getAddress();
  console.log("✅ SecretNFT deployed to:", secretNFTAddress);

  // Deploy SecretNFTFactory contract
  console.log("\n📦 Deploying SecretNFTFactory...");
  const SecretNFTFactory = await ethers.getContractFactory("SecretNFTFactory");
  const secretNFTFactory = await SecretNFTFactory.deploy();
  await secretNFTFactory.waitForDeployment();
  const secretNFTFactoryAddress = await secretNFTFactory.getAddress();
  console.log("✅ SecretNFTFactory deployed to:", secretNFTFactoryAddress);

  // Configure contracts
  console.log("\n⚙️ Configuring contracts...");

  // Set launch platform in SecretNFT
  console.log("🔗 Setting launch platform in SecretNFT...");
  const setLaunchPlatformTx = await secretNFT.setLaunchPlatform(secretNFTLaunchAddress);
  await setLaunchPlatformTx.wait();
  console.log("✅ Launch platform set");

  // Enable minting in SecretNFT
  console.log("🔓 Enabling minting in SecretNFT...");
  const enableMintingTx = await secretNFT.enableMinting();
  await enableMintingTx.wait();
  console.log("✅ Minting enabled");
  
  // Set launch contract address in NFT Factory
  console.log("🔗 Setting launch contract address in NFT Factory...");
  const setLaunchAddressTx = await secretNFTFactory.setLaunchContractAddress(secretNFTLaunchAddress);
  await setLaunchAddressTx.wait();
  console.log("✅ Launch contract address set in NFT Factory");

  // Create a sample launch
  console.log("\n🎯 Creating sample launch...");
  const currentTime = Math.floor(Date.now() / 1000);
  const startTime = currentTime + 60; // Start in 1 minute
  const endTime = currentTime + 86400; // End in 24 hours
  const price = ethers.parseEther("0.1"); // 0.1 ETH per NFT

  const createLaunchTx = await secretNFTLaunch.createLaunch(
    secretNFTAddress,
    100, // total supply
    startTime,
    endTime,
    price, // simulated confidential price
    ethers.ZeroAddress // Use ETH as payment
  );
  await createLaunchTx.wait();
  console.log("✅ Sample launch created");

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  const chainId = Number(network.chainId);

  // Save deployment info
  const deploymentInfo = {
    network: {
      name: networkName,
      chainId: chainId,
      rpcUrl: process.env.SEPOLIA_RPC_URL || "http://localhost:8545"
    },
    contracts: {
      SecretNFTLaunchDemo: secretNFTLaunchAddress,
      SecretNFT: secretNFTAddress,
      SecretNFTFactory: secretNFTFactoryAddress
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    sampleLaunch: {
      nftContract: secretNFTAddress,
      totalSupply: 100,
      startTime: startTime,
      endTime: endTime,
      price: ethers.formatEther(price)
    }
  };

  // Save to deployment-config.json
  const configPath = path.join(__dirname, "..", "deployment-config.json");
  fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment config saved to:", configPath);

  // Generate frontend config
  const frontendConfigPath = path.join(__dirname, "..", "frontend", "src", "config", "contracts.ts");
  const frontendConfig = `// Auto-generated contract addresses
// Generated on: ${new Date().toISOString()}

const CONTRACT_ADDRESSES = {
  SECRET_NFT_LAUNCH_ADDRESS: "${secretNFTLaunchAddress}",
  SECRET_NFT_ADDRESS: "${secretNFTAddress}",
  SECRET_NFT_FACTORY_ADDRESS: "${secretNFTFactoryAddress}",
  NETWORK: {
    name: "${networkName}",
    chainId: ${chainId},
    rpcUrl: "${deploymentInfo.network.rpcUrl}"
  }
};

export default CONTRACT_ADDRESSES;
`;

  // Ensure directory exists
  const frontendConfigDir = path.dirname(frontendConfigPath);
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  fs.writeFileSync(frontendConfigPath, frontendConfig);
  console.log("📄 Frontend config generated:", frontendConfigPath);

  // Deployment summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`SecretNFTLaunchDemo: ${secretNFTLaunchAddress}`);
  console.log(`SecretNFT: ${secretNFTAddress}`);
  console.log(`SecretNFTFactory: ${secretNFTFactoryAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n🚀 Next steps:");
  console.log("1. Start the frontend: cd frontend && npm run dev");
  console.log("2. Connect your wallet to the platform");
  console.log("3. Create NFT collections using the factory");
  console.log("4. Create launches for your collections");
  console.log("5. Participate in launches and claim NFTs");

  console.log("\n🔗 Contract Explorer Links:");
  if (networkName === "sepolia") {
    console.log(`SecretNFTLaunchDemo: https://sepolia.etherscan.io/address/${secretNFTLaunchAddress}`);
    console.log(`SecretNFT: https://sepolia.etherscan.io/address/${secretNFTAddress}`);
    console.log(`SecretNFTFactory: https://sepolia.etherscan.io/address/${secretNFTFactoryAddress}`);
  }

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
