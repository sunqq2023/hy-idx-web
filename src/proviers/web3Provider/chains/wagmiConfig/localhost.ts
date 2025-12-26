import { chainsSvgs } from "assets";
import { IWeb3ChainType, IWeb3NetworkType } from "../../type";
import { localhost as localhostChain } from "@wagmi/core/chains";

const icon = chainsSvgs.bscSvg; // 使用 BSC 图标，因为是 Fork BSC

const networkType: IWeb3NetworkType = "test";

// Anvil 本地链配置
// 支持多种 Chain ID: 31337 (默认), 56 (Fork BSC), 1337 (备用)
const getChainId = (): number => {
  const envChainId = Number(import.meta.env.VITE_CHAIN_ID);
  const rpcUrl = import.meta.env.VITE_RPC_URL as string;

  // 如果 RPC URL 是本地地址，使用环境变量中的 Chain ID
  if (rpcUrl?.includes("127.0.0.1") || rpcUrl?.includes("localhost")) {
    return envChainId || 31337;
  }

  return 31337; // 默认
};

const chainInfo: IWeb3ChainType = {
  chain: {
    ...localhostChain,
    id: getChainId(),
    name: "Localhost (Anvil Fork)",
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
    contracts: {
      multicall3: {
        address: "0xca11bde05977b3631167028862be2a173976ca11",
        blockCreated: 15921452,
      },
    },
  },
  id: getChainId(),
  type: "EVM",
  name: "Localhost (Anvil Fork)",
  icon: icon,
  networkType,
};

export default chainInfo;
