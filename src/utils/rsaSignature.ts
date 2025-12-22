/**
 * RSA 签名工具
 * 用于对 API 请求进行签名
 * 使用 node-forge 库，与后端验证逻辑完全一致
 */

import forge from "node-forge";
import { MIX_API_KEY } from "@/constants";

// RSA 私钥（从服务器获取的私钥）
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzof8kmgUXNV7L
8C4+5mdskh6lr0o+ksvCIKejZ+oRdJZLlcxa9EanzPl+MNZ1LURJQ1N+btHfoEd+
xntS7pKMCRwVzJejMa0XQ2/utSRzBAsPQBtaycWLY66jw4iEIZ7zzB+cFCRqae8b
DghgyaBLFfyCR2NpIMu28ZMnXk1C7cJd6t1aLLQT26ipnfJJgNHfPWq1hfZd9vSw
P86ewfwi31v+1h2mbblbjx7RVFyOypwgdhnXSQSFauRhogKEd6exdZMvzcVTkXCl
MR1xkIZK50Fk4aLnqkwvg/FDJz0LbvXx1pCbIVSV+/BxDpwm00VQ+l5FndQp79x5
DXX/FGk9AgMBAAECggEACnjxi8P584AuSmPygkLC+VKsfDrTsIG05NisBUwH2qQq
JfZx/0R6AQrjab61pgexUTceXULfM/Mfb+3o3y0e+JCIZWHz3jUFcxOAqVFAsn7k
GSvC3IBiZq21TwFVimR+ZJa8KgiHlfeek7x18xSWJoJ94eeBDW42yi/bxSILjZD/
a/sa+SLEXEoYWHYhhVGOUxfmd/B0CmJibj+CqYcm9gJcqrbeD5f8zpv20735yeGl
omZLDVez2uiHW1SG+pzJBgEdm/m3jpeI8JaOgH2SotT2zWNOwa7RunPH6ndjT0sr
iPCY/Ei7ee8woCS8LNdNuLMtkD2buca0XOUeIGWDgQKBgQDeu9uxDlTuMwHKNCyl
PXp5S0dB7UrUOebAwQroG2aEbH+j2+oCzIktoPRLHp8fybgOaOnuKvy7B7luEFH4
+u5lKCSv/n3bTlY3THk8hkNYSW/HorHYoXq+jwLJT6GJhuQzjbOoSrhhT34uSbUN
ER2XDbRRjQz7K6VMFxFwQ1D5gQKBgQDOdjAB4l1gVQlUzFiyCjoyRqi3irYNB3mX
8Y5BHWAGSHOKTTLXVPkjlW8HPiMAk90Iw5iaUZODqJUnECTIfDOjZxXImm8eT92z
/IotQ/DbxDg7o+17PsssL+Os5rifFigcDMomnh5KwLWicGzrBiINm3BgrjxkprCq
pB4GVeS1vQKBgELeDQ9zqQW15HSrAzg8Y7dkZSkirxNVqrP1gGu8RiO9Wvh7fh6G
/yvmpVCkCcuGSK5yysAIwcT4ha/IUIO5+bX+vjzj3y7mrrV9TOxhtngb2+YILvJF
UE9DKef78xgRmhLsGKKOhBoavlvxHtykZcjCgX72JI6HROG6Dy8v1nCBAoGBALyD
rdIKnrgW7S5AZ7wpGnpNikAMp6295YiXRwythcA250igtItpSxLyny49zjf4yxn1
fqFpWwgcJhRE6VEmFwBcX8eLO2qyAf0V2hT6tDH2OGI8i9q8u0bdc0WsZWbdFEKI
awxX09DtpOttPAZc0zsZcsLUVNCSYz1sHP4r72kBAoGAbuHvo4zZAi4p7/Gof0y7
NuRhEkNYDJlntLVfmXoce2723F9payKOIv1YIpmHt3aPxsDomMqUmFwSnCd9wD0I
+6Wy7LtD3PlP+OeDvdcgGKvmL/epbHn9e+8SR4u8FfIavvir4jOK9qb7Dnohikv9
e3qWM/uD9fEV9tWrE+//vyo=
-----END PRIVATE KEY-----`;

/**
 * 使用 node-forge 进行 RSA 签名
 * 与测试脚本完全一致的实现
 * @param message 待签名的消息
 * @returns Base64 编码的签名
 */
function signWithNodeForge(message: string): string {
  try {
    // 加载私钥
    const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM);

    // 创建 SHA-256 消息摘要
    const md = forge.md.sha256.create();
    md.update(message, "utf8");

    // 使用私钥签名
    const signature = privateKey.sign(md);

    // 转换为 Base64
    const signatureBase64 = forge.util.encode64(signature);

    console.log("✅ 签名生成成功:", {
      消息长度: message.length,
      签名长度: signatureBase64.length,
      签名前50字符: signatureBase64.substring(0, 50),
    });

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

  console.log("========== RSA 签名调试 ==========");
  console.log("待签名字符串:", signString);
  console.log("待签名字符串长度:", signString.length);
  console.log("时间戳（秒）:", timestamp);
  console.log("方法:", method);
  console.log("URL:", url);
  console.log("请求体:", body || "(空)");
  console.log("请求体长度:", body ? body.length : 0);

  // 使用私钥签名（匹配 node-forge 的签名流程）
  const signature = signWithNodeForge(signString);

  console.log("生成的签名（完整）:", signature);
  console.log("生成的签名长度:", signature.length);
  console.log("========== 签名完成 ==========");

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
      console.log("🔍 URL 解析:", {
        原始URL: url,
        提取的路径: urlPath,
      });
    } catch (error) {
      // 如果 URL 解析失败，尝试提取路径部分
      const match = url.match(/^https?:\/\/[^/]+(\/[^?#]*)/);
      urlPath = match ? match[1] : url;
      console.warn("⚠️ URL parsing failed, extracted path:", urlPath, error);
    }
  } else {
    // 相对路径直接使用
    urlPath = url.startsWith("/") ? url : `/${url}`;
    console.log("🔍 相对路径:", { 原始: url, 处理后: urlPath });
  }

  // 生成签名（使用 pathname，与 node-forge 测试脚本一致）
  const { signature, timestamp } = signRequest(method, urlPath, bodyString);

  // 获取 API Key（优先使用传入的参数，否则使用环境变量）
  const finalApiKey = apiKey || MIX_API_KEY;

  console.log("📤 发送签名请求:", {
    method,
    完整URL: url,
    签名路径: urlPath,
    签名前50字符: signature.substring(0, 50) + "...",
    时间戳: timestamp,
    APIKey前20字符: finalApiKey.substring(0, 20) + "...",
    请求体: bodyString,
  });

  // 发送请求（使用完整 URL）
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "MIX-API-Key": finalApiKey,
      "X-Signature": signature,
      "X-Timestamp": timestamp,
    },
    body: bodyString,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "请求失败" }));
    console.error("❌ 请求失败:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log("✅ 请求成功:", result);
  return result;
}
