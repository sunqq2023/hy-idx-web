import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { trustWallet } from "@rainbow-me/rainbowkit/wallets";
import { bsc, bscTestnet } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import {
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { tokenPocketWallet } from "@rainbow-me/rainbowkit/wallets";

// 扩展 Window 接口以包含 TokenPocket 属性
interface WindowWithTokenPocket extends Window {
  tokenpocket?: unknown;
  tp?: unknown;
}

// 调试：检查 TokenPocket 环境
if (typeof window !== "undefined" && import.meta.env.DEV) {
  // 检查是否有 TokenPocket 浏览器扩展
  const win = window as WindowWithTokenPocket;
  const hasTokenPocketExtension =
    typeof win.tokenpocket !== "undefined" || typeof win.tp !== "undefined";

  const isMobile = /Mobile|Android|iOS/i.test(navigator.userAgent);

  console.log("🔍 TokenPocket Environment Check:", {
    hasTokenPocketExtension,
    userAgent: navigator.userAgent,
    isMobile,
    recommendation: hasTokenPocketExtension
      ? "✅ TokenPocket extension detected, should work"
      : isMobile
        ? "📱 Mobile device detected, will use deep link"
        : "⚠️ Desktop browser without TokenPocket extension - install extension or use another wallet",
  });

  // 如果桌面端没有扩展，给出提示
  if (!hasTokenPocketExtension && !isMobile) {
    console.warn(
      "⚠️ TokenPocket extension not detected. " +
        "Install TokenPocket browser extension or use MetaMask/Trust Wallet instead.",
    );
  }
}

// 自定义BSC链配置，使用更稳定的RPC节点
const customBsc: Chain = {
  ...bsc,
  rpcUrls: {
    default: {
      http: [
        "https://bsc.publicnode.com", // 优先使用 PublicNode（与后端一致）
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://rpc.ankr.com/bsc/ac79e83cf02a544dbb9b3f4c5d5478b2510b921e7d5739ded8791a932e8de0a6",
      ],
    },
  },
};

// 自定义BSC测试网配置，使用更快的RPC节点
const customBscTestnet: Chain = {
  ...bscTestnet,
  rpcUrls: {
    default: {
      http: [
        "https://bsc-testnet.publicnode.com", // 优先使用 PublicNode（与后端一致）
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://data-seed-prebsc-2-s1.binance.org:8545",
      ],
    },
  },
};

const localhost: Chain = {
  id: 1337,
  name: "local",
  contracts: {
    // 添加Multicall3合约地址（替换为你实际部署的地址）
    multicall3: {
      address: "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab" as `0x${string}`,
    },
  },
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://202.124.251.169:8545"],
    },
    public: {
      http: ["http://202.124.251.169:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "http://202.124.251.169:8545",
    },
  },
  testnet: true,
};

// Anvil Fork (BSC) - Chain ID 1056
const anvilFork: Chain = {
  id: 1056,
  name: "Anvil Fork (BSC)",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        // 优先使用环境变量中的 RPC URL（支持局域网 IP）
        import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
      ],
    },
    public: {
      http: [import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Anvil Fork Explorer",
      url: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545", // Fork 环境没有区块浏览器，使用 RPC URL
      apiUrl: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 15921452,
    },
  },
  testnet: true,
};

// 根据 mode 决定支持的链
const getSupportedChains = () => {
  const mode = import.meta.env.MODE;

  // 生产环境：只支持主网和测试网
  if (mode === "production") {
    console.log("🚀 Production mode: Using Mainnet + Testnet only");
    return [customBsc, customBscTestnet];
  }

  // Fork 模式：只支持 Anvil Fork
  if (mode === "fork") {
    console.log("🔧 Fork mode: Using Anvil Fork (Chain ID 1056)");
    return [anvilFork];
  }

  // Local 模式：只支持 Anvil Local
  if (mode === "local") {
    console.log("🔧 Local mode: Using Anvil Local (Chain ID 31337)");
    return [localhost];
  }

  // 开发模式（默认）：支持主网和测试网
  console.log("🔧 Development mode: Using Mainnet + Testnet");
  return [customBsc, customBscTestnet];
};

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "c6c2a2e243f4e96a433941e477c33844", // TODO: 如果无法访问，请创建新的 Project ID
  chains: getSupportedChains(),
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        tokenPocketWallet,
        trustWallet,
        metaMaskWallet,
        walletConnectWallet,
      ],
    },
  ],
});

export default config;
