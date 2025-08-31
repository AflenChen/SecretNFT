import { ethers } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

async function main() {
  console.log("🚀 Starting SecretNFT Platform Deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Deploy SecretNFT contract
  console.log("\n🎨 Deploying SecretNFT contract...");
  const SecretNFT = await ethers.getContractFactory("SecretNFT");
  const secretNFT = await SecretNFT.deploy("SecretNFT", "SNFT", 1000);
  await secretNFT.waitForDeployment();
  console.log(`✅ SecretNFT deployed to: ${await secretNFT.getAddress()}`);

  // Deploy SecretNFTLaunchDemo contract
  console.log("\n🚀 Deploying SecretNFTLaunchDemo contract...");
  const SecretNFTLaunchDemo = await ethers.getContractFactory("SecretNFTLaunchDemo");
  const secretNFTLaunch = await SecretNFTLaunchDemo.deploy();
  await secretNFTLaunch.waitForDeployment();
  console.log(`✅ SecretNFTLaunchDemo deployed to: ${await secretNFTLaunch.getAddress()}`);

  // Set launch platform on NFT contract
  console.log("\n🔗 Setting launch platform on NFT contract...");
  const setLaunchTx = await secretNFT.setLaunchPlatform(await secretNFTLaunch.getAddress());
  await setLaunchTx.wait();
  console.log("✅ Launch platform set successfully");

  // Enable minting on NFT contract
  console.log("\n✨ Enabling minting on NFT contract...");
  const enableMintingTx = await secretNFT.enableMinting();
  await enableMintingTx.wait();
  console.log("✅ Minting enabled successfully");

  // Create a sample launch
  console.log("\n📅 Creating sample launch...");
  
  const startTime = Math.floor(Date.now() / 1000) + 300; // Start in 5 minutes
  const endTime = startTime + 86400; // End in 24 hours
  const price = ethers.parseEther("0.1");

  const createLaunchTx = await secretNFTLaunch.createLaunch(
    await secretNFT.getAddress(),
    100, // Total supply
    startTime,
    endTime,
    price, // Simulated confidential price
    ethers.ZeroAddress // Use ETH as payment
  );
  await createLaunchTx.wait();
  console.log("✅ Sample launch created successfully");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    contracts: {
      SecretNFT: await secretNFT.getAddress(),
      SecretNFTLaunch: await secretNFTLaunch.getAddress()
    },
    sampleLaunch: {
      launchId: 0,
      nftContract: await secretNFT.getAddress(),
      totalSupply: 100,
      startTime: startTime,
      endTime: endTime,
      price: ethers.formatEther(price) + " ETH"
    },
    deploymentTime: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`SecretNFT: ${deploymentInfo.contracts.SecretNFT}`);
  console.log(`SecretNFTLaunch: ${deploymentInfo.contracts.SecretNFTLaunch}`);
  console.log(`Sample Launch ID: ${deploymentInfo.sampleLaunch.launchId}`);
  console.log(`Sample Launch Price: ${deploymentInfo.sampleLaunch.price}`);
  console.log(`Sample Launch Start: ${new Date(startTime * 1000).toLocaleString()}`);
  console.log(`Sample Launch End: ${new Date(endTime * 1000).toLocaleString()}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Copy the contract addresses above");
  console.log("2. Update your frontend configuration");
  console.log("3. Start your frontend application");
  console.log("4. Connect your wallet and start using the platform!");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
