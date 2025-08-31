import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.rpc.zama.ai",
      accounts: process.env.SEPOLIA_PRIVATE_KEY && process.env.SEPOLIA_PRIVATE_KEY !== "your_sepolia_private_key_here" 
        ? [process.env.SEPOLIA_PRIVATE_KEY] 
        : [],
      chainId: 11155111,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://mainnet.infura.io/v3/your_project_id",
      accounts: process.env.MAINNET_PRIVATE_KEY && process.env.MAINNET_PRIVATE_KEY !== "your_mainnet_private_key_here"
        ? [process.env.MAINNET_PRIVATE_KEY]
        : [],
      chainId: 1,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.POLYGON_PRIVATE_KEY && process.env.POLYGON_PRIVATE_KEY !== "your_polygon_private_key_here"
        ? [process.env.POLYGON_PRIVATE_KEY]
        : [],
      chainId: 137,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};

export default config;
