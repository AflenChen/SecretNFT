# SecretNFT Platform - Complete Usage Guide

## 🚀 完整功能概述

SecretNFT平台现在支持完整的NFT创建、发射和参与闭环：

### ✅ 已实现功能
- **钱包管理**: 连接/断开钱包、网络切换、账户管理
- **NFT创建**: 上传图片、设置元数据、部署NFT合约
- **发射创建**: 创建NFT发射活动、设置价格和时间
- **参与功能**: 真实参与发射、购买NFT
- **NFT领取**: 发射结束后领取购买的NFT
- **网络支持**: 支持Sepolia测试网、以太坊主网、Polygon等

## 📋 部署步骤

### 1. 环境准备
```bash
# 安装依赖
npm install

# 编译合约
npm run compile
```

### 2. 配置环境变量
创建 `.env` 文件：
```env
# 网络配置
SEPOLIA_RPC_URL=https://sepolia.rpc.zama.ai
SEPOLIA_PRIVATE_KEY=your_private_key_here

# 主网配置（可选）
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id
MAINNET_PRIVATE_KEY=your_private_key_here
```

### 3. 部署合约

#### 本地开发部署
```bash
# 启动本地节点
npm run node

# 新终端部署合约
npm run deploy:demo
```

#### Sepolia测试网部署
```bash
npm run deploy:sepolia
```

#### 主网部署
```bash
npm run deploy:mainnet
```

### 4. 启动前端
```bash
cd frontend
npm run dev
```

## 🎯 使用流程

### 1. 连接钱包
1. 打开应用 (http://localhost:3000)
2. 点击 "Connect Wallet" 连接MetaMask
3. 选择网络（推荐Sepolia测试网）
4. 确认连接

### 2. 创建NFT集合
1. 点击 "Create NFT" 按钮
2. 上传集合图片
3. 填写集合信息：
   - 名称和符号
   - 描述
   - 最大供应量
   - 价格
   - 属性（可选）
4. 点击 "Create Collection"

### 3. 创建发射活动
1. 点击 "Create Launch" 按钮
2. 选择NFT合约地址
3. 设置发射参数：
   - 总供应量
   - 开始/结束时间
   - 价格
4. 点击 "Create Launch"

### 4. 参与发射
1. 在发射列表中查看可用发射
2. 点击 "Participate" 按钮
3. 选择购买数量
4. 确认交易

### 5. 领取NFT
1. 等待发射结束
2. 点击 "Claim NFTs" 按钮
3. 确认交易
4. 在钱包中查看NFT

## 🔧 技术架构

### 智能合约
- **SecretNFT.sol**: NFT合约，支持mint和元数据管理
- **SecretNFTLaunchDemo.sol**: 发射平台合约，模拟FHE功能

### 前端组件
- **WalletManager.tsx**: 钱包连接和网络管理
- **NFTPublisher.tsx**: NFT创建和发布
- **CreateLaunchModal.tsx**: 发射创建
- **ParticipateModal.tsx**: 参与发射

### 网络支持
- **Sepolia测试网**: 推荐用于测试
- **以太坊主网**: 生产环境
- **Polygon**: 低成本交易

## 🛠️ 开发指南

### 添加新网络
在 `WalletManager.tsx` 中添加网络配置：
```typescript
const SUPPORTED_NETWORKS: Network[] = [
  // 添加新网络
  {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC',
    isTestnet: false
  }
];
```

### 自定义NFT属性
在 `NFTPublisher.tsx` 中扩展属性系统：
```typescript
interface NFTData {
  // 添加新属性
  royaltyPercentage?: number;
  creatorAddress?: string;
}
```

### 集成真实FHE
替换 `SecretNFTLaunchDemo.sol` 中的模拟功能：
```solidity
// 使用真实的FHE类型
import { FHE, euint64 } from "@fhevm/solidity";

// 替换uint256为euint64
euint64 private secretPrice;
```

## 🔒 安全特性

### 隐私保护
- 价格信息在链上加密
- 购买金额保密
- 分配机制透明但隐私

### 访问控制
- 只有合约所有者可以创建发射
- 用户只能参与活跃的发射
- 防止重复领取

### 错误处理
- 完整的交易验证
- 用户友好的错误提示
- 网络异常处理

## 📊 监控和分析

### 合约事件
- `LaunchCreated`: 发射创建
- `SecretPurchase`: 秘密购买
- `LaunchFinalized`: 发射结束
- `TokensClaimed`: NFT领取

### 前端状态
- 实时发射状态更新
- 用户参与记录
- 网络连接状态

## 🚨 故障排除

### 常见问题

#### 1. 钱包连接失败
- 确保MetaMask已安装
- 检查网络连接
- 确认账户已解锁

#### 2. 交易失败
- 检查账户余额
- 确认网络选择正确
- 验证Gas费用设置

#### 3. 合约调用错误
- 确认合约地址正确
- 检查ABI匹配
- 验证函数参数

### 调试工具
```bash
# 查看合约日志
npx hardhat console --network localhost

# 运行测试
npm test

# 验证合约
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## 🔮 未来计划

### 短期目标
- [ ] 集成真实FHEVM
- [ ] 添加IPFS存储
- [ ] 实现批量操作
- [ ] 添加治理功能

### 长期目标
- [ ] 跨链支持
- [ ] 移动端应用
- [ ] 高级分析工具
- [ ] DAO治理

## 📞 支持

如有问题，请：
1. 查看控制台错误信息
2. 检查网络连接
3. 确认合约部署状态
4. 联系开发团队

---

**注意**: 这是一个演示版本，生产环境使用前请进行充分测试和安全审计。
