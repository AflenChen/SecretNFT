import { ethers } from "hardhat";
import { FHE } from "@fhevm/solidity";

async function main() {
  console.log("🚀 SecretNFT Platform Setup Script");
  console.log("====================================");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deployer account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log("Network ID:", network.chainId);
  console.log("Network name:", network.name);

  // Verify FHE support
  console.log("\n🔐 Verifying FHE support...");
  try {
    const testValue = FHE.encrypt64(100);
    console.log("✅ FHE encryption test successful");
  } catch (error) {
    console.error("❌ FHE encryption test failed:", error);
    return;
  }

  console.log("\n✅ Setup completed!");
  console.log("\nNext steps:");
  console.log("1. Run 'npm run compile' to compile contracts");
  console.log("2. Run 'npm test' to run tests");
  console.log("3. Run 'npm run deploy' to deploy contracts");
  console.log("4. Run 'cd frontend && npm run dev' to start frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
