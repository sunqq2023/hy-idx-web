/**
 * 多链合约地址配置
 * 根据不同的链ID和RPC URL返回对应的合约地址
 *
 * 支持四种配置：
 * 1. 主网 (BSC Mainnet) - Chain ID: 56, RPC: 主网节点
 * 2. 测试网 (BSC Testnet) - Chain ID: 97
 * 3. Anvil Fork - Chain ID: 56, RPC: 本地 (127.0.0.1 或 localhost)
 * 4. Anvil Local - Chain ID: 31337 或 1337
 */

/**
 * MIX API Key
 * 从环境变量读取，用于 API 请求认证
 */
export const MIX_API_KEY = "5rLeqyHtwwMzZ1CD4YlXBg/qSfKDbrpDCNkAvS186F4=";

import MiningMachineSystemStorageABI from "./MiningMachineSystemStorage";
import MiningMachineSystemLogicABI from "./MiningMachineSystemLogic";
import MiningMachineProductionLogicABI from "./MiningMachineProductionLogic";
import MiningMachineHistoryABI from "./MiningMachineHistory";
import MiningMachineNodeSystemABI from "./MiningMachineNodeSystem";
import SelluserManagerABI from "./user";
import MiningMachineSystemStorageExtendABI from "./MiningMachineSystemStorageExtend";
import MiningMachineSystemLogicExtendABI from "./MiningMachineSystemLogicExtend";
import MiningMachineHistoryExtendABI from "./MiningMachineHistoryExtend";

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
  BIND_ADDRESS_URL?: string;
}

// ==================== 四种配置 ====================

// 1. BSC 主网配置 (Chain ID: 56, 主网 RPC)
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
  // 主网合约未升级，绑定服务暂不可用
  BIND_ADDRESS_URL: "",
};

// 2. BSC 测试网配置 (Chain ID: 97)
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
  BIND_ADDRESS_URL: "https://www.ihealth.vip/api",
};

// 3. Anvil Fork 配置 (Chain ID: 56, 但 RPC 是本地)
// 使用主网合约地址，因为 fork 的是主网
const ANVIL_FORK_CONFIG: ChainContractAddresses = {
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
  BIND_ADDRESS_URL: "http://127.0.0.1:8090",
};

// 4. Anvil Local 配置 (Chain ID: 31337 或 1337)
// 使用本地部署的合约地址
const ANVIL_LOCAL_CONFIG: ChainContractAddresses = {
  IDX_TOKEN:
    import.meta.env.VITE_IDX_TOKEN ||
    "0xc98F60B3F98E8Bf860436746db637e13B0e17458",
  USDT_TOKEN:
    import.meta.env.VITE_USDT_TOKEN ||
    "0x55d398326f99059fF775485246999027B3197955",
  STORAGE_ADDRESS:
    import.meta.env.VITE_STORAGE_ADDRESS ||
    "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  LOGIC_ADDRESS:
    import.meta.env.VITE_LOGIC_ADDRESS ||
    "0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD",
  PRODUCTION_LOGIC_ADDRESS:
    import.meta.env.VITE_PRODUCTION_LOGIC_ADDRESS ||
    "0x90531429c182707190de682Ed345e3577D44C3d6",
  HISTORY_ADDRESS:
    import.meta.env.VITE_HISTORY_ADDRESS ||
    "0x367f5FaE08dC307B3Ac8A9A7AA26AC3005C6B51f",
  NODE_SYSTEM_ADDRESS:
    import.meta.env.VITE_NODE_SYSTEM_ADDRESS ||
    "0xf080f93067F52843231B13fF5024D41767898Bc8",
  EXTEND_STORAGE_ADDRESS:
    import.meta.env.VITE_EXTEND_STORAGE_ADDRESS ||
    "0xdc567714763206341aC1d90C0d2fc58c57739412",
  EXTEND_LOGIC_ADDRESS:
    import.meta.env.VITE_EXTEND_LOGIC_ADDRESS ||
    "0xFA5eA849E045520996725d13C3160D1D5420078e",
  EXTEND_HISTORY_ADDRESS:
    import.meta.env.VITE_EXTEND_HISTORY_ADDRESS ||
    "0x6e426AFED0cF32d6E00b29c791199441658E4f73",
  SELLUSER_MANAGER_ADDRESS:
    import.meta.env.VITE_SELLUSER_MANAGER_ADDRESS ||
    "0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe",
  ALLOWANCE_QUOTA: import.meta.env.VITE_ALLOWANCE_QUOTA || "10000000",
  RPC_URL: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
  BIND_ADDRESS_URL: import.meta.env.VITE_BIND_ADDRESS_URL || "http://127.0.0.1:8090",
};

// ==================== 判断逻辑 ====================

/**
 * 检查 RPC URL 是否是本地地址
 */
const isLocalRpcUrl = (rpcUrl?: string): boolean => {
  if (!rpcUrl) {
    // 如果没有提供 RPC URL，检查环境变量
    const envRpcUrl = import.meta.env.VITE_RPC_URL as string;
    if (envRpcUrl) {
      return (
        envRpcUrl.includes("127.0.0.1") ||
        envRpcUrl.includes("localhost") ||
        envRpcUrl.includes("0.0.0.0")
      );
    }
    return false;
  }
  return (
    rpcUrl.includes("127.0.0.1") ||
    rpcUrl.includes("localhost") ||
    rpcUrl.includes("0.0.0.0")
  );
};

/**
 * 根据链ID和RPC URL获取合约配置
 * 判断逻辑：
 * 1. 首先判断 Chain ID
 *    - 97: 测试网
 *    - 31337 或 1337: Anvil Local
 *    - 56: 需要进一步判断 RPC URL
 * 2. 如果 Chain ID 是 56，判断 RPC URL
 *    - 本地地址 (127.0.0.1/localhost): Anvil Fork
 *    - 其他: 主网
 *
 * @param chainId 链ID
 * @param rpcUrl 可选的 RPC URL（用于区分主网和 Anvil Fork）
 * @returns 合约地址配置
 */
export const getChainConfig = (
  chainId: number,
  rpcUrl?: string
): ChainContractAddresses | null => {
  // 1. 测试网：Chain ID 97
  if (chainId === 97) {
    console.log("✅ Using BSC Testnet configuration (Chain ID: 97)");
    return BSC_TESTNET_CONFIG;
  }

  // 2. Anvil Local：Chain ID 31337 或 1337
  if (chainId === 31337 || chainId === 1337) {
    console.log(`🔧 Using Anvil Local configuration (Chain ID: ${chainId})`);
    return ANVIL_LOCAL_CONFIG;
  }

  // 3. Chain ID 56：需要判断是主网还是 Anvil Fork
  if (chainId === 56) {
    if (isLocalRpcUrl(rpcUrl)) {
      console.log(
        "🔧 Using Anvil Fork configuration (Chain ID: 56, Local RPC)"
      );
      return ANVIL_FORK_CONFIG;
    } else {
      console.log(
        "✅ Using BSC Mainnet configuration (Chain ID: 56, Mainnet RPC)"
      );
      return BSC_MAINNET_CONFIG;
    }
  }

  // 4. 未知 Chain ID，尝试通过 RPC URL 判断
  if (isLocalRpcUrl(rpcUrl)) {
    console.log(
      `🔧 Using Anvil configuration (detected by local RPC URL, Chain ID: ${chainId})`
    );
    // 如果是本地 RPC，优先使用 Anvil Local 配置（可能部署了新合约）
    // 如果 Chain ID 是 56，则使用 Fork 配置
    return chainId === 56 ? ANVIL_FORK_CONFIG : ANVIL_LOCAL_CONFIG;
  }

  console.warn(`⚠️ Unknown Chain ID: ${chainId}, no configuration found`);
  return null;
};

/**
 * 根据当前连接的钱包链ID获取配置
 * @param walletChainId 钱包当前连接的链ID
 * @param rpcUrl 可选的 RPC URL（用于区分主网和 Anvil Fork）
 * @returns 合约地址配置，如果不支持该链则返回 null
 */
export const getConfigByWalletChain = (
  walletChainId: number,
  rpcUrl?: string
): ChainContractAddresses | null => {
  return getChainConfig(walletChainId, rpcUrl);
};

// ==================== 导出配置对象（供参考） ====================

export const CHAIN_CONFIGS = {
  MAINNET: BSC_MAINNET_CONFIG,
  TESTNET: BSC_TESTNET_CONFIG,
  ANVIL_FORK: ANVIL_FORK_CONFIG,
  ANVIL_LOCAL: ANVIL_LOCAL_CONFIG,
} as const;

// 导出配置常量（供需要直接访问配置的地方使用）
export {
  BSC_MAINNET_CONFIG,
  BSC_TESTNET_CONFIG,
  ANVIL_FORK_CONFIG,
  ANVIL_LOCAL_CONFIG,
};

// ==================== 向后兼容的静态导出 ====================

const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 56;

// ⚠️ 以下导出的地址是静态的，仅用于向后兼容
// 新代码应该使用 useChainConfig() Hook 获取动态地址
// 默认使用 BSC 主网配置（钱包未连接时的默认值）
const currentConfig = BSC_MAINNET_CONFIG;

const StorageAddress = currentConfig.STORAGE_ADDRESS;
const LogicAddress = currentConfig.LOGIC_ADDRESS;
const ProductionLogicAddress = currentConfig.PRODUCTION_LOGIC_ADDRESS;
const HistoryAddress = currentConfig.HISTORY_ADDRESS;
const NodeSystemAddress = currentConfig.NODE_SYSTEM_ADDRESS;

const ExtendStorageAddress = currentConfig.EXTEND_STORAGE_ADDRESS;
const ExtendLogicAddress = currentConfig.EXTEND_LOGIC_ADDRESS;
const ExtendHistoryAddress = currentConfig.EXTEND_HISTORY_ADDRESS;
const SelluserManagerAddress = currentConfig.SELLUSER_MANAGER_ADDRESS;

const IDX_CONTRACTS_ADDRESS = currentConfig.IDX_TOKEN;
const USDT_CONTRACTS_ADDRESS = currentConfig.USDT_TOKEN;
const ALLOWANCE_QUOTA = currentConfig.ALLOWANCE_QUOTA;

// ==================== 导出 ====================

export {
  // ABIs (这些不会变)
  MiningMachineSystemStorageABI,
  MiningMachineSystemLogicABI,
  MiningMachineProductionLogicABI,
  MiningMachineHistoryABI,
  MiningMachineNodeSystemABI,
  SelluserManagerABI,
  MiningMachineSystemStorageExtendABI,
  MiningMachineSystemLogicExtendABI,
  MiningMachineHistoryExtendABI,
  // 静态地址（向后兼容，但不推荐使用）
  StorageAddress as MiningMachineSystemStorageAddress,
  LogicAddress as MiningMachineSystemLogicAddress,
  ProductionLogicAddress as MiningMachineProductionLogicAddress,
  HistoryAddress as MiningMachineHistoryAddress,
  NodeSystemAddress as MiningMachineNodeSystemAddress,
  SelluserManagerAddress as MiningMachineSelluserManagerAddress,
  ExtendStorageAddress as MiningMachineSystemStorageExtendAddress,
  ExtendLogicAddress as MiningMachineSystemLogicExtendAddress,
  ExtendHistoryAddress as MiningMachineHistoryExtendAddress,
  IDX_CONTRACTS_ADDRESS,
  USDT_CONTRACTS_ADDRESS,
  CHAIN_ID,
  ALLOWANCE_QUOTA,
};

export default {
  getChainConfig,
  getConfigByWalletChain,
  CHAIN_CONFIGS,
};
