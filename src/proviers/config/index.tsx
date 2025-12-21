import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { trustWallet } from "@rainbow-me/rainbowkit/wallets";
import { bsc, bscTestnet } from "wagmi/chains";
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
        "Install TokenPocket browser extension or use MetaMask/Trust Wallet instead."
    );
  }
}

// 自定义BSC链配置，使用更稳定的RPC节点
const customBsc = {
  ...bsc,
  rpcUrls: {
    default: {
      http: [
        "https://rpc.ankr.com/bsc/ac79e83cf02a544dbb9b3f4c5d5478b2510b921e7d5739ded8791a932e8de0a6",
        "https://bsc-dataseed1.binance.org",
        "https://bsc-dataseed2.binance.org",
        "https://bsc-dataseed3.binance.org",
        "https://bsc.publicnode.com",
      ],
    },
  },
};

const localhost = {
  id: 1337,
  name: "local",
  network: "local",
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

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "c6c2a2e243f4e96a433941e477c33844",
  chains: [customBsc, bscTestnet, localhost], // 使用自定义BSC配置替代默认的bsc
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
