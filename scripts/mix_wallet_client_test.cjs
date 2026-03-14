const crypto = require("crypto");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const forge = require("node-forge");

// 读取 .env 文件中的 VITE_RSA_PRIVATE_KEY
function loadPrivateKeyFromEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (!fs.existsSync(envPath)) {
      console.error("❌ .env 文件不存在:", envPath);
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(
      /VITE_RSA_PRIVATE_KEY\s*=\s*["']?([^"'\n]+)/,
    );

    if (!match) {
      console.error("❌ 在 .env 文件中未找到 VITE_RSA_PRIVATE_KEY");
      process.exit(1);
    }

    const privateKey = match[1].replace(/\\n/g, "\n");
    console.log("✅ 成功从 .env 文件读取私钥");
    return privateKey;
  } catch (error) {
    console.error("❌ 读取 .env 文件失败:", error.message);
    process.exit(1);
  }
}

// 示例：
// node scripts/mix_wallet_client_test.cjs bindWallet --phone 13800138000 --address 0x12 --sms_code 12345
// node scripts/mix_wallet_client_test.cjs transferMix --phone 13800138000 --address 0x12 --amount 10
// node scripts/mix_wallet_client_test.cjs checkBinding --phone 13800138000 --address 0x12
// node scripts/mix_wallet_client_test.cjs unbindWallet --phone 13800138000 --address 0x12

// ========== 配置区域 ==========
// 1. 配置服务器地址
// const API_BASE = "http://192.168.1.173:20699";
const API_BASE = "https://store.ihealth.vip";

// 3. 配置私钥（从 .env 文件读取 VITE_RSA_PRIVATE_KEY）
const PRIVATE_KEY = loadPrivateKeyFromEnv();

const ROUTES = {
  bindWallet: "/api/mix/bindWallet",
  unbindWallet: "/api/mix/unbindWallet",
  transferMix: "/api/mix/transferMix",
  checkBinding: "/api/mix/checkBinding",
};

if (!PRIVATE_KEY) {
  console.error("缺少环境变量 VITE_RSA_PRIVATE_KEY");
  process.exit(1);
}

function buildSignature(method, url, timestamp, body) {
  try {
    // 构建待签名字符串（与前端完全一致）
    const signString = `method=${method}&url=${url}&timestamp=${timestamp}&body=${body || ""}`;

    // 加载私钥（与前端完全一致）
    const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY);

    // 创建 SHA-256 消息摘要（与前端完全一致）
    const md = forge.md.sha256.create();
    md.update(signString, "utf8");

    // 使用私钥签名（与前端完全一致）
    const signature = privateKey.sign(md);

    // 转换为 Base64（与前端完全一致）
    const signatureBase64 = forge.util.encode64(signature);

    return signatureBase64;
  } catch (error) {
    console.error("❌ RSA 签名失败:", error);
    throw new Error("签名失败");
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const val =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "";
      args[key] = val;
      if (val) i += 1;
    } else {
      args._.push(token);
    }
  }
  return args;
}

function requestMix(path, body) {
  const urlObj = new URL(`${API_BASE}${path}`);
  const method = "POST";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = JSON.stringify(body);
  const signature = buildSignature(
    method,
    urlObj.pathname + urlObj.search,
    timestamp,
    bodyStr,
  );

  const client = urlObj.protocol === "https:" ? https : http;
  const options = {
    method,
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr),
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
  };

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`\n[${path}] response:`);
          console.log(parsed);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(bodyStr);
    req.end();
  });
}

function printUsage() {
  console.log("用法:");
  console.log(
    "  node test\\mix_wallet_client_test.js <action> --phone <手机号> --address <地址> [--sms_code <验证码>] [--amount <数量>]",
  );
  console.log(
    "动作(action) 可选: bindWallet | unbindWallet | transferMix | checkBinding",
  );
  console.log("示例:");
  console.log(
    "  node test\\mix_wallet_client_test.js bindWallet --phone 13800138000 --address 0xabc --sms_code 123456",
  );
  console.log(
    "  node test\\mix_wallet_client_test.js transferMix --phone 13800138000 --address 0xabc --amount 10",
  );
}

async function main() {
  const args = parseArgs(process.argv);
  const action = args._[0];

  if (!action || !ROUTES[action]) {
    printUsage();
    process.exit(1);
  }

  const body = {};
  if (args.phone) body.phone = args.phone;
  if (args.address) body.address = args.address;
  if (args.sms_code) body.sms_code = args.sms_code;
  if (args.amount) body.amount = args.amount;

  if (!body.phone || !body.address) {
    console.error("缺少必填参数: phone / address");
    printUsage();
    process.exit(1);
  }

  if (action === "bindWallet" && !body.sms_code) {
    console.error("bindWallet 需要 sms_code");
    printUsage();
    process.exit(1);
  }

  if (action === "transferMix" && !body.amount) {
    console.error("transferMix 需要 amount");
    printUsage();
    process.exit(1);
  }

  await requestMix(ROUTES[action], body);
}

main().catch((err) => {
  if (err.response) {
    console.error(err.response.data);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
