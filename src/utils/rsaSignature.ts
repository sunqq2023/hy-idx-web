/**
 * RSA 签名工具
 * 用于对 API 请求进行签名
 * 使用与测试脚本完全一致的签名算法
 *
 * 🔒 安全提醒：
 * - 生产环境不应该在前端存储私钥
 * - 开发环境可以从 .env 文件读取
 */

import forge from "node-forge";

/**
 * 从环境变量获取私钥
 * 统一从环境变量读取，开发和生产环境都使用相同方式
 */
function getPrivateKey(): string {
  const privateKey = import.meta.env.VITE_RSA_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("未找到RSA私钥，请在 .env 文件中设置 VITE_RSA_PRIVATE_KEY");
  }

  return privateKey;
}

/**
 * 使用与测试脚本完全一致的 RSA 签名方法
 * 在浏览器中使用 polyfill 来模拟 Node.js crypto
 * @param message 待签名的消息
 * @returns Base64 编码的签名
 */
function signMessage(message: string): string {
  try {
    // 加载私钥
    const privateKeyPem = getPrivateKey();
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    // 创建 SHA-256 消息摘要
    const md = forge.md.sha256.create();
    md.update(message, "utf8");

    // 使用私钥签名
    const signature = privateKey.sign(md);

    // 转换为 Base64
    const signatureBase64 = forge.util.encode64(signature);
    return signatureBase64;
  } catch (error) {
    console.error("❌ RSA 签名失败:", error);
    throw new Error("签名失败");
  }
}

/**
 * 生成请求签名
 * 完全按照 node-forge 测试脚本实现：
 * 1. 时间戳使用秒级（Math.floor(Date.now() / 1000)）
 * 2. 签名字符串格式：method=${method}&url=${url}&timestamp=${timestamp}&body=${body || ''}
 * 3. 使用 SHA-256 哈希
 * 4. 使用 RSA-PKCS1-v1_5 签名
 * 5. Base64 编码
 * @param method HTTP 方法
 * @param url 请求 URL（不包含域名）
 * @param body 请求体（JSON 字符串）
 * @returns 签名信息
 */
export function signRequest(
  method: string,
  url: string,
  body?: string,
): { signature: string; timestamp: string } {
  // 获取时间戳（秒，完全匹配 node-forge 示例）
  const timestamp = Math.floor(Date.now() / 1000);

  // 构建待签名字符串（完全匹配 node-forge 示例格式）
  const signString = `method=${method}&url=${url}&timestamp=${timestamp}&body=${body || ""}`;

  // 使用私钥签名（匹配 node-forge 的签名流程）
  const signature = signMessage(signString);
  return {
    signature,
    timestamp: timestamp.toString(),
  };
}

/**
 * 发送带签名的请求
 * @param method HTTP 方法
 * @param url 完整 URL（必须包含域名，如 https://www.ihealth.vip/api/mix/confirmBinding）
 * @param body 请求体对象
 * @param apiKey 可选的 API Key，如果不提供则从环境变量读取
 * @returns 响应数据
 */
export async function sendSignedRequest<T = unknown>(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  apiKey?: string,
): Promise<T> {
  const bodyString = body ? JSON.stringify(body) : undefined;

  // 提取 pathname 用于签名（不包含域名和查询参数）
  let urlPath: string;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const urlObj = new URL(url);
      // 只使用 pathname，不包含查询参数
      urlPath = urlObj.pathname;
    } catch (error) {
      // 如果 URL 解析失败，尝试提取路径部分
      const match = url.match(/^https?:\/\/[^/]+(\/[^?#]*)/);
      urlPath = match ? match[1] : url;

      console.warn("⚠️ URL parsing failed, extracted path:", urlPath, error);
    }
  } else {
    // 相对路径直接使用
    urlPath = url.startsWith("/") ? url : `/${url}`;
  }

  // 生成签名（使用 pathname，与 node-forge 测试脚本一致）
  const { signature, timestamp } = signRequest(method, urlPath, bodyString);

  // MIX_API_KEY 已废弃：仅在显式传入 apiKey 时才发送该请求头
  const finalApiKey = apiKey;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Content-Length": bodyString
      ? new TextEncoder().encode(bodyString).length.toString()
      : "0",
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  };
  if (finalApiKey) headers["MIX-API-Key"] = finalApiKey;

  // 发送请求（使用完整 URL）
  const response = await fetch(url, {
    method,
    headers,
    body: bodyString,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "请求失败" }));
    console.error("❌ 请求失败:", {
      status: response.status,
      statusText: response.statusText,
      url: url,
      method: method,
      headers: {
        ...(finalApiKey ? { "MIX-API-Key": finalApiKey } : {}),
        "X-Signature": signature.substring(0, 50) + "...",
        "X-Timestamp": timestamp,
      },
      requestBody: bodyString,
      errorData,
    });
    throw new Error(
      errorData.message || errorData.msg || `HTTP ${response.status}`,
    );
  }

  const result = await response.json();
  return result;
}
