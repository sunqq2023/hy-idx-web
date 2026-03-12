const crypto = require('crypto');
const http = require('http');
const https = require('https');

// 示例：
// node test\\mix_wallet_client_test.js bindWallet --phone 13800138000 --address 0x12 --sms_code 12345
// node test\\mix_wallet_client_test.js transferMix --phone 13800138000 --address 0x12 --amount 10
// node test\\mix_wallet_client_test.js checkBinding --phone 13800138000 --address 0x12
// node test\\mix_wallet_client_test.js unbindWallet --phone 13800138000 --address 0x12

// ========== 配置区域 ==========
// 1. 配置服务器地址
const API_BASE = 'http://192.168.1.173:20699';
// const API_BASE = "https://store.ihealth.vip/api";

// 3. 配置私钥（从 /rsa/generate 接口获取的私钥）
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
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

const ROUTES = {
  bindWallet: '/api/mix/bindWallet',
  unbindWallet: '/api/mix/unbindWallet',
  transferMix: '/api/mix/transferMix',
  checkBinding: '/api/mix/checkBinding',
};

if (!PRIVATE_KEY) {
  console.error('缺少环境变量 MIX_RSA_PRIVATE_KEY');
  process.exit(1);
}

function buildSignature(method, url, timestamp, body) {
  const signString = `method=${method}&url=${url}&timestamp=${timestamp}&body=${body || ''}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signString);
  sign.end();
  return sign.sign(PRIVATE_KEY, 'base64');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
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
  const method = 'POST';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = JSON.stringify(body);
  const signature = buildSignature(method, urlObj.pathname + urlObj.search, timestamp, bodyStr);

  const client = urlObj.protocol === 'https:' ? https : http;
  const options = {
    method,
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    },
  };

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
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

    req.on('error', (err) => reject(err));
    req.write(bodyStr);
    req.end();
  });
}

function printUsage() {
  console.log('用法:');
  console.log('  node test\\mix_wallet_client_test.js <action> --phone <手机号> --address <地址> [--sms_code <验证码>] [--amount <数量>]');
  console.log('动作(action) 可选: bindWallet | unbindWallet | transferMix | checkBinding');
  console.log('示例:');
  console.log('  node test\\mix_wallet_client_test.js bindWallet --phone 13800138000 --address 0xabc --sms_code 123456');
  console.log('  node test\\mix_wallet_client_test.js transferMix --phone 13800138000 --address 0xabc --amount 10');
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
    console.error('缺少必填参数: phone / address');
    printUsage();
    process.exit(1);
  }

  if (action === 'bindWallet' && !body.sms_code) {
    console.error('bindWallet 需要 sms_code');
    printUsage();
    process.exit(1);
  }

  if (action === 'transferMix' && !body.amount) {
    console.error('transferMix 需要 amount');
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
