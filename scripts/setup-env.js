#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 SecretNFT Platform - Environment Configuration Wizard\n');

const envPath = path.join(__dirname, '..', '.env');
const envTemplate = `# SecretNFT Platform Environment Configuration
# Please fill in your private key and network configuration

# Sepolia Testnet (recommended for testing)
SEPOLIA_RPC_URL=https://sepolia.rpc.zama.ai
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_here

# Ethereum Mainnet (production environment)
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id
MAINNET_PRIVATE_KEY=your_mainnet_private_key_here

# Polygon Network
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_PRIVATE_KEY=your_polygon_private_key_here

# Local Development (no private key needed)
LOCALHOST_RPC_URL=http://127.0.0.1:8545

# Other Configuration
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
`;

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  try {
    // Check if .env file already exists
    if (fs.existsSync(envPath)) {
      const overwrite = await question('⚠️  .env file already exists, overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Configuration cancelled');
        rl.close();
        return;
      }
    }

    console.log('\n📝 Please configure environment variables as prompted:\n');

    // Sepolia configuration
    console.log('🌐 Sepolia Testnet Configuration (recommended for testing)');
    const sepoliaPrivateKey = await question('Enter Sepolia private key (leave empty to skip): ');
    
    // Mainnet configuration
    console.log('\n🌐 Ethereum Mainnet Configuration (production environment)');
    const mainnetRpcUrl = await question('Enter mainnet RPC URL (leave empty for default): ');
    const mainnetPrivateKey = await question('Enter mainnet private key (leave empty to skip): ');

    // Generate .env content
    let envContent = envTemplate;
    
    if (sepoliaPrivateKey.trim()) {
      envContent = envContent.replace('your_sepolia_private_key_here', sepoliaPrivateKey.trim());
    }
    
    if (mainnetRpcUrl.trim()) {
      envContent = envContent.replace('https://mainnet.infura.io/v3/your_project_id', mainnetRpcUrl.trim());
    }
    
    if (mainnetPrivateKey.trim()) {
      envContent = envContent.replace('your_mainnet_private_key_here', mainnetPrivateKey.trim());
    }

    // Write to file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Environment configuration completed!');
    console.log(`📄 Configuration file saved to: ${envPath}`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Check if the configuration in .env file is correct');
    console.log('2. Ensure account has sufficient ETH for gas fees');
    console.log('3. Run deployment commands:');
    console.log('   - Local test: npm run deploy:demo');
    console.log('   - Sepolia testnet: npm run deploy:sepolia');
    console.log('   - Mainnet: npm run deploy:mainnet');
    
    console.log('\n⚠️  Security reminders:');
    console.log('- Never share your private key');
    console.log('- Do not commit .env file to code repository');
    console.log('- Use dedicated deployment account');

  } catch (error) {
    console.error('❌ Error occurred during configuration:', error.message);
  } finally {
    rl.close();
  }
}

setupEnvironment();
