/**
 * 多链合约地址配置
 * 根据不同的链ID和RPC URL返回对应的合约地址
 *
 * 支持四种配置：
 * 1. 主网 (BSC Mainnet) - Chain ID: 56
 * 2. 测试网 (BSC Testnet) - Chain ID: 97
 * 3. Anvil Fork (BSC) - Chain ID: 1056 (自定义 Fork Chain ID)
 * 4. Anvil Local - Chain ID: 31337 或 1337
 */

import MiningMachineHistoryABI from "./MiningMachineHistory";
import MiningMachineHistoryExtendABI from "./MiningMachineHistoryExtend";
import { MiningMachineNodeSystemABI } from "./MiningMachineNodeSystem";
import MiningMachineProductionLogicABI from "./MiningMachineProductionLogic";
import MiningMachineSystemLogicABI from "./MiningMachineSystemLogic";
import MiningMachineSystemLogicExtendABI from "./MiningMachineSystemLogicExtend";
import MiningMachineSystemStorageABI from "./MiningMachineSystemStorage";
import MiningMachineSystemStorageExtendABI from "./MiningMachineSystemStorageExtend";
import { StockSystemLogicABI } from "./StockSystemLogic";
import { StockSystemStorageABI } from "./StockSystemStorage";
import SelluserManagerABI from "./user";

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

  // Mix Operator
  MIX_OPERATOR_ADDRESS: string;

  // Stock
  STOCK_STORAGE_ADDRESS: string;
  STOCK_LOGIC_ADDRESS: string;

  // App Configuration
  ALLOWANCE_QUOTA: string;
  RPC_URL?: string;
  BIND_ADDRESS_URL?: string;
}

// ==================== 四种配置 ====================

// 1. BSC 主网配置 (Chain ID: 56, 已升级 - 2025-01-15)
const BSC_MAINNET_CONFIG: ChainContractAddresses = {
  IDX_TOKEN: "0xc98F60B3F98E8Bf860436746db637e13B0e17458",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STORAGE_ADDRESS: "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  LOGIC_ADDRESS: "0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD",
  PRODUCTION_LOGIC_ADDRESS: "0x90531429c182707190de682Ed345e3577D44C3d6",
  HISTORY_ADDRESS: "0x367f5FaE08dC307B3Ac8A9A7AA26AC3005C6B51f",
  NODE_SYSTEM_ADDRESS: "0xe04b049185bC002209ACEeDd51F8799A7b2deA54",
  EXTEND_STORAGE_ADDRESS: "0xdc567714763206341aC1d90C0d2fc58c57739412",
  EXTEND_LOGIC_ADDRESS: "0x2bB0DaD447Db767dA7693DB9562A65CcdCD25948",
  EXTEND_HISTORY_ADDRESS: "0x6e426AFED0cF32d6E00b29c791199441658E4f73",
  SELLUSER_MANAGER_ADDRESS: "0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe",
  MIX_OPERATOR_ADDRESS: "0x1cea1dc56Be6ab13Ad590Ff367c3Af375DA98A7d",
  STOCK_STORAGE_ADDRESS: "0xC453A5189C7023E6119ACa59382f09Ea4334D1d4",
  STOCK_LOGIC_ADDRESS: "0x52c5B9c15bFbA0AE92537dd1F6E7fd5e0aB57385",
  ALLOWANCE_QUOTA: "10000000",
  RPC_URL: "https://bsc.publicnode.com",
  BIND_ADDRESS_URL: "https://store.ihealth.vip",
  // BIND_ADDRESS_URL: "http://192.168.1.173:20699",
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
  NODE_SYSTEM_ADDRESS: "0xc23c2986d80eb230af2b7fb4a79b77c728236898",
  EXTEND_STORAGE_ADDRESS: "0x065010AD76A285A0618fd45668c4973fEa363A14",
  EXTEND_LOGIC_ADDRESS: "0x353d3526b7627756902bBBb793d4A0Ac99B8Bc16",
  EXTEND_HISTORY_ADDRESS: "0xe58b6777fC1c39D3e5DaaAfF09261F6c528BB5AB",
  SELLUSER_MANAGER_ADDRESS: "0x09012C1a6955fD76603453011F058f8567d1cbA3",
  MIX_OPERATOR_ADDRESS: "0x1cea1dc56Be6ab13Ad590Ff367c3Af375DA98A7d",
  STOCK_STORAGE_ADDRESS: "0x1a5d659b9e7b3de9016dca0dc2dea79ea9a06bf1",
  STOCK_LOGIC_ADDRESS: "0x0d6b85e446edcab6f97b3a9349268914a9742e75",
  ALLOWANCE_QUOTA: "10000000",
  RPC_URL: "https://bsc-testnet.publicnode.com",
  BIND_ADDRESS_URL: "https://store.ihealth.vip",
  // BIND_ADDRESS_URL: "http://192.168.1.173:20699",
};

// 3. Anvil Fork 配置 (Chain ID: 1056)
// 使用主网合约地址，因为 fork 的是主网
// 使用 Chain ID 1056 避免与 BSC 主网 (56) 冲突
const ANVIL_FORK_CONFIG: ChainContractAddresses = {
  IDX_TOKEN: "0xc98F60B3F98E8Bf860436746db637e13B0e17458",
  USDT_TOKEN: "0x55d398326f99059fF775485246999027B3197955",
  STORAGE_ADDRESS: "0xB256459d072A52e668b8a86a7cbFf9C475Ec98c2",
  LOGIC_ADDRESS: "0x895e8B68D93b2cD5fF4F2bf22cCb3697235C7AfD",
  PRODUCTION_LOGIC_ADDRESS: "0x90531429c182707190de682Ed345e3577D44C3d6",
  HISTORY_ADDRESS: "0x367f5FaE08dC307B3Ac8A9A7AA26AC3005C6B51f",
  NODE_SYSTEM_ADDRESS: "0xe04b049185bC002209ACEeDd51F8799A7b2deA54",
  EXTEND_STORAGE_ADDRESS: "0xdc567714763206341aC1d90C0d2fc58c57739412",
  EXTEND_LOGIC_ADDRESS: "0x2bB0DaD447Db767dA7693DB9562A65CcdCD25948",
  EXTEND_HISTORY_ADDRESS: "0x6e426AFED0cF32d6E00b29c791199441658E4f73",
  SELLUSER_MANAGER_ADDRESS: "0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe",
  MIX_OPERATOR_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  STOCK_STORAGE_ADDRESS: "0xC453A5189C7023E6119ACa59382f09Ea4334D1d4",
  STOCK_LOGIC_ADDRESS: "0x52c5B9c15bFbA0AE92537dd1F6E7fd5e0aB57385",
  ALLOWANCE_QUOTA: "10000000",
  RPC_URL: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
  BIND_ADDRESS_URL: "https://store.ihealth.vip",
  // BIND_ADDRESS_URL: "http://192.168.1.173:20699",
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
  MIX_OPERATOR_ADDRESS:
    import.meta.env.VITE_MIX_OPERATOR_ADDRESS ||
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  STOCK_STORAGE_ADDRESS: "0xa3245fae3e3d7c92591c175d19c2fd7d1fe58677",
  STOCK_LOGIC_ADDRESS: "0xb90a7fdd69810f49cef8d58a1cf84d09829af0ce",
  ALLOWANCE_QUOTA: import.meta.env.VITE_ALLOWANCE_QUOTA || "10000000",
  RPC_URL: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
  BIND_ADDRESS_URL: "https://store.ihealth.vip",
  // BIND_ADDRESS_URL: "http://192.168.1.176:8090",
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
 *    - 1056: Anvil Fork
 *    - 31337 或 1337: Anvil Local
 *    - 56: 主网
 * 2. 如果 Chain ID 未知，尝试通过 RPC URL 判断
 *
 * @param chainId 链ID
 * @param rpcUrl 可选的 RPC URL（用于未知 Chain ID 的判断）
 * @returns 合约地址配置
 */
export const getChainConfig = (
  chainId: number,
  rpcUrl?: string,
): ChainContractAddresses | null => {
  // 1. 测试网：Chain ID 97
  if (chainId === 97) {
    console.log("✅ Using BSC Testnet configuration (Chain ID: 97)");
    return BSC_TESTNET_CONFIG;
  }

  // 2. Anvil Fork：Chain ID 1056
  if (chainId === 1056) {
    console.log("🔧 Using Anvil Fork configuration (Chain ID: 1056)");
    return ANVIL_FORK_CONFIG;
  }

  // 3. Anvil Local：Chain ID 31337 或 1337
  if (chainId === 31337 || chainId === 1337) {
    console.log(`🔧 Using Anvil Local configuration (Chain ID: ${chainId})`);
    return ANVIL_LOCAL_CONFIG;
  }

  // 4. Chain ID 56：只支持主网
  if (chainId === 56) {
    console.log("✅ Using BSC Mainnet configuration (Chain ID: 56)");
    return BSC_MAINNET_CONFIG;
  }

  // 5. 未知 Chain ID，尝试通过 RPC URL 判断
  if (isLocalRpcUrl(rpcUrl)) {
    console.log(
      `🔧 Using Anvil configuration (detected by local RPC URL, Chain ID: ${chainId})`,
    );
    // 如果是本地 RPC，优先使用 Anvil Local 配置（可能部署了新合约）
    // 如果 Chain ID 是 1056，则使用 Fork 配置
    if (chainId === 1056) return ANVIL_FORK_CONFIG;
    return ANVIL_LOCAL_CONFIG;
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
  rpcUrl?: string,
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
    ANVIL_FORK_CONFIG,
    ANVIL_LOCAL_CONFIG,
    BSC_MAINNET_CONFIG,
    BSC_TESTNET_CONFIG
};

    export {
        MiningMachineHistoryABI,
        MiningMachineHistoryExtendABI,
        MiningMachineNodeSystemABI,
        MiningMachineProductionLogicABI,
        MiningMachineSystemLogicABI,
        MiningMachineSystemLogicExtendABI,
        MiningMachineSystemStorageABI,
        MiningMachineSystemStorageExtendABI,
        SelluserManagerABI,
        StockSystemLogicABI,
        StockSystemStorageABI
    };

export default {
  getChainConfig,
  getConfigByWalletChain,
  CHAIN_CONFIGS,
};
