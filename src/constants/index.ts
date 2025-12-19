import MiningMachineSystemStorageABI from "./MiningMachineSystemStorage";
import MiningMachineSystemLogicABI from "./MiningMachineSystemLogic";
import MiningMachineProductionLogicABI from "./MiningMachineProductionLogic";
import MiningMachineHistoryABI from "./MiningMachineHistory";
import MiningMachineNodeSystemABI from "./MiningMachineNodeSystem";
import SelluserManagerABI from "./user";
import MiningMachineSystemStorageExtendABI from "./MiningMachineSystemStorageExtend";
import MiningMachineSystemLogicExtendABI from "./MiningMachineSystemLogicExtend";
import MiningMachineHistoryExtendABI from "./MiningMachineHistoryExtend";
import { getCurrentChainConfig, getConfigByWalletChain } from "./chainConfig";

// 多链配置系统
//
// 工作原理：
// 1. 默认使用硬编码配置（chainConfig.ts 中的 BSC_MAINNET_CONFIG）
// 2. 用户连接钱包时，useChainConfig() Hook 会根据钱包的链 ID 自动切换配置
// 3. 支持的链：BSC 主网 (56)、BSC 测试网 (97)、本地 Anvil (31337)
//
// 一次部署，多链支持！
// 用户切换钱包链时，应用会自动加载对应的合约地址
//
// 注意：如果设置了环境变量（VITE_STORAGE_ADDRESS 等），会覆盖所有链的配置，
//      导致失去多链支持功能。建议不设置环境变量，使用硬编码配置。

const currentConfig = getCurrentChainConfig();

const IDX_CONTRACTS_ADDRESS = currentConfig.IDX_TOKEN;
const USDT_CONTRACTS_ADDRESS = currentConfig.USDT_TOKEN;
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);

const StorageAddress = currentConfig.STORAGE_ADDRESS;
const LogicAddress = currentConfig.LOGIC_ADDRESS;
const ProductionLogicAddress = currentConfig.PRODUCTION_LOGIC_ADDRESS;
const HistoryAddress = currentConfig.HISTORY_ADDRESS;
const NodeSystemAddress = currentConfig.NODE_SYSTEM_ADDRESS;

const ExtendStorageAddress = currentConfig.EXTEND_STORAGE_ADDRESS;
const ExtendLogicAddress = currentConfig.EXTEND_LOGIC_ADDRESS;
const ExtendHistoryAddress = currentConfig.EXTEND_HISTORY_ADDRESS;
const SelluserManagerAddress = currentConfig.SELLUSER_MANAGER_ADDRESS;

const ALLOWANCE_QUOTA = currentConfig.ALLOWANCE_QUOTA;

export {
  StorageAddress as MiningMachineSystemStorageAddress,
  LogicAddress as MiningMachineSystemLogicAddress,
  ProductionLogicAddress as MiningMachineProductionLogicAddress,
  HistoryAddress as MiningMachineHistoryAddress,
  NodeSystemAddress as MiningMachineNodeSystemAddress,
  SelluserManagerAddress as MiningMachineSelluserManagerAddress,
  ExtendStorageAddress as MiningMachineSystemStorageExtendAddress,
  ExtendLogicAddress as MiningMachineSystemLogicExtendAddress,
  ExtendHistoryAddress as MiningMachineHistoryExtendAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemLogicABI,
  MiningMachineProductionLogicABI,
  MiningMachineHistoryABI,
  MiningMachineNodeSystemABI,
  SelluserManagerABI,
  MiningMachineSystemStorageExtendABI,
  MiningMachineSystemLogicExtendABI,
  MiningMachineHistoryExtendABI,
  IDX_CONTRACTS_ADDRESS,
  USDT_CONTRACTS_ADDRESS,
  CHAIN_ID,
  ALLOWANCE_QUOTA,
  // 导出配置函数，供需要动态切换链的组件使用
  getConfigByWalletChain,
};
