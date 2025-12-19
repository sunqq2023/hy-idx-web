/**
 * 多链合约地址配置
 * 根据不同的链ID返回对应的合约地址
 */

export interface ChainContractAddresses {
  // Token Addresses
  IDX_TOKEN: string;
  USDT_TOKEN: string;
  IDX_USDT_PAIR?: string;

  // Core Contracts
  STORAGE_ADDRESS: string;
  LOGIC_ADDRESS: string;
  PRODUCTION_LOGIC_ADDRESS: string;
  HISTORY_ADDRESS: string;
  NODE_SYSTEM_ADDRESS: string;

  // Extended Contracts
  EXTEND_STORAGE_ADDRESS: string;
  EXTEND_LOGIC_ADDRESS: string;
  EXTEND_HISTORY_ADDRESS: string;

  // Other Contracts
  SELLUSER_MANAGER_ADDRESS: string;

  // App Configuration
  ALLOWANCE_QUOTA: string;
  RPC_URL?: string;
}

// BSC 主网配置 (Chain ID: 56)
const BSC_MAINNET_CONFIG: ChainContractAddresses = {
  IDX_TOKEN: "0xc98F60B3F98E8Bf860436746db637e13B0e17458",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STORAGE_ADDRESS: "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  LOGIC_ADDRESS: "0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD",
  PRODUCTION_LOGIC_ADDRESS: "0x90531429c182707190de682Ed345e3577D44C3d6",
  HISTORY_ADDRESS: "0x367f5FaE08dC307B3Ac8A9A7AA26AC3005C6B51f",
  NODE_SYSTEM_ADDRESS: "0xf080f93067F52843231B13fF5024D41767898Bc8",
  EXTEND_STORAGE_ADDRESS: "0xdc567714763206341aC1d90C0d2fc58c57739412",
  EXTEND_LOGIC_ADDRESS: "0xFA5eA849E045520996725d13C3160D1D5420078e",
  EXTEND_HISTORY_ADDRESS: "0x6e426AFED0cF32d6E00b29c791199441658E4f73",
  SELLUSER_MANAGER_ADDRESS: "0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe",
  ALLOWANCE_QUOTA: "10000000",
  RPC_URL: "https://bsc-dataseed1.binance.org",
};

// BSC 测试网配置 (Chain ID: 97)
const BSC_TESTNET_CONFIG: ChainContractAddresses = {
  IDX_TOKEN: "0xa67ec3cC0d4E0a3B1D2C72bF5F5206FdAfcaf8bD",
  USDT_TOKEN: "0x2Bb3Ac5204Aba14E2915ab49052D82471C3f0C67",
  IDX_USDT_PAIR: "0x3221Fbd272787C1D6df3476F029B711e0B0c352d",
  STORAGE_ADDRESS: "0xEd935db4871D140799C07b86330c6b1B52A7bC1F",
  LOGIC_ADDRESS: "0xbD1f0Fb5aaDc22201d1d3e7bb5F66D6a75C9E567",
  PRODUCTION_LOGIC_ADDRESS: "0x288F6339FA31bda1A02fA07ef572f241B2f8f579",
  HISTORY_ADDRESS: "0xf97dcCf449941c6FB255e12B72E27c9ceEd165AE",
  NODE_SYSTEM_ADDRESS: "0x4F9D0BB295F43a3DCEa22BA645F6c51310E808f3",
  EXTEND_STORAGE_ADDRESS: "0x065010AD76A285A0618fd45668c4973fEa363A14",
  EXTEND_LOGIC_ADDRESS: "0x353d3526b7627756902bBBb793d4A0Ac99B8Bc16",
  EXTEND_HISTORY_ADDRESS: "0xe58b6777fC1c39D3e5DaaAfF09261F6c528BB5AB",
  SELLUSER_MANAGER_ADDRESS: "0x09012C1a6955fD76603453011F058f8567d1cbA3",
  ALLOWANCE_QUOTA: "10000000",
  RPC_URL: "https://bsc-testnet.publicnode.com",
};

// 本地开发配置 (Anvil Fork BSC, Chain ID: 56 或 31337)
const LOCAL_FORK_CONFIG: ChainContractAddresses = {
  IDX_TOKEN: "0xc98F60B3F98E8Bf860436746db637e13B0e17458",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STORAGE_ADDRESS: "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  LOGIC_ADDRESS: "0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD",
  PRODUCTION_LOGIC_ADDRESS: "0x90531429c182707190de682Ed345e3577D44C3d6",
  HISTORY_ADDRESS: "0x367f5FaE08dC307B3Ac8A9A7AA26AC3005C6B51f",
  NODE_SYSTEM_ADDRESS: "0xf080f93067F52843231B13fF5024D41767898Bc8",
  EXTEND_STORAGE_ADDRESS: "0xdc567714763206341aC1d90C0d2fc58c57739412",
  EXTEND_LOGIC_ADDRESS: "0xFA5eA849E045520996725d13C3160D1D5420078e",
  EXTEND_HISTORY_ADDRESS: "0x6e426AFED0cF32d6E00b29c791199441658E4f73",
  SELLUSER_MANAGER_ADDRESS: "0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe",
  ALLOWANCE_QUOTA: "10000000",
  RPC_URL: "http://127.0.0.1:8545",
};

// 链配置映射
const CHAIN_CONFIGS: Record<number, ChainContractAddresses> = {
  56: BSC_MAINNET_CONFIG, // BSC 主网
  97: BSC_TESTNET_CONFIG, // BSC 测试网
  31337: LOCAL_FORK_CONFIG, // Anvil 本地链（默认 Chain ID）
  1337: LOCAL_FORK_CONFIG, // Anvil 本地链（备用 Chain ID）
};

/**
 * 检查是否是本地开发环境
 * 通过 RPC URL 判断，而不是 Chain ID
 */
const isLocalEnvironment = (): boolean => {
  const rpcUrl = import.meta.env.VITE_RPC_URL as string;
  return rpcUrl?.includes("127.0.0.1") || rpcUrl?.includes("localhost");
};

/**
 * 根据链ID获取合约配置
 * @param chainId 链ID
 * @returns 合约地址配置
 */
export const getChainConfig = (
  chainId: number,
): ChainContractAddresses | null => {
  // 优先检查是否是本地开发环境（通过 RPC URL 判断）
  // 这样即使 Anvil 使用 --chain-id 56，也能正确识别为本地环境
  if (isLocalEnvironment()) {
    console.log(
      "🔧 Using local Anvil fork configuration (detected by RPC URL)",
    );
    return LOCAL_FORK_CONFIG;
  }

  // 如果是 Anvil 的默认 Chain ID，也使用本地配置
  if (chainId === 31337 || chainId === 1337) {
    console.log("🔧 Detected Anvil chain ID, using local fork configuration");
    return LOCAL_FORK_CONFIG;
  }

  // 根据 Chain ID 返回对应配置
  const config = CHAIN_CONFIGS[chainId];
  if (config) {
    const chainName =
      chainId === 56
        ? "BSC Mainnet"
        : chainId === 97
          ? "BSC Testnet"
          : `Chain ${chainId}`;
    console.log(`✅ Using configuration for ${chainName}`);
  }

  return config || null;
};

/**
 * 获取当前环境的链配置
 * 默认使用硬编码配置，支持环境变量覆盖（用于特殊情况）
 */
export const getCurrentChainConfig = (): ChainContractAddresses => {
  // 优先使用硬编码配置（支持多链）
  // 默认返回 BSC 主网配置，实际使用时会通过 useChainConfig 根据钱包链 ID 动态切换

  // 如果设置了环境变量，则覆盖所有链的配置（不推荐，会失去多链支持）
  if (import.meta.env.VITE_STORAGE_ADDRESS) {
    console.warn(
      "⚠️ Using environment variables will override all chain configs and disable multi-chain support!",
    );
    return {
      IDX_TOKEN: import.meta.env.VITE_IDX_TOKEN as string,
      USDT_TOKEN: import.meta.env.VITE_USDT_TOKEN as string,
      IDX_USDT_PAIR: import.meta.env.VITE_IDX_USDT_PAIR as string,
      STORAGE_ADDRESS: import.meta.env.VITE_STORAGE_ADDRESS as string,
      LOGIC_ADDRESS: import.meta.env.VITE_LOGIC_ADDRESS as string,
      PRODUCTION_LOGIC_ADDRESS: import.meta.env
        .VITE_PRODUCTION_LOGIC_ADDRESS as string,
      HISTORY_ADDRESS: import.meta.env.VITE_HISTORY_ADDRESS as string,
      NODE_SYSTEM_ADDRESS: import.meta.env.VITE_NODE_SYSTEM_ADDRESS as string,
      EXTEND_STORAGE_ADDRESS: import.meta.env
        .VITE_EXTEND_STORAGE_ADDRESS as string,
      EXTEND_LOGIC_ADDRESS: import.meta.env.VITE_EXTEND_LOGIC_ADDRESS as string,
      EXTEND_HISTORY_ADDRESS: import.meta.env
        .VITE_EXTEND_HISTORY_ADDRESS as string,
      SELLUSER_MANAGER_ADDRESS: import.meta.env
        .VITE_SELLUSER_MANAGER_ADDRESS as string,
      ALLOWANCE_QUOTA: import.meta.env.VITE_ALLOWANCE_QUOTA || "10000000",
      RPC_URL: import.meta.env.VITE_RPC_URL as string,
    };
  }

  // 使用硬编码的预设配置（推荐）
  // 默认返回 BSC 主网配置
  // 实际使用时，useChainConfig Hook 会根据钱包连接的链 ID 自动切换
  return BSC_MAINNET_CONFIG;
};

/**
 * 根据当前连接的钱包链ID获取配置
 * @param walletChainId 钱包当前连接的链ID
 * @returns 合约地址配置，如果不支持该链则返回 null
 */
export const getConfigByWalletChain = (
  walletChainId: number,
): ChainContractAddresses | null => {
  return getChainConfig(walletChainId);
};

export default {
  getChainConfig,
  getCurrentChainConfig,
  getConfigByWalletChain,
  CHAIN_CONFIGS,
};
