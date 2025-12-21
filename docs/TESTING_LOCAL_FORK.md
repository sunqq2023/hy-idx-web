# 测试本地 Fork 网指南

## `getChainConfig` 函数调用链

`getChainConfig` 函数在以下调用链中被使用：

```
useChainConfig() Hook
  ↓
getConfigByWalletChain()
  ↓
getChainConfig()  ← 你问的这个函数
```

### 具体调用位置

1. **`hy-web/src/hooks/useChainConfig.ts`** (第 38 行)

   - `useChainConfig` Hook 调用 `getConfigByWalletChain(actualChainId, rpcUrl)`

2. **`hy-web/src/constants/index.ts`** (第 238 行)

   - `getConfigByWalletChain` 函数内部调用 `getChainConfig(walletChainId, rpcUrl)`

3. **`hy-web/src/constants/index.ts`** (第 183 行)
   - `getChainConfig` 函数定义，根据 Chain ID 和 RPC URL 返回对应的配置

### 使用场景

- `Home.tsx`、`Team.tsx` 等组件通过 `useChainConfig()` Hook 获取合约地址
- 自动根据钱包连接的链 ID 和 RPC URL 选择正确的配置

---

## 如何测试本地 Fork 网

### 1. 启动 Anvil Fork

在 `hy-contract` 目录下运行：

```bash
cd hy-contract
npm run start-fork
```

或者手动启动：

```bash
anvil --fork-url https://bsc-dataseed1.binance.org --chain-id 56 --host 127.0.0.1 --port 8545
```

**说明：**

- `--fork-url`: Fork 的 RPC 地址（BSC 主网）
- `--chain-id 56`: 保持 BSC 主网的 Chain ID
- `--host 127.0.0.1`: 本地监听地址
- `--port 8545`: 本地端口

### 2. 配置前端环境变量

创建或修改 `hy-web/.env.development` 文件：

```bash
# Chain ID: 56 (Fork BSC 主网)
VITE_CHAIN_ID=56

# RPC URL: 本地 Anvil Fork
VITE_RPC_URL=http://127.0.0.1:8545

# 合约地址（使用主网地址，因为 Fork 的是主网）
# 这些地址会自动从 ANVIL_FORK_CONFIG 中获取，无需手动设置
```

### 3. 启动前端开发服务器

```bash
cd hy-web
npm run dev
```

### 4. 连接钱包到本地链

#### 方法 A: 使用 MetaMask

1. 打开 MetaMask
2. 点击网络下拉菜单 → "添加网络" 或 "添加网络手动"
3. 填写以下信息：

   - **网络名称**: `Anvil Fork`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `56`
   - **货币符号**: `BNB`
   - **区块浏览器**: `https://bscscan.com` (可选)

4. 保存并切换到该网络

#### 方法 B: 使用钱包的"切换网络"功能

如果前端已经配置了 `localhost` 链，钱包会自动识别并允许切换。

### 5. 验证配置是否正确

打开浏览器控制台，查看日志：

```
🔍 useChainConfig - Debug info: {
  isConnected: true,
  chain?.id: 56,
  actualChainId: 56,
  ...
}

✅ Using chain config for Chain ID: 56 {
  STORAGE_ADDRESS: "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  rpcUrl: "http://127.0.0.1:8545"
}

🔧 Using Anvil Fork configuration (Chain ID: 56, Local RPC)
```

**关键检查点：**

- ✅ Chain ID 应该是 `56`
- ✅ RPC URL 应该是 `http://127.0.0.1:8545`
- ✅ 应该看到 "Anvil Fork configuration" 日志
- ✅ `STORAGE_ADDRESS` 应该是主网地址（`0xB256459d...`）

### 6. 测试合约交互

现在可以测试：

- 读取合约数据（因为 Fork 了主网，所有主网数据都可用）
- 发送交易（使用 Anvil 的测试账户，有无限 gas）
- 测试合约功能

---

## 测试 Anvil Local（非 Fork）

如果你想测试完全本地的链（Chain ID 31337 或 1337），需要：

### 1. 启动 Anvil Local

```bash
cd hy-contract
npm run start-anvil
```

或者：

```bash
anvil --host 127.0.0.1 --port 8545
```

### 2. 部署合约到本地链

```bash
cd hy-contract
npm run deploy:local  # 需要创建这个脚本
```

### 3. 配置环境变量

```bash
# hy-web/.env.development
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545

# 需要设置本地部署的合约地址
VITE_STORAGE_ADDRESS=0x...
VITE_LOGIC_ADDRESS=0x...
# ... 其他合约地址
```

### 4. 验证

控制台应该显示：

```
🔧 Using Anvil Local configuration (Chain ID: 31337)
```

---

## 常见问题

### Q: 为什么 Chain ID 是 56 但显示 "Anvil Fork"？

A: `getChainConfig` 函数会检查 RPC URL。如果 Chain ID 是 56 且 RPC URL 是本地地址（`127.0.0.1` 或 `localhost`），就会使用 `ANVIL_FORK_CONFIG`。

### Q: 如何确认使用的是 Fork 配置而不是主网配置？

A: 查看控制台日志：

- Fork: `🔧 Using Anvil Fork configuration (Chain ID: 56, Local RPC)`
- 主网: `✅ Using BSC Mainnet configuration (Chain ID: 56, Mainnet RPC)`

### Q: 钱包无法连接到本地链？

A:

1. 确认 Anvil 正在运行：`curl http://127.0.0.1:8545` 应该返回 JSON
2. 检查 MetaMask 的网络配置是否正确
3. 尝试手动添加网络（见上面的"方法 A"）

### Q: 合约调用失败？

A:

1. 确认使用的是正确的合约地址（Fork 使用主网地址）
2. 检查 Anvil 是否正常 Fork 了主网
3. 查看浏览器控制台的错误信息

---

## 调试工具

### 查看当前链配置

在组件中使用 `ChainDebugInfo` 组件：

```tsx
import ChainDebugInfo from "@/components/ChainDebugInfo";

// 在组件中渲染
<ChainDebugInfo />;
```

这会显示：

- 钱包连接状态
- Chain ID
- 使用的合约地址

### 手动测试 `getChainConfig`

在浏览器控制台：

```javascript
// 导入函数（需要先构建项目）
import { getChainConfig } from "@/constants";

// 测试 Fork 配置
getChainConfig(56, "http://127.0.0.1:8545");
// 应该返回 ANVIL_FORK_CONFIG

// 测试主网配置
getChainConfig(56, "https://bsc-dataseed1.binance.org");
// 应该返回 BSC_MAINNET_CONFIG
```
