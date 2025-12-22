/**
 * RSA 签名调试工具
 * 用于排查生产环境签名错误问题
 */

import { signRequest } from "./rsaSignature";

/**
 * 测试签名生成
 * 在浏览器控制台调用此函数来验证签名
 */
export function testSignature() {
  console.log("========== 签名测试 ==========");

  // 测试用例 1：GET 请求（无 body）
  const test1 = signRequest(
    "GET",
    "/mix/getPhoneByAddress/0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300",
  );
  console.log("测试 1 - GET 请求:");
  console.log("  签名:", test1.signature.substring(0, 50) + "...");
  console.log("  完整签名:", test1.signature);
  console.log("  时间戳:", test1.timestamp);

  // 测试用例 2：POST 请求（有 body）
  const body = JSON.stringify({
    phone: "18628395611",
    address: "0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300",
  });
  const test2 = signRequest("POST", "/mix/confirmBinding", body);
  console.log("\n测试 2 - POST 请求:");
  console.log("  签名:", test2.signature.substring(0, 50) + "...");
  console.log("  完整签名:", test2.signature);
  console.log("  时间戳:", test2.timestamp);
  console.log("  请求体:", body);

  // 测试用例 3：检查时间戳
  const now = new Date();
  const timestamp = Math.floor(Date.now() / 1000);
  console.log("\n时间戳检查:");
  console.log("  当前时间:", now.toISOString());
  console.log("  时间戳（秒）:", timestamp);
  console.log("  时间戳（毫秒）:", Date.now());

  console.log("\n========== 测试完成 ==========");
  return { test1, test2 };
}

/**
 * 验证 URL 路径提取
 */
export function testUrlParsing(url: string) {
  console.log("========== URL 解析测试 ==========");
  console.log("输入 URL:", url);

  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const urlObj = new URL(url);
      console.log("解析结果:");
      console.log("  协议:", urlObj.protocol);
      console.log("  主机:", urlObj.host);
      console.log("  路径:", urlObj.pathname);
      console.log("  查询参数:", urlObj.search);
      console.log("  哈希:", urlObj.hash);
      return urlObj.pathname;
    } else {
      console.log("相对路径，直接使用:", url);
      return url;
    }
  } catch (error) {
    console.error("URL 解析失败:", error);
    return null;
  }
}

/**
 * 比较两个签名
 */
export function compareSignatures(method: string, url: string, body?: string) {
  console.log("========== 签名比较 ==========");

  // 生成签名 1（当前时间）
  const sig1 = signRequest(method, url, body);
  console.log("签名 1:");
  console.log("  时间戳:", sig1.timestamp);
  console.log("  签名:", sig1.signature.substring(0, 50) + "...");

  // 等待 1 秒
  setTimeout(() => {
    // 生成签名 2（1秒后）
    const sig2 = signRequest(method, url, body);
    console.log("\n签名 2 (1秒后):");
    console.log("  时间戳:", sig2.timestamp);
    console.log("  签名:", sig2.signature.substring(0, 50) + "...");

    console.log("\n比较结果:");
    console.log("  时间戳相同:", sig1.timestamp === sig2.timestamp);
    console.log("  签名相同:", sig1.signature === sig2.signature);
  }, 1000);
}

// 导出到全局对象，方便在浏览器控制台调用
if (typeof window !== "undefined") {
  (window as any).debugSignature = {
    testSignature,
    testUrlParsing,
    compareSignatures,
  };
  console.log("✅ 签名调试工具已加载，可在控制台使用 window.debugSignature");
}
