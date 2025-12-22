# 外部 API 配置说明

## 问题背景

在部署到 Cloudflare 后，发现 API 请求的 URL 从预期的 `https://www.ihealth.vip/api/mix/...` 变成了 `https://idmix.app/mix/...`。

## 原因分析

`/mix/*` 接口是**外部 API**（`https://www.ihealth.vip/api`），不是 idmix.app 域名的接口。

### 错误的做法

使用相对路径 `/mix/confirmBinding`：

- 开发环境：通过 Vite 代理转发 ✅
- 生产环境：被解析为 `https://idmix.app/mix/confirmBinding` ❌（404 错误）

## 正确的解决方案

**无论开发还是生产环境，都使用 `chainConfig.BIND_ADDRESS_URL` 配置的完整 URL。**

### 配置说明

在 `hy-web/src/constants/index.ts` 中，每个链配置都有 `BIND_ADDRESS_URL`：

```typescript
// BSC 测试网配置
const BSC_TESTNET_CONFIG: ChainContractAddresses = {
  // ... 其他配置
  BIND_ADDRESS_URL: "https://www.ihealth.vip/api",
};

// BSC 主网配置
const BSC_MAINNET_CONFIG: ChainContractAddresses = {
  // ... 其他配置
  BIND_ADDRESS_URL: "", // 主网合约未升级，绑定服务暂不可用
};

// Anvil Fork 配置
const ANVIL_FORK_CONFIG: ChainContractAddresses = {
  // ... 其他配置
  BIND_ADDRESS_URL: "http://127.0.0.1:8090",
};

// Anvil Local 配置
const ANVIL_LOCAL_CONFIG: ChainContractAddresses = {
  // ... 其他配置
  BIND_ADDRESS_URL:
    import.meta.env.VITE_BIND_ADDRESS_URL || "http://127.0.0.1:8090",
};
```

### 代码实现

#### 1. 使用 `chainConfig.BIND_ADDRESS_URL`

```typescript
// Home.tsx
const chainConfig = useChainConfig();

// GET 请求
const response = await fetch(
  `${chainConfig.BIND_ADDRESS_URL}/mix/getPhoneByAddress/${userAddress}`,
);

// POST 请求（带 RSA 签名）
const result = await sendSignedRequest(
  "POST",
  `${chainConfig.BIND_ADDRESS_URL}/mix/confirmBinding`,
  { phone, address },
);
```

#### 2. RSA 签名处理

`sendSignedRequest` 函数会自动：

1. 从完整 URL 中提取 pathname（如 `/mix/confirmBinding`）
2. 使用 pathname 生成 RSA 签名
3. 发送请求到完整 URL

```typescript
// rsaSignature.ts
export async function sendSignedRequest<T>(
  method: string,
  url: string, // 完整 URL: https://www.ihealth.vip/api/mix/confirmBinding
  body?: Record<string, unknown>,
): Promise<T> {
  // 提取 pathname 用于签名
  const urlObj = new URL(url);
  const urlPath = urlObj.pathname; // /mix/confirmBinding

  // 生成签名（使用 pathname）
  const { signature, timestamp } = signRequest(method, urlPath, bodyString);

  // 发送请求到完整 URL
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "MIX-API-Key": apiKey,
      "X-Signature": signature,
      "X-Timestamp": timestamp,
    },
    body: bodyString,
  });

  return response.json();
}
```

## 工作原理

### 开发环境（`npm run dev`）

1. 代码使用：`${chainConfig.BIND_ADDRESS_URL}/mix/confirmBinding`
2. 实际请求：`https://www.ihealth.vip/api/mix/confirmBinding`
3. 浏览器直接请求外部 API
4. 外部 API 需要配置 CORS 允许 `http://localhost:3001`

### 生产环境（Cloudflare）

1. 代码使用：`${chainConfig.BIND_ADDRESS_URL}/mix/confirmBinding`
2. 实际请求：`https://www.ihealth.vip/api/mix/confirmBinding`
3. 浏览器直接请求外部 API
4. 外部 API 需要配置 CORS 允许 `https://idmix.app`

## CORS 配置要求

外部 API（`https://www.ihealth.vip/api`）需要配置 CORS 允许以下来源：

```
Access-Control-Allow-Origin: http://localhost:3001, https://idmix.app
```

或者使用通配符（不推荐）：

```
Access-Control-Allow-Origin: *
```

## 注意事项

### 1. 不要使用相对路径

❌ 错误：

```typescript
await fetch("/mix/getPhoneByAddress/0x123");
```

✅ 正确：

```typescript
await fetch(`${chainConfig.BIND_ADDRESS_URL}/mix/getPhoneByAddress/0x123`);
```

### 2. 不要使用 Vite 代理

Vite 代理（`vite.config.ts` 中的 `/mix` 配置）**不应该用于外部 API**，因为：

- 生产环境没有 Vite 代理
- 会导致开发和生产环境行为不一致

### 3. RSA 签名

签名时使用 **pathname**（如 `/mix/confirmBinding`），不包含域名。

### 4. API Key

所有需要认证的接口都需要在请求头中包含：

```
MIX-API-Key: 5rLeqyHtwwMzZ1CD4YlXBg/qSfKDbrpDCNkAvS186F4=
```

## 测试

### 开发环境测试

```bash
npm run dev
# 访问 http://localhost:3001
# 检查 Network 面板，API 请求应该是完整 URL https://www.ihealth.vip/api/mix/...
```

### 生产环境测试

```bash
npm run build
npm run preview
# 访问 http://localhost:4173
# 检查 Network 面板，API 请求应该是完整 URL https://www.ihealth.vip/api/mix/...
```

### Cloudflare 部署测试

```bash
# 部署到 Cloudflare
npm run build
# 上传 dist 目录到 Cloudflare Pages

# 访问 https://idmix.app
# 检查 Network 面板，确认 API 请求正确
```

## 相关文件

- `hy-web/src/constants/index.ts` - 链配置（包含 BIND_ADDRESS_URL）
- `hy-web/src/utils/rsaSignature.ts` - RSA 签名和请求发送
- `hy-web/src/pages/user/components/Home.tsx` - 钱包绑定逻辑
- `hy-web/src/hooks/useChainConfig.ts` - 获取当前链配置的 Hook
