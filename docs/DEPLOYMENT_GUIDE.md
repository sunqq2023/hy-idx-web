# DApp 部署和升级指南

## 目录

1. [快速开始](#快速开始)
2. [开发环境](#开发环境)
3. [构建和部署](#构建和部署)
4. [Cloudflare Pages 配置](#cloudflare-pages-配置)
5. [移动端测试](#移动端测试)
6. [故障排查](#故障排查)

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 安装依赖

```bash
cd hy-web
npm install
```

### 启动开发服务器

```bash
# 开发模式（连接 BSC 主网）
npm run dev

# Fork 模式（连接 Anvil Fork）
npm run dev:fork

# Local 模式（连接本地测试网）
npm run dev:local
```

访问: `http://localhost:3001`

---

## 开发环境

### 环境模式说明

项目支持多种环境模式，通过不同的 `.env` 文件配置：

#### 1. Development 模式（主网开发）

**配置文件**: `.env` (默认)

```bash
VITE_CHAIN_ID=56
VITE_RPC_URL=https://bsc-dataseed.binance.org/
```

**使用场景**:

- 日常开发
- 连接 BSC 主网
- 读取真实数据

**启动命令**:

```bash
npm run dev
```

#### 2. Fork 模式（主网 Fork）

**配置文件**: `.env.fork`

```bash
VITE_CHAIN_ID=1056
VITE_RPC_URL=http://192.168.1.176:8545
```

**使用场景**:

- 测试主网数据交互
- 不消耗真实 gas
- 合约升级测试

**启动步骤**:

```bash
# 1. 启动 Anvil Fork (在 hy-contract 目录)
cd ../hy-contract
npm run start-fork

# 2. 启动前端 (在 hy-web 目录)
cd ../hy-web
npm run dev:fork
```

#### 3. Local 模式（本地测试网）

**配置文件**: `.env.local`

```bash
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://localhost:8545
```

**使用场景**:

- 纯本地开发
- 快速测试
- 不需要主网数据

**启动命令**:

```bash
npm run dev:local
```

#### 4. Production 模式（生产环境）

**配置文件**: `.env.production`

```bash
VITE_CHAIN_ID=56
VITE_RPC_URL=https://bsc-dataseed.binance.org/
```

**使用场景**:

- 生产部署
- Cloudflare Pages

**构建命令**:

```bash
npm run build
```

### 环境变量说明

| 变量                | 说明         | 示例                              |
| ------------------- | ------------ | --------------------------------- |
| `VITE_CHAIN_ID`     | 链 ID        | 56 (BSC), 1056 (Fork)             |
| `VITE_RPC_URL`      | RPC 节点地址 | https://bsc-dataseed.binance.org/ |
| `VITE_API_BASE_URL` | API 基础地址 | https://www.ihealth.vip/api       |

---

## 构建和部署

### 本地构建

```bash
# 生产构建
npm run build

# Fork 模式构建
npm run build:fork
```

**构建产物**: `dist/` 目录

**检查构建**:

```bash
ls -lh dist/
# 应该看到:
# - index.html
# - assets/
# - favicon.ico
```

### 本地预览

```bash
npm run preview
```

访问: `http://localhost:3001`

**预览服务器特性**:

- 使用 Express 服务器
- 支持 SPA 路由
- 模拟生产环境

---

## Cloudflare Pages 配置

### 初次部署

#### 1. 创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Pages" 页面
3. 点击 "Create a project"
4. 选择 "Connect to Git"

#### 2. 连接 Git 仓库

1. 授权 Cloudflare 访问你的 Git 仓库
2. 选择 `hy-web` 仓库
3. 配置构建设置

#### 3. 构建配置

**Framework preset**: None (或 Vite)

**Build command**:

```bash
npm run build
```

**Build output directory**:

```
dist
```

**Root directory**:

```
hy-web
```

**Environment variables**:

```
NODE_VERSION=18
```

#### 4. 部署

点击 "Save and Deploy"，Cloudflare 会自动：

1. 克隆代码
2. 安装依赖
3. 运行构建
4. 部署到 CDN

### 自动部署

配置完成后，每次 push 到主分支都会自动部署：

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Cloudflare 会自动：

1. 检测到 push
2. 触发构建
3. 部署新版本
4. 更新生产环境

### 手动部署

使用 Wrangler CLI 手动部署：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
wrangler pages deploy dist --project-name=your-project-name
```

### 环境变量配置

在 Cloudflare Dashboard 中配置环境变量：

1. 进入 Pages 项目
2. 点击 "Settings" > "Environment variables"
3. 添加变量：
   - `NODE_VERSION`: 18
   - `VITE_CHAIN_ID`: 56
   - `VITE_RPC_URL`: https://bsc-dataseed.binance.org/

### 自定义域名

1. 进入 Pages 项目
2. 点击 "Custom domains"
3. 添加你的域名
4. 配置 DNS 记录（Cloudflare 会自动提示）

---

## 部署流程

### 标准部署流程

#### 步骤 1: 更新版本号

编辑 `index.html`:

```html
<script>
  window.CURRENT_VERSION = "1.2.3"; // 更新版本号
</script>
```

#### 步骤 2: 本地测试

```bash
# 开发模式测试
npm run dev

# 生产构建测试
npm run build
npm run preview
```

**测试清单**:

- [ ] 连接钱包正常
- [ ] 读取数据正常
- [ ] 交易提交正常
- [ ] Gas 计算正确
- [ ] 移动端显示正常

#### 步骤 3: 提交代码

```bash
git add .
git commit -m "chore: release v1.2.3"
git push origin main
```

#### 步骤 4: 监控部署

1. 访问 Cloudflare Dashboard
2. 进入 Pages 项目
3. 查看 "Deployments" 标签
4. 等待状态变为 "Success"

#### 步骤 5: 清除缓存

⚠️ **关键步骤**: 部署后必须清除缓存！

1. 进入 Cloudflare Dashboard
2. 选择你的域名
3. 点击 "Caching" > "Configuration"
4. 点击 "Purge Everything"
5. 确认清除

#### 步骤 6: 验证部署

1. **清除浏览器缓存**
   - Chrome: `Ctrl+Shift+Delete`
   - 选择 "Cached images and files"

2. **访问生产环境**
   - 打开网站
   - 按 F12 打开开发者工具
   - 检查 Console 中的版本号

3. **功能测试**
   - 连接钱包
   - 查看矿机列表
   - 提交测试交易
   - 检查移动端

### 紧急修复流程

如果发现严重 bug，需要紧急修复：

#### 方式 1: 快速回滚

1. 访问 Cloudflare Dashboard
2. 进入 Pages 项目 > Deployments
3. 找到上一个稳定版本
4. 点击 "Rollback to this deployment"
5. 清除缓存

#### 方式 2: 热修复

```bash
# 1. 创建修复分支
git checkout -b hotfix/critical-bug

# 2. 修复 bug
# ... 编辑代码 ...

# 3. 测试
npm run build
npm run preview

# 4. 合并到主分支
git checkout main
git merge hotfix/critical-bug

# 5. 部署
git push origin main

# 6. 清除缓存
```

---

## 移动端测试

### TokenPocket Android 测试

⚠️ **重要**: TokenPocket 不支持开发模式（HMR）！

#### 正确的测试方式

```bash
# 1. 构建生产版本
npm run build

# 2. 启动预览服务器
npm run preview
```

#### 手机访问

1. **获取电脑 IP**

   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

2. **确保同一局域网**
   - 手机和电脑连接同一 WiFi

3. **手机访问**
   - 打开 TokenPocket
   - 访问 `http://你的IP:3001`

#### 测试清单

- [ ] 应用不崩溃
- [ ] 连接钱包正常
- [ ] 查看数据正常
- [ ] 提交交易正常
- [ ] 页面切换流畅

#### 常见问题

**Q: TokenPocket 打开就崩溃？**

A: 你可能使用了 `npm run dev`，这会导致崩溃。

解决方案:

```bash
# 停止 dev 服务器
# 使用生产构建
npm run build
npm run preview
```

**Q: 手机无法访问？**

A: 检查防火墙设置:

```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock node

# Windows
# 在防火墙设置中允许 Node.js
```

**Q: 页面加载很慢？**

A:

1. 检查网络连接
2. 使用局域网 IP（不要用 localhost）
3. 检查 RPC 节点是否正常

### MetaMask Mobile 测试

MetaMask Mobile 支持开发模式，可以直接使用：

```bash
npm run dev
```

访问: `http://你的IP:3001`

---

## 故障排查

### 部署失败

#### 问题: 构建失败

**错误信息**:

```
Build failed: Command failed with exit code 1
```

**解决方案**:

1. 检查本地构建是否成功: `npm run build`
2. 检查 Node 版本: 确保 >= 18
3. 检查依赖: `npm install`
4. 查看 Cloudflare 构建日志

#### 问题: 部署超时

**错误信息**:

```
Deployment timed out
```

**解决方案**:

1. 检查构建产物大小: `du -sh dist/`
2. 优化依赖: 移除不必要的包
3. 使用 Wrangler CLI 手动部署

### 缓存问题

#### 问题: 看不到更新

**症状**: 部署成功，但网站没有更新

**解决方案**:

1. **清除 Cloudflare 缓存**
   - Dashboard > Caching > Purge Everything

2. **清除浏览器缓存**
   - Chrome: `Ctrl+Shift+Delete`
   - 或使用隐私模式

3. **硬刷新**
   - Chrome: `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac)

#### 问题: 版本号不更新

**症状**: Console 显示旧版本号

**解决方案**:

1. 检查 `index.html` 是否更新
2. 清除所有缓存
3. 等待 CDN 更新（2-5 分钟）

### 功能问题

#### 问题: 连接钱包失败

**错误信息**:

```
Failed to connect wallet
```

**解决方案**:

1. 检查网络配置: Chain ID 是否正确
2. 检查 RPC 节点: 是否可访问
3. 检查钱包: 是否安装并解锁
4. 查看浏览器 Console 错误

#### 问题: 交易失败

**错误信息**:

```
Transaction failed: gas too low
```

**解决方案**:

1. 检查 Gas 配置
2. 检查合约地址是否正确
3. 检查账户余额
4. 查看合约调用日志

#### 问题: 数据不显示

**症状**: 页面空白或数据为 0

**解决方案**:

1. 检查 RPC 节点连接
2. 检查合约地址
3. 检查网络选择（BSC 主网）
4. 查看 Network 请求

### 移动端问题

#### 问题: TokenPocket 崩溃

**解决方案**:

```bash
# 不要使用 dev 模式
# npm run dev  ❌

# 使用生产构建
npm run build
npm run preview  ✅
```

#### 问题: 手机无法访问

**解决方案**:

1. 检查同一局域网
2. 检查防火墙
3. 使用 IP 地址（不要用 localhost）
4. 检查端口是否开放

---

## 性能优化

### 构建优化

#### 1. 代码分割

已配置自动代码分割:

```typescript
// vite.config.ts
manualChunks(id) {
  if (id.includes('node_modules')) {
    return 'vendor';
  }
}
```

#### 2. 压缩优化

生产构建自动启用:

- JS 压缩: Terser
- CSS 压缩: cssnano
- HTML 压缩: html-minifier

#### 3. 资源优化

- 图片: 使用 WebP 格式
- 字体: 使用 woff2 格式
- SVG: 使用 SVGR 组件化

### 运行时优化

#### 1. 懒加载

```typescript
// 路由懒加载
const Home = lazy(() => import("./pages/Home"));
```

#### 2. 缓存策略

```typescript
// React Query 缓存配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 分钟
      cacheTime: 300000, // 5 分钟
    },
  },
});
```

#### 3. 防抖节流

```typescript
// 使用 lodash
import { debounce } from "lodash";

const handleSearch = debounce((value) => {
  // 搜索逻辑
}, 300);
```

---

## 监控和日志

### 错误监控

在 `src/main.tsx` 中添加全局错误处理:

```typescript
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  // 发送到错误监控服务
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  // 发送到错误监控服务
});
```

### 性能监控

```typescript
// 监控页面加载时间
window.addEventListener("load", () => {
  const perfData = performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  console.log("Page load time:", pageLoadTime, "ms");
});
```

### 用户行为追踪

```typescript
// 追踪钱包连接
const trackWalletConnect = (address: string) => {
  console.log("Wallet connected:", address);
  // 发送到分析服务
};

// 追踪交易
const trackTransaction = (txHash: string, type: string) => {
  console.log("Transaction:", type, txHash);
  // 发送到分析服务
};
```

---

## 安全最佳实践

### 1. 环境变量

- ✅ 使用 `VITE_` 前缀暴露给客户端
- ❌ 不要在前端存储私钥或敏感信息
- ✅ 使用 `.env.example` 作为模板

### 2. 依赖安全

```bash
# 定期检查依赖漏洞
npm audit

# 自动修复
npm audit fix
```

### 3. 代码审查

- 提交前运行 lint: `npm run lint`
- 使用 TypeScript 类型检查
- Code review 必须通过

### 4. 合约交互

- ✅ 验证合约地址
- ✅ 检查交易参数
- ✅ 设置合理的 Gas Limit
- ❌ 不要信任用户输入

---

## 附录

### A. 常用命令

```bash
# 开发
npm run dev              # 开发模式
npm run dev:fork         # Fork 模式
npm run dev:local        # Local 模式

# 构建
npm run build            # 生产构建
npm run build:fork       # Fork 构建

# 预览
npm run preview          # 预览构建

# 代码质量
npm run lint             # 运行 ESLint
```

### B. 目录结构

```
hy-web/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 资源文件
│   ├── components/      # 通用组件
│   ├── constants/       # 常量和配置
│   ├── hooks/           # 自定义 Hooks
│   ├── pages/           # 页面组件
│   ├── providers/       # Context Providers
│   ├── router/          # 路由配置
│   ├── stores/          # MobX Stores
│   ├── utils/           # 工具函数
│   ├── App.tsx          # 根组件
│   └── main.tsx         # 入口文件
├── docs/                # 文档
├── .env                 # 环境变量（开发）
├── .env.fork            # 环境变量（Fork）
├── .env.local           # 环境变量（Local）
├── .env.production      # 环境变量（生产）
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── vercel.json          # Vercel 配置
```

### C. 技术栈

- **框架**: React 18
- **构建工具**: Vite 6
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **状态管理**: MobX 6
- **Web3**: Wagmi 2 + Viem 2
- **UI 组件**: Ant Design Mobile 5
- **路由**: React Router 6

### D. 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- 移动端: iOS Safari >= 14, Chrome Android >= 90

---

**文档版本**: v1.0  
**最后更新**: 2025-12-25  
**维护者**: 华懿 IDX 技术团队
