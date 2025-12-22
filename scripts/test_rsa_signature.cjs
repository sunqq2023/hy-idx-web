/**
 * RSA签名测试脚本 (Node.js)
 * 使用方法：
 *   node test_rsa_signature.js <接口名称> [参数...]
 *
 * 示例：
 *   node test_rsa_signature.js getMix --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300
 *   node test_rsa_signature.js addMix --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300 --amount 10.5
 *   node test_rsa_signature.js getAddressByPhone --phone 18628395611
 *   node test_rsa_signature.js getPhoneByAddress --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300
 *   node test_rsa_signature.js transferMix --fromPhone 18628395611 --toPhone 13900139000 --amount 10.5
 *   node test_rsa_signature.js rejectBinding --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300
 *
 * 需要安装依赖：
 *   npm install node-forge axios
 */

const forge = require("node-forge");
const axios = require("axios");

// ========== 配置区域 ==========
// 1. 配置服务器地址
// const SERVER_URL = 'http://localhost:8090';
const SERVER_URL = "https://www.ihealth.vip/api";

// 2. 配置 API Key（管理接口必需）
const API_KEY = "5rLeqyHtwwMzZ1CD4YlXBg/qSfKDbrpDCNkAvS186F4="; // 请替换为实际的 API Key

// 3. 配置私钥（从 /rsa/generate 接口获取的私钥）
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
-----END PRIVATE KEY-----
`;

// ========== 接口配置 ==========
const API_ENDPOINTS = {
  // 查询接口（无需API Key，POST需要RSA签名）
  getMix: {
    method: "POST",
    path: "/mix/getMix",
    needsApiKey: false,
    needsRsaSignature: true,
    params: ["phone", "address"],
    description: "查询 Mix 余额",
  },
  getAddressByPhone: {
    method: "GET",
    path: "/mix/getAddressByPhone",
    needsApiKey: false,
    needsRsaSignature: false,
    params: ["phone"],
    description: "通过手机号查询地址",
  },
  getPhoneByAddress: {
    method: "GET",
    path: "/mix/getPhoneByAddress",
    needsApiKey: false,
    needsRsaSignature: false,
    params: ["address"],
    description: "通过地址查询手机号",
  },
  // 管理接口（需要API Key，POST需要RSA签名）
  addMix: {
    method: "POST",
    path: "/mix/addMix",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address", "amount"],
    description: "添加 Mix 余额",
  },
  subMix: {
    method: "POST",
    path: "/mix/subMix",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address", "amount"],
    description: "减少 Mix 余额",
  },
  boundUserPhone: {
    method: "POST",
    path: "/mix/boundUserPhone",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address"],
    description: "绑定手机号和地址",
  },
  confirmBinding: {
    method: "POST",
    path: "/mix/confirmBinding",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address"],
    description: "确认绑定",
  },
  rejectBinding: {
    method: "POST",
    path: "/mix/rejectBinding",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address"],
    description: "拒绝绑定",
  },
  transferMix: {
    method: "POST",
    path: "/mix/transferMix",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["fromPhone", "toPhone", "amount"],
    description: "转赠Mix",
  },
  unboundUserPhone: {
    method: "POST",
    path: "/mix/unboundUserPhone",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address"],
    description: "解绑手机号",
  },
  changeUserPhone: {
    method: "POST",
    path: "/mix/changeUserPhone",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "newPhone", "address"],
    description: "更换手机号",
  },
  changeUserAddress: {
    method: "POST",
    path: "/mix/changeUserAddress",
    needsApiKey: true,
    needsRsaSignature: true,
    params: ["phone", "address", "newAddress"],
    description: "更换地址",
  },
};

// ========== 签名函数 ==========
function signRequest(method, url, body, privateKeyPem) {
  // 加载私钥
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

  // 获取时间戳（秒）
  const timestamp = Math.floor(Date.now() / 1000);

  // 构建待签名字符串
  const signString = `method=${method}&url=${url}&timestamp=${timestamp}&body=${body || ""}`;

  // 使用私钥签名
  const md = forge.md.sha256.create();
  md.update(signString, "utf8");
  const signature = privateKey.sign(md);
  const signatureBase64 = forge.util.encode64(signature);

  return {
    signature: signatureBase64,
    timestamp: timestamp.toString(),
    signString: signString,
  };
}

// ========== 发送请求函数 ==========
async function sendRequest(endpoint, params) {
  const config = API_ENDPOINTS[endpoint];
  if (!config) {
    throw new Error(`未知的接口: ${endpoint}`);
  }

  // 构建请求体或URL参数
  let url = config.path;
  let body = null;
  let queryParams = "";

  if (config.method === "GET") {
    // GET 请求：参数作为路径参数
    if (config.params.includes("phone")) {
      url = `${config.path}/${params.phone}`;
    } else if (config.params.includes("address")) {
      url = `${config.path}/${params.address}`;
    }
  } else {
    // POST 请求：参数作为请求体
    const bodyObj = {};
    config.params.forEach((param) => {
      if (params[param] !== undefined) {
        bodyObj[param] = params[param];
      }
    });
    body = JSON.stringify(bodyObj);
  }

  // 构建请求头
  const headers = {
    "Content-Type": "application/json",
  };

  // 添加 API Key（如果需要）
  if (config.needsApiKey) {
    headers["MIX-API-Key"] = API_KEY;
  }

  // 添加 RSA 签名（如果需要）
  if (config.needsRsaSignature && config.method === "POST") {
    const signResult = signRequest(
      config.method,
      config.path,
      body,
      PRIVATE_KEY_PEM,
    );
    headers["X-Signature"] = signResult.signature;
    headers["X-Timestamp"] = signResult.timestamp;
  }

  try {
    const response = await axios({
      method: config.method,
      url: SERVER_URL + url,
      data: body ? JSON.parse(body) : undefined,
      headers: headers,
    });

    return {
      httpCode: response.status,
      response: response.data,
    };
  } catch (error) {
    return {
      httpCode: error.response?.status || 500,
      response: error.response?.data || { message: error.message },
    };
  }
}

// ========== 解析命令行参数 ==========
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return null;
  }

  const endpoint = args[0];
  const params = {};

  // 解析 --key value 格式的参数
  // 只有 amount 参数需要转换为数字，其他参数保持为字符串
  const numericParams = ["amount"];

  for (let i = 1; i < args.length; i += 2) {
    if (args[i] && args[i].startsWith("--")) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      if (value !== undefined) {
        // 只对明确的数字参数进行转换，其他参数保持为字符串
        if (numericParams.includes(key) && !isNaN(value) && value !== "") {
          params[key] = parseFloat(value);
        } else {
          params[key] = value;
        }
      }
    }
  }

  return { endpoint, params };
}

// ========== 显示帮助信息 ==========
function showHelp() {
  console.log("========== RSA签名测试工具 ==========\n");
  console.log("使用方法：");
  console.log("  node test_rsa_signature.js <接口名称> [参数...]\n");
  console.log("可用接口：\n");

  Object.entries(API_ENDPOINTS).forEach(([name, config]) => {
    console.log(`  ${name.padEnd(20)} - ${config.description}`);
    console.log(`    ${config.method} ${config.path}`);
    console.log(`    参数: ${config.params.join(", ")}`);
    console.log(`    需要API Key: ${config.needsApiKey ? "是" : "否"}`);
    console.log(
      `    需要RSA签名: ${config.needsRsaSignature && config.method === "POST" ? "是" : "否"}`,
    );
    console.log("");
  });

  console.log("示例：\n");
  console.log("  # 查询 Mix 余额");
  console.log(
    "  node test_rsa_signature.js getMix --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300\n",
  );
  console.log("  # 添加 Mix 余额");
  console.log(
    "  node test_rsa_signature.js addMix --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300 --amount 10.5\n",
  );
  console.log("  # 通过手机号查询地址");
  console.log(
    "  node test_rsa_signature.js getAddressByPhone --phone 18628395611\n",
  );
  console.log("  # 通过地址查询手机号");
  console.log(
    "  node test_rsa_signature.js getPhoneByAddress --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300\n",
  );
  console.log("  # 绑定手机号和地址");
  console.log(
    "  node test_rsa_signature.js boundUserPhone --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300\n",
  );
  console.log("  # 确认绑定");
  console.log(
    "  node test_rsa_signature.js confirmBinding --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300\n",
  );
  console.log("  # 拒绝绑定");
  console.log(
    "  node test_rsa_signature.js rejectBinding --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300\n",
  );
  console.log("  # 转赠Mix");
  console.log(
    "  node test_rsa_signature.js transferMix --fromPhone 18628395611 --toPhone 13900139000 --amount 10.5\n",
  );
  console.log("  # 更换手机号");
  console.log(
    "  node test_rsa_signature.js changeUserPhone --phone 18628395611 --newPhone 13900139000 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300\n",
  );
  console.log("  # 更换地址");
  console.log(
    "  node test_rsa_signature.js changeUserAddress --phone 18628395611 --address 0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300 --newAddress 0x9876543210987654321098765432109876543210\n",
  );
}

// ========== 主函数 ==========
async function main() {
  try {
    const parsed = parseArgs();

    if (
      !parsed ||
      parsed.endpoint === "help" ||
      parsed.endpoint === "--help" ||
      parsed.endpoint === "-h"
    ) {
      showHelp();
      return;
    }

    const { endpoint, params } = parsed;

    // 验证接口是否存在
    if (!API_ENDPOINTS[endpoint]) {
      console.error(`错误: 未知的接口 "${endpoint}"`);
      console.log('\n使用 "node test_rsa_signature.js help" 查看可用接口列表');
      process.exit(1);
    }

    const config = API_ENDPOINTS[endpoint];

    // 验证必需参数
    const missingParams = config.params.filter(
      (param) => params[param] === undefined,
    );
    if (missingParams.length > 0) {
      console.error(`错误: 缺少必需参数: ${missingParams.join(", ")}`);
      console.log(`\n接口 ${endpoint} 需要参数: ${config.params.join(", ")}`);
      process.exit(1);
    }

    console.log(`========== 调用接口: ${endpoint} ==========`);
    console.log(`描述: ${config.description}`);
    console.log(`方法: ${config.method}`);
    console.log(`路径: ${config.path}`);
    console.log(`参数:`, params);
    console.log("----------------------------------------\n");

    const result = await sendRequest(endpoint, params);

    console.log("HTTP状态码:", result.httpCode);
    console.log("响应:", JSON.stringify(result.response, null, 2));
    console.log("\n========== 请求完成 ==========");
  } catch (error) {
    console.error("错误:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行主函数
main();
