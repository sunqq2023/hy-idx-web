import { http, createConfig } from "@wagmi/core";

import arbitrum from "./wagmiConfig/arbitrum";
import arbitrumSepolia from "./wagmiConfig/arbitrumSepolia";
import avalanche from "./wagmiConfig/avalanche";
import base from "./wagmiConfig/base";
import baseSepolia from "./wagmiConfig/baseSepolia";
import blast from "./wagmiConfig/blast";
import blastSepolia from "./wagmiConfig/blastSepolia";
import bsc from "./wagmiConfig/bsc";
import bscTestnet from "./wagmiConfig/bscTestnet";
import ethereum from "./wagmiConfig/ethereum";
import linea from "./wagmiConfig/linea";
import lineaSepolia from "./wagmiConfig/lineaSepolia";
import mantle from "./wagmiConfig/mantle";
import mantleSepoliaTestnet from "./wagmiConfig/mantleSepoliaTestnet";
import optimism from "./wagmiConfig/optimism";
import optimismSepolia from "./wagmiConfig/optimismSepolia";
import polygon from "./wagmiConfig/polygon";
import sepolia from "./wagmiConfig/sepolia";
import solana from "./wagmiConfig/solana";
import allChain from "./wagmiConfig/allChain";
import btc from "./wagmiConfig/btc";
import ton from "./wagmiConfig/ton";
import tron from "./wagmiConfig/tron";
import scroll from "./wagmiConfig/scroll";
import b3 from "./wagmiConfig/b3";
import localhost from "./wagmiConfig/localhost";

export const prodEvmChains = [
  ethereum,
  bsc,
  arbitrum,
  base,
  blast,
  avalanche,
  polygon,
  scroll,
  optimism,
  linea,
  b3,
];

// 根据 mode 决定使用的链
const getActiveChains = () => {
  const mode = import.meta.env.MODE;

  // 生产环境：只支持主网和测试网
  if (mode === "production") {
    console.log("🚀 Production mode: Using Mainnet + Testnet only");
    const allChains = [...prodEvmChains];
    if (!allChains.find((chain) => chain.id === bscTestnet.id)) {
      allChains.push(bscTestnet);
    }
    return allChains;
  }

  // Fork 模式：只支持 Anvil Fork (Chain ID 1056)
  if (mode === "fork") {
    console.log("🔧 Fork mode: Using Anvil Fork (Chain ID 1056)");
    return [localhost];
  }

  // Local 模式：只支持 Anvil Local (Chain ID 31337)
  if (mode === "local") {
    console.log("🔧 Local mode: Using Anvil Local (Chain ID 31337)");
    return [localhost];
  }

  // 开发模式（默认）：支持主网和测试网
  console.log("🔧 Development mode: Using Mainnet + Testnet");
  const allChains = [...prodEvmChains];
  if (!allChains.find((chain) => chain.id === bscTestnet.id)) {
    allChains.push(bscTestnet);
  }
  return allChains;
};

export const renderChains = [btc, ...prodEvmChains, solana, ton, tron];

export const allChains = [allChain, ...renderChains];

export const evmChainsConfig = () => {
  const activeChains = getActiveChains();
  return createConfig({
    chains: activeChains.map((item) => item.chain) as any,
    transports: Object.fromEntries(
      activeChains.map((chain) => chain?.id).map((key) => [key, http()]),
    ),
  });
};

export const evmChainConfig = (chainId: number) => {
  const findChains = prodEvmChains.filter((item) => item.id === chainId);
  if (!findChains.length) return undefined;
  return createConfig({
    chains: findChains.map((item) => item.chain) as any,
    transports: {
      [chainId]: http(),
    },
  });
};

const chains = {
  allChain,
  arbitrum,
  arbitrumSepolia,
  avalanche,
  base,
  baseSepolia,
  blast,
  blastSepolia,
  bsc,
  bscTestnet,
  ethereum,
  linea,
  lineaSepolia,
  mantle,
  mantleSepoliaTestnet,
  optimism,
  optimismSepolia,
  polygon,
  solana,
  btc,
  scroll,
  b3,
  tron,
  ton,
  localhost,
};

export const marketChain = {
  [chains.btc.id]: {
    chain: "BITCOIN",
    token: "bitcoin",
  },
  [chains.ethereum.id]: {
    chain: "ETH",
    token: "ethereum",
  },
  [chains.solana.id]: {
    chain: "SOLANA",
    token: "solana",
  },
  [chains.ton.id]: {
    chain: "TON",
    token: "ton",
  },
  [chains.tron.id]: {
    chain: "TRON",
    token: "tron",
  },
  [chains.bsc.id]: {
    chain: "BSC",
    token: "bnb",
  },
  [chains.arbitrum.id]: {
    chain: "ARBITRUM",
    token: "arb_eth",
  },
  [chains.base.id]: {
    chain: "BASE",
    token: "base_eth",
  },
  [chains.blast.id]: {
    chain: "BLAST",
    token: "blast",
  },
  [chains.avalanche.id]: {
    chain: "AVAX",
    token: "avax",
  },
  [chains.polygon.id]: {
    chain: "POLYGON_POS",
    token: "matic",
  },
  [chains.scroll.id]: {
    chain: "SCROLL",
    token: "scroll_eth",
  },
  [chains.optimism.id]: {
    chain: "OPTIMISM",
    token: "op_eth",
  },
  [chains.linea.id]: {
    chain: "LINEA",
    token: "linea_eth",
  },
  [chains.b3.id]: {
    chain: "B3",
    token: "ethereum",
  },
  // [chains.sepolia.id]: {
  //   chain: 'SEPOLIA',
  //   token: 'ethereum'
  // }
};
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export default chains;
