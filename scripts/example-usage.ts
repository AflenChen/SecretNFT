import { ethers } from "hardhat";
import { FHE } from "@fhevm/solidity";

async function main() {
  console.log("SecretNFT platform usage example...");

  // Get accounts
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("Platform owner:", owner.address);
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);

  // Assume contracts are deployed, use example addresses here
  const launchAddress = "0x..."; // Need to replace with actual deployed address
  const nftAddress = "0x..."; // Need to replace with actual deployed address

  const SecretNFTLaunch = await ethers.getContractFactory("SecretNFTLaunch");
  const secretNFTLaunch = SecretNFTLaunch.attach(launchAddress);

  const SecretNFT = await ethers.getContractFactory("SecretNFT");
  const secretNFT = SecretNFT.attach(nftAddress);

  // Example 1: Create new NFT launch
  console.log("\n=== Example 1: Create new NFT launch ===");
  
  const startTime = Math.floor(Date.now() / 1000) + 60; // Start in 1 minute
  const endTime = startTime + 3600; // End in 1 hour
  
  // Create confidential price (0.1 ETH)
  const secretPrice = FHE.encrypt64(ethers.parseEther("0.1"));
  
  try {
    const createTx = await secretNFTLaunch.createLaunch(
      nftAddress,
      100, // Total supply
      startTime,
      endTime,
      secretPrice,
      ethers.ZeroAddress // Use ETH for payment
    );
    await createTx.wait();
    console.log("NFT launch created successfully!");
  } catch (error) {
    console.error("Failed to create launch:", error);
  }

  // Example 2: User confidential purchase of NFT
  console.log("\n=== Example 2: User confidential purchase of NFT ===");
  
  const launchId = 0; // First launch
  const amount = 2; // Purchase 2 NFTs
  
  // Calculate encrypted payment amount
  const pricePerNFT = ethers.parseEther("0.1");
  const totalAmount = pricePerNFT * BigInt(amount);
  const encryptedAmount = FHE.encrypt64(totalAmount);
  
  try {
    const purchaseTx = await secretNFTLaunch.connect(user1).secretPurchase(
      launchId,
      amount,
      encryptedAmount
    );
    await purchaseTx.wait();
    console.log(`User ${user1.address} successfully purchased ${amount} NFTs`);
  } catch (error) {
    console.error("Purchase failed:", error);
  }

  // Example 3: Finalize launch
  console.log("\n=== Example 3: Finalize launch ===");
  
  // Wait for launch to end
  console.log("Waiting for launch to end...");
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
  
  try {
    const finalizeTx = await secretNFTLaunch.finalizeLaunch(launchId);
    await finalizeTx.wait();
    console.log("Launch finalized!");
  } catch (error) {
    console.error("Failed to finalize launch:", error);
  }

  // Example 4: User claim NFTs
  console.log("\n=== Example 4: User claim NFTs ===");
  
  try {
    const claimTx = await secretNFTLaunch.connect(user1).claimNFTs(launchId);
    await claimTx.wait();
    console.log(`User ${user1.address} successfully claimed NFTs`);
  } catch (error) {
    console.error("Failed to claim NFTs:", error);
  }

  // Example 5: Query user participation information
  console.log("\n=== Example 5: Query user participation information ===");
  
  try {
    const participation = await secretNFTLaunch.getUserParticipation(launchId, user1.address);
    console.log("User participation information:");
    console.log("- Payment amount:", ethers.formatEther(participation.amountPaid), "ETH");
    console.log("- Purchase amount:", participation.tokensBought.toString());
    console.log("- Has claimed:", participation.hasClaimed);
  } catch (error) {
    console.error("Failed to query participation information:", error);
  }

  console.log("\nExample completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
