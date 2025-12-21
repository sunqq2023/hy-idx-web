/**
 * RSA 签名工具
 * 用于对 API 请求进行签名
 * 完全按照 node-forge 示例实现，确保与后端验证逻辑一致
 */

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
 * 使用 Web Crypto API 进行 RSA 签名
 * 注意：RSASSA-PKCS1-v1_5 算法会自动对数据进行 SHA-256 哈希（因为导入密钥时指定了 hash: 'SHA-256'）
 * 所以不需要手动先进行 SHA-256 哈希，否则会导致双重哈希
 *
 * node-forge 的 privateKey.sign(md) 中，md 是已经哈希过的消息摘要对象，所以不会再次哈希
 * Web Crypto API 的 RSASSA-PKCS1-v1_5 在导入密钥时指定了 hash，会自动哈希，所以直接传入原始数据
 * @param message 待签名的消息
 * @returns Base64 编码的签名
 */
async function signWithWebCrypto(message: string): Promise<string> {
  try {
    // 将 PEM 格式的私钥转换为 CryptoKey
    const privateKey = await importPrivateKey(PRIVATE_KEY_PEM);

    // 编码消息为 UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    console.log('签名调试 - 消息长度:', data.length);
    console.log('签名调试 - 消息前100字符:', message.substring(0, 100));

    // 直接使用 RSA-PKCS1-v1_5 签名
    // 算法内部会自动进行 SHA-256 哈希（因为导入密钥时指定了 hash: 'SHA-256'）
    // 不要先手动哈希，否则会导致双重哈希
    const signature = await crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      privateKey,
      data  // 直接使用原始数据，不要先哈希
    );

    // 转换为 Base64
    const signatureBase64 = arrayBufferToBase64(signature);

    console.log('签名调试 - 签名长度:', signature.byteLength);
    console.log('签名调试 - Base64 签名长度:', signatureBase64.length);
    console.log('签名调试 - Base64 签名前50字符:', signatureBase64.substring(0, 50));

    return signatureBase64;
  } catch (error) {
    console.error('RSA 签名失败:', error);
    throw new Error('签名失败');
  }
}


/**
 * 导入 PEM 格式的私钥
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // 移除 PEM 头尾和换行符
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  // Base64 解码
  const binaryDer = base64ToArrayBuffer(pemContents);

  // 导入私钥（使用 RSA-PKCS1-v1_5，匹配 node-forge）
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

/**
 * Base64 转 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * ArrayBuffer 转 Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 生成请求签名
 * @param method HTTP 方法
 * @param url 请求 URL（不包含域名）
 * @param body 请求体（JSON 字符串）
 * @returns 签名信息
 */
/**
 * 生成请求签名
 * 完全按照 node-forge 示例实现：
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
export async function signRequest(
  method: string,
  url: string,
  body?: string
): Promise<{ signature: string; timestamp: string }> {
  // 获取时间戳（秒，完全匹配 node-forge 示例）
  const timestamp = Math.floor(Date.now() / 1000);

  // 构建待签名字符串（完全匹配 node-forge 示例格式）
  const signString = `method=${method}&url=${url}&timestamp=${timestamp}&body=${body || ''}`;

  console.log('========== RSA 签名调试 ==========');
  console.log('待签名字符串:', signString);
  console.log('待签名字符串长度:', signString.length);
  console.log('时间戳（秒）:', timestamp);
  console.log('方法:', method);
  console.log('URL:', url);
  console.log('请求体:', body || '(空)');
  console.log('请求体长度:', body ? body.length : 0);

  // 使用私钥签名（匹配 node-forge 的签名流程）
  const signature = await signWithWebCrypto(signString);

  console.log('生成的签名（完整）:', signature);
  console.log('生成的签名长度:', signature.length);
  console.log('========== 签名完成 ==========');

  return {
    signature,
    timestamp: timestamp.toString(),
  };
}

/**
 * 发送带签名的请求
 * @param method HTTP 方法
 * @param url 完整 URL
 * @param body 请求体对象
 * @param apiKey 可选的 API Key，如果不提供则从环境变量读取
 * @returns 响应数据
 */
export async function sendSignedRequest<T = unknown>(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  apiKey?: string
): Promise<T> {
  const bodyString = body ? JSON.stringify(body) : undefined;

  // 处理相对路径和绝对路径
  let urlPath: string;
  // 如果是绝对 URL，提取 pathname
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      urlPath = new URL(url).pathname;
    } catch {
      // 如果 URL 解析失败，使用原始 URL
      urlPath = url;
      console.warn('URL parsing failed, using original URL:', url);
    }
  } else {
    // 相对路径直接使用（去掉开头的斜杠，如果有的话）
    urlPath = url.startsWith('/') ? url : `/${url}`;
  }

  // 生成签名
  const { signature, timestamp } = await signRequest(method, urlPath, bodyString);

  // 获取 API Key（优先使用传入的参数，否则使用环境变量）
  const finalApiKey = apiKey || MIX_API_KEY;

  console.log('发送签名请求:', {
    method,
    url,
    urlPath,
    signature: signature.substring(0, 50) + '...',
    timestamp,
    apiKey: finalApiKey.substring(0, 20) + '...',
    body: bodyString
  });

  // 发送请求
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'MIX-API-Key': finalApiKey,
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    },
    body: bodyString,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '请求失败' }));
    console.error('请求失败:', { status: response.status, errorData });
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}
