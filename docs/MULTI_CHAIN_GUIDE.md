# 🌐 完整的多链配置指南

> 多链支持、配置、测试和验证的完整文档

**最后更新：2025-12-25**

---

## 📑 目录

1. [支持的网络](#支持的网络)
2. [快速开始](#快速开始)
3. [环境配置](#环境配置)
4. [配置验证](#配置验证)
5. [Cloudflare 部署](#cloudflare-部署)
6. [Anvil Fork 测试](#anvil-fork-测试)
7. [Anvil Local 测试](#anvil-local-测试)
8. [手机访问](#手机访问)
9. [配置测试](#配置测试)
10. [故障排除](#故障排除)

---

## 支持的网络

### 网络列表

| 网络名称        | Chain ID | 生产环境 | 开发环境 | 启动命令            | 状态    |
| --------------- | -------- | -------- | -------- | ------------------- | ------- |
| **BSC 主网**    | 56       | ✅       | ✅       | `npm run dev`       | ✅ 完美 |
| **BSC 测试网**  | 97       | ✅       | ✅       | `npm run dev`       | ✅ 完美 |
| **Anvil Fork**  | 1056     | ❌       | ✅       | `npm run dev:fork`  | ✅ 完美 |
| **Anvil Local** | 31337    | ❌       | ✅       | `npm run dev:local` | ✅ 完美 |

### 网络特点

#### BSC 主网 (Chain ID: 56)

- ✅ 真实的生产环境
- ✅ 需要真实的 BNB 支付 gas
- ✅ 数据永久保存在区块链上
- ⚠️ 操作不可逆，需谨慎
- 📝 合约地址独立，与测试网不同

#### BSC 测试网 (Chain ID: 97)

- ✅ 测试环境
- ✅ 使用测试 BNB（免费获取）
- ✅ 接近真实环境
- ✅ 适合最终测试
- 📝 有独特的 IDX_USDT_PAIR 配置

#### Anvil Fork (Chain ID: 1056)

- ✅ Fork 自 BSC 主网
- ✅ 拥有主网的所有数据和状态
- ✅ 本地执行，不消耗真实 gas
- ✅ 可以重置和重新开始
- ✅ 适合测试主网数据交互
- 📝 使用主网合约地址（因为 fork 的是主网）
- 📝 RPC URL 可配置（支持手机访问）

#### Anvil Local (Chain ID: 31337)

- ✅ 完全独立的本地链
- ✅ 需要部署所有合约
- ✅ 完全可控的测试环境
- ✅ 适合测试新合约
- 📝 所有配置从环境变量读取
- 📝 完全灵活可配置

---

## 快速开始

### 1️⃣ 主网 + 测试网（默认）

```bash
npm run dev
```

**特点：**

- ✅ 同时支持 BSC 主网 (56) 和 BSC 测试网 (97)
- ✅ 用户通过钱包切换网络
- ✅ 无需任何配置
- ✅ 前端根据钱包选择的网络自动适配

**控制台日志：**

```
🔧 Development mode: Using Mainnet + Testnet
```

### 2️⃣ Anvil Fork（测试主网数据）

```bash
# 终端 1: 启动 Anvil Fork (在 hy-contract 目录)
cd hy-contract
npm run start-fork

# 终端 2: 启动前端 (在 hy-web 目录)
cd hy-web
npm run dev:fork
```

**特点：**

- ✅ 只支持 Anvil Fork (Chain ID 1056)
- ✅ 自动加载 `.env.fork` 配置
- ✅ 拥有主网数据，不消耗真实 gas
- ✅ 适合测试主网数据交互

**控制台日志：**

```
🔧 Fork mode: Using Anvil Fork (Chain ID 1056)
```

### 3️⃣ Anvil Local（测试新合约）

```bash
# 终端 1: 启动 Anvil Local (在 hy-contract 目录)
cd hy-contract
npm run start-anvil

# 终端 2: 部署合约
forge script script/deployContracts.s.sol \
  --rpc-url http://127.0.0.1:8545 --broadcast -vvv

# 终端 3: 更新 .env.local 中的合约地址，启动前端
cd hy-web
npm run dev:local
```

**特点：**

- ✅ 只支持 Anvil Local (Chain ID 31337)
- ✅ 自动加载 `.env.local` 配置
- ✅ 完全独立的测试环境
- ✅ 适合测试新合约部署

**控制台日志：**

```
🔧 Local mode: Using Anvil Local (Chain ID 31337)
```

---

## 环境配置

### 配置文件

| 文件         | 用途             | 启动命令            | 提交到 git |
| ------------ | ---------------- | ------------------- | ---------- |
| `.env`       | 基础配置         | 所有命令            | ✅         |
| `.env.fork`  | Anvil Fork 配置  | `npm run dev:fork`  | ✅         |
| `.env.local` | Anvil Local 配置 | `npm run dev:local` | ✅         |

**注意：**

- `npm run dev` 不需要配置文件，使用默认 development mode
- 所有配置文件都提交到 git（团队共享）

### Mode 和配置文件的关系

```bash
npm run dev        # --mode development (无需配置文件)
npm run dev:fork   # --mode fork (加载 .env.fork)
npm run dev:local  # --mode local (加载 .env.local)
npm run build      # --mode production (生产构建)
```

### 配置示例

#### `.env.fork`

```bash
# Anvil Fork 模式配置
VITE_CHAIN_ID=1056
VITE_RPC_URL=http://127.0.0.1:8545

# 手机访问时，改为局域网 IP
# VITE_RPC_URL=http://192.168.1.176:8545
```

#### `.env.local`

```bash
# Anvil Local 模式配置
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545

# 合约地址配置（部署后填入）
VITE_STORAGE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_LOGIC_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
# ... 其他合约地址
```

---

## 配置验证

### 合约地址配置验证

#### ✅ BSC 主网 (Chain ID: 56)

```typescript
{
  IDX_TOKEN: "0xc98F60B3F98E8Bf860436746db637e13B0e17458",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STORAGE_ADDRESS: "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  LOGIC_ADDRESS: "0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD",
  // ... 所有地址硬编码
  RPC_URL: "https://bsc.publicnode.com",
  BIND_ADDRESS_URL: "https://www.ihealth.vip/app",
}
```

**验证结果：**

- ✅ 所有合约地址硬编码（主网地址）
- ✅ 与测试网地址完全不同
- ✅ RPC URL 指向主网
- ✅ 绑定服务 URL 正确

#### ✅ BSC 测试网 (Chain ID: 97)

```typescript
{
  IDX_TOKEN: "0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD",  // ≠ 主网
  USDT_TOKEN: "0x2Bb3Ac5204Aba14E2915ab49052D82471C3f0C67",  // ≠ 主网
  IDX_USDT_PAIR: "0x3221Fbd272787C1D6df3476F029B711e0B0c352d",  // 独有
  STORAGE_ADDRESS: "0xEd935db4871D140799C07b86330c6b1B52A7bC1F",  // ≠ 主网
  // ... 所有地址与主网不同
  RPC_URL: "https://bsc-testnet.publicnode.com",
  BIND_ADDRESS_URL: "https://www.ihealth.vip/api",
}
```

**验证结果：**

- ✅ 所有合约地址与主网不同
- ✅ 有独特的 IDX_USDT_PAIR 配置
- ✅ RPC URL 指向测试网

#### ✅ Anvil Fork (Chain ID: 1056)

```typescript
{
  IDX_TOKEN: "0xc98F60B3F98E8Bf860436746db637e13B0e17458",  // = 主网
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",  // = 主网
  // ... 所有地址与主网相同（因为 fork 的是主网）
  RPC_URL: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",  // 环境变量
  BIND_ADDRESS_URL: "https://www.ihealth.vip/api",
}
```

**验证结果：**

- ✅ 合约地址与主网相同（正确，因为 fork 主网）
- ✅ RPC URL 从环境变量读取（支持手机访问）
- ✅ Chain ID 1056 避免与主网冲突

#### ✅ Anvil Local (Chain ID: 31337)

```typescript
{
  IDX_TOKEN: import.meta.env.VITE_IDX_TOKEN || "0xc98F...",  // 环境变量
  USDT_TOKEN: import.meta.env.VITE_USDT_TOKEN || "0x55d...",  // 环境变量
  // ... 所有地址从环境变量读取
  RPC_URL: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
  BIND_ADDRESS_URL: "https://www.ihealth.vip/api",
}
```

**验证结果：**

- ✅ 所有合约地址从环境变量读取
- ✅ 支持本地部署的新合约
- ✅ 完全灵活可配置

### 判断逻辑验证

```typescript
export const getChainConfig = (chainId: number, rpcUrl?: string) => {
  // 1. Chain ID 97 → 测试网
  if (chainId === 97) return BSC_TESTNET_CONFIG;

  // 2. Chain ID 1056 → Anvil Fork
  if (chainId === 1056) return ANVIL_FORK_CONFIG;

  // 3. Chain ID 31337/1337 → Anvil Local
  if (chainId === 31337 || chainId === 1337) return ANVIL_LOCAL_CONFIG;

  // 4. Chain ID 56 → 主网（不判断 RPC）
  if (chainId === 56) return BSC_MAINNET_CONFIG;

  // 5. 未知 Chain ID + 本地 RPC → Anvil Local
  if (isLocalRpcUrl(rpcUrl)) return ANVIL_LOCAL_CONFIG;

  // 6. 其他 → null
  return null;
};
```

**验证结果：**

- ✅ 优先级清晰：97 → 1056 → 31337/1337 → 56
- ✅ Chain ID 56 只返回主网（不判断 RPC）
- ✅ 未知 Chain ID 有兜底逻辑
- ✅ 逻辑简洁无冗余

### 检查当前环境

打开浏览器控制台（F12），查找日志：

#### 生产环境（Cloudflare）

```
🚀 Production mode: Using Mainnet + Testnet only
```

#### 开发环境 - 主网/测试网

```
🔧 Development mode: Using Mainnet + Testnet
```

#### Fork 模式 - Anvil Fork

```
🔧 Fork mode: Using Anvil Fork (Chain ID 1056)
```

#### Local 模式 - Anvil Local

```
🔧 Local mode: Using Anvil Local (Chain ID 31337)
```

---

## Cloudflare 部署

### 构建

```bash
npm run build
```

### 部署方式

**方法 1: Git 自动部署（推荐）**

1. 连接 Git 仓库到 Cloudflare Pages
2. 配置构建设置：
   - Build command: `npm run build`
   - Build output: `dist`
   - Root directory: `hy-web`

**方法 2: Wrangler CLI**

```bash
npx wrangler pages deploy dist
```

### 验证

访问域名，控制台应显示：

```
🚀 Production mode: Using Mainnet + Testnet only
```

---

## Anvil Fork 测试

### 启动 Anvil Fork

```bash
cd hy-contract
npm run start-fork
```

这会启动：

```bash
anvil --fork-url https://bsc-mainnet... \
      --chain-id 1056 \
      --host 0.0.0.0 \
      --port 8545
```

### 验证

```bash
npm run check-anvil
```

应该看到：

```
✅ Anvil 进程正在运行
✅ Chain ID: 1056
💰 测试账户余额: 10000 BNB
```

### 启动前端

```bash
cd hy-web
npm run dev:fork
```

### 钱包配置

```
网络名称: Anvil Fork (BSC)
RPC URL: http://127.0.0.1:8545
Chain ID: 1056
货币符号: BNB
```

### 测试账户

```
地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
⚠️ 仅用于测试！
```

---

## Anvil Local 测试

### 启动 Anvil Local

```bash
cd hy-contract
npm run start-anvil
```

### 部署合约

```bash
forge script script/deployContracts.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast -vvv
```

记录部署的合约地址！

### 配置合约地址

编辑 `.env.local`，填入部署的合约地址。

### 启动前端

```bash
cd hy-web
npm run dev:local
```

### 钱包配置

```
网络名称: Anvil Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
货币符号: ETH
```

---

## 手机访问

### 步骤 1: 获取电脑 IP

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# 示例: inet 192.168.1.176
```

### 步骤 2: 修改配置

编辑 `.env.fork`：

```bash
VITE_CHAIN_ID=1056
VITE_RPC_URL=http://192.168.1.176:8545  # 使用你的 IP
```

### 步骤 3: 重启服务

```bash
# 重启 Anvil
cd hy-contract
npm run stop-fork
npm run start-fork

# 重启前端
cd hy-web
npm run dev:fork
```

### 步骤 4: 手机访问

- 浏览器: `http://192.168.1.176:3001`
- 钱包 RPC: `http://192.168.1.176:8545`

---

## 配置测试

### 测试场景

| Chain ID | RPC URL                            | 预期配置           | 控制台日志                                           | 状态 |
| -------- | ---------------------------------- | ------------------ | ---------------------------------------------------- | ---- |
| 56       | https://bsc-dataseed1.binance.org  | BSC_MAINNET_CONFIG | ✅ Using BSC Mainnet configuration (Chain ID: 56)    | ✅   |
| 97       | https://bsc-testnet.publicnode.com | BSC_TESTNET_CONFIG | ✅ Using BSC Testnet configuration (Chain ID: 97)    | ✅   |
| 1056     | http://127.0.0.1:8545              | ANVIL_FORK_CONFIG  | 🔧 Using Anvil Fork configuration (Chain ID: 1056)   | ✅   |
| 1056     | http://192.168.1.176:8545          | ANVIL_FORK_CONFIG  | 🔧 Using Anvil Fork configuration (Chain ID: 1056)   | ✅   |
| 31337    | http://127.0.0.1:8545              | ANVIL_LOCAL_CONFIG | 🔧 Using Anvil Local configuration (Chain ID: 31337) | ✅   |
| 1337     | http://127.0.0.1:8545              | ANVIL_LOCAL_CONFIG | 🔧 Using Anvil Local configuration (Chain ID: 1337)  | ✅   |

### 边界情况测试

| Chain ID | RPC URL               | 预期配置           | 说明                   | 状态 |
| -------- | --------------------- | ------------------ | ---------------------- | ---- |
| 56       | http://127.0.0.1:8545 | BSC_MAINNET_CONFIG | Chain ID 56 只支持主网 | ✅   |
| 999      | https://some-rpc.com  | null               | 未知链                 | ✅   |
| 999      | http://127.0.0.1:8545 | ANVIL_LOCAL_CONFIG | 通过 RPC 判断为本地链  | ✅   |

### 测试建议

#### 1. 测试主网配置

```typescript
const config = getChainConfig(56);
console.assert(config === BSC_MAINNET_CONFIG);
console.assert(
  config.STORAGE_ADDRESS === "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
);
```

#### 2. 测试测试网配置

```typescript
const config = getChainConfig(97);
console.assert(config === BSC_TESTNET_CONFIG);
console.assert(
  config.STORAGE_ADDRESS === "0xEd935db4871D140799C07b86330c6b1B52A7bC1F",
);
```

#### 3. 测试 Anvil Fork 配置

```typescript
const config = getChainConfig(1056);
console.assert(config === ANVIL_FORK_CONFIG);
console.assert(
  config.STORAGE_ADDRESS === "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
); // 与主网相同
```

#### 4. 测试 Anvil Local 配置

```typescript
const config = getChainConfig(31337);
console.assert(config === ANVIL_LOCAL_CONFIG);
// 合约地址从环境变量读取
```

#### 5. 测试 Chain ID 56 不判断 RPC

```typescript
// 即使 RPC 是本地地址，也返回主网配置
const config = getChainConfig(56, "http://127.0.0.1:8545");
console.assert(config === BSC_MAINNET_CONFIG);
```

### 判断逻辑流程图

```
getChainConfig(chainId, rpcUrl)
    ↓
┌───────────────────────────────────┐
│ 1. chainId === 97?                │
│    → BSC_TESTNET_CONFIG           │
└───────────────────────────────────┘
    ↓ No
┌───────────────────────────────────┐
│ 2. chainId === 1056?              │
│    → ANVIL_FORK_CONFIG            │
└───────────────────────────────────┘
    ↓ No
┌───────────────────────────────────┐
│ 3. chainId === 31337 || 1337?    │
│    → ANVIL_LOCAL_CONFIG           │
└───────────────────────────────────┘
    ↓ No
┌───────────────────────────────────┐
│ 4. chainId === 56?                │
│    → BSC_MAINNET_CONFIG           │
│    (不判断 RPC URL)                │
└───────────────────────────────────┘
    ↓ No
┌───────────────────────────────────┐
│ 5. isLocalRpcUrl(rpcUrl)?         │
│    Yes → ANVIL_LOCAL_CONFIG       │
│    No  → null (未知链)             │
└───────────────────────────────────┘
```

---

## 故障排除

### 问题 1: 无法连接 Anvil

```bash
# 检查状态
npm run check-anvil

# 重启
npm run stop-fork && npm run start-fork
```

### 问题 2: 环境变量不生效

1. 确认使用正确命令（`dev:fork` 不是 `dev`）
2. 重启前端（Ctrl+C 然后重新运行）
3. 硬刷新浏览器（Ctrl+Shift+R）

### 问题 3: 手机无法访问

1. 确认同一 WiFi
2. 检查防火墙
3. 确认使用正确 IP

### 问题 4: 动态导入失败

**错误信息：**

```
Failed to fetch dynamically imported module
```

**解决方案：**

1. 清除浏览器缓存
2. 硬刷新页面
3. 切换网络重试

**TP 钱包清理缓存：**

1. 打开 TP 钱包 DApp 浏览器
2. 点击右上角菜单（...）
3. 选择"刷新"或"重新加载"
4. 或：完全关闭 TP 钱包，重新打开

---

## 📋 快速参考

### 启动命令

| 命令                | 支持的网络              | 配置文件     | Mode        |
| ------------------- | ----------------------- | ------------ | ----------- |
| `npm run dev`       | 主网 (56) + 测试网 (97) | 无需配置     | development |
| `npm run dev:fork`  | Anvil Fork (1056)       | `.env.fork`  | fork        |
| `npm run dev:local` | Anvil Local (31337)     | `.env.local` | local       |
| `npm run build`     | 主网 + 测试网           | 生产构建     | production  |

### 常用命令

```bash
# Anvil 管理
npm run start-fork      # 启动 Fork
npm run stop-fork       # 停止 Fork
npm run check-anvil     # 检查状态
npm run start-anvil     # 启动 Local

# 前端
npm run dev             # 开发模式
npm run dev:fork        # Fork 模式
npm run dev:local       # Local 模式
npm run build           # 生产构建
npm run preview         # 预览构建
```

### 钱包配置

| 网络        | Chain ID | RPC URL                            |
| ----------- | -------- | ---------------------------------- |
| BSC 主网    | 56       | https://bsc-dataseed1.binance.org  |
| BSC 测试网  | 97       | https://bsc-testnet.publicnode.com |
| Anvil Fork  | 1056     | http://127.0.0.1:8545              |
| Anvil Local | 31337    | http://127.0.0.1:8545              |

### 配置对比

| 配置               | Chain ID   | 合约地址来源     | RPC URL 来源 | 用途      |
| ------------------ | ---------- | ---------------- | ------------ | --------- |
| BSC_MAINNET_CONFIG | 56         | 硬编码（主网）   | 硬编码       | 生产环境  |
| BSC_TESTNET_CONFIG | 97         | 硬编码（测试网） | 硬编码       | 测试环境  |
| ANVIL_FORK_CONFIG  | 1056       | 硬编码（主网）   | 环境变量     | Fork 测试 |
| ANVIL_LOCAL_CONFIG | 31337/1337 | 环境变量         | 环境变量     | 本地测试  |

---

## 🎯 最佳实践

### 开发流程

1. **日常开发**: `npm run dev`（主网/测试网）
2. **测试新功能**: `npm run dev:fork`（Anvil Fork）
3. **测试新合约**: `npm run dev:local`（Anvil Local）
4. **手机测试**: 修改 `.env.fork` 使用局域网 IP
5. **部署前测试**: 使用测试网 (97)
6. **生产部署**: `npm run build` 部署到 Cloudflare

### 配置管理

1. **`.env`**: 基础配置，所有环境共享
2. **`.env.fork`**: Fork 模式，只支持 Anvil Fork
3. **`.env.local`**: Local 模式，只支持 Anvil Local
4. **所有配置文件都提交到 git**，团队共享

### 安全建议

1. ✅ 永远不要在 `.env` 文件中存储私钥
2. ✅ 所有配置文件都提交到 git（团队共享）
3. ✅ 生产环境使用硬编码配置
4. ✅ Anvil 测试账户的私钥是公开的，仅用于测试

---

## ✅ 验证清单

| 检查项            | 状态 | 说明                       |
| ----------------- | ---- | -------------------------- |
| BSC 主网配置      | ✅   | 合约地址正确，与测试网不同 |
| BSC 测试网配置    | ✅   | 合约地址正确，有独特配置   |
| Anvil Fork 配置   | ✅   | 使用主网地址，RPC 可配置   |
| Anvil Local 配置  | ✅   | 完全从环境变量读取         |
| Chain ID 判断逻辑 | ✅   | 优先级清晰，无冲突         |
| RainbowKit 配置   | ✅   | Mode 隔离完善              |
| Wagmi 配置        | ✅   | 与 RainbowKit 一致         |
| Localhost 配置    | ✅   | 支持多种 Chain ID          |
| 生产环境隔离      | ✅   | 只支持主网和测试网         |
| 开发环境支持      | ✅   | 支持所有链                 |
| 手机访问支持      | ✅   | RPC URL 可配置             |
| 环境变量优先级    | ✅   | 合理且灵活                 |

---

## 📊 总结

### 优势

1. **配置清晰分离** - 4 种配置完全独立
2. **判断逻辑准确** - Chain ID 优先级明确
3. **Mode 隔离完善** - 生产/开发/Fork/Local 完全隔离
4. **灵活性高** - Anvil Fork 支持手机访问，Anvil Local 完全可配置
5. **安全性好** - 生产环境不暴露开发链

### 结论

**多链支持已完全实现，各个链完美区分！**

- ✅ 4 种网络配置清晰分离
- ✅ 判断逻辑准确无误
- ✅ Mode 隔离完善
- ✅ 配置灵活可扩展
- ✅ 安全性良好

**无需修改，可以直接使用！** 🎉

---

**最后更新：2025-12-25**
