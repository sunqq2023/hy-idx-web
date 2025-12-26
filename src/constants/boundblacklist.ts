/**
 * 黑名单地址列表
 * 这些地址不允许绑定商城账号
 *
 * 注意：
 * 1. 地址会自动转换为小写进行比较
 * 2. 添加新地址时请确保格式正确（0x开头的以太坊地址）
 * 3. 可以添加注释说明为什么该地址被列入黑名单
 * 4. 合约地址从 constants/index.ts 中的 BSC_MAINNET_CONFIG 获取
 */

import { BSC_MAINNET_CONFIG } from "./index";

export const BOUND_BLACKLIST_ADDRESSES = [
  // 平台钱包地址
  "0x5cdd0bd68efbad927dd02e9cb354f4ec3b201476",

  // previous admin
  "0x8247bc1891c58b11677a199dc31e91f32758c462",

  // now admin
  "0x6ce34e9291374e11142c261996d048f56bfcae3c",

  // IDX_USDT Pair(PancakeSwap)
  "0xcc9a8c340d9c57e31b411dfdcc41e571f23b9bb8",

  // 从配置中获取合约地址（主网）
  BSC_MAINNET_CONFIG.IDX_TOKEN.toLowerCase(), // IDX 合约地址
  BSC_MAINNET_CONFIG.USDT_TOKEN.toLowerCase(), // USDT 合约地址
  BSC_MAINNET_CONFIG.HISTORY_ADDRESS.toLowerCase(), // 历史记录合约地址
  BSC_MAINNET_CONFIG.EXTEND_HISTORY_ADDRESS.toLowerCase(), // 扩展的历史合约地址
  BSC_MAINNET_CONFIG.NODE_SYSTEM_ADDRESS.toLowerCase(), // 节点合成合约地址
  BSC_MAINNET_CONFIG.PRODUCTION_LOGIC_ADDRESS.toLowerCase(), // 生产合约地址
  BSC_MAINNET_CONFIG.LOGIC_ADDRESS.toLowerCase(), // 逻辑合约地址
  BSC_MAINNET_CONFIG.EXTEND_LOGIC_ADDRESS.toLowerCase(), // 扩展的逻辑合约地址
  BSC_MAINNET_CONFIG.STORAGE_ADDRESS.toLowerCase(), // 数据存储合约地址
  BSC_MAINNET_CONFIG.EXTEND_STORAGE_ADDRESS.toLowerCase(), // 扩展的数据存储合约地址
  BSC_MAINNET_CONFIG.SELLUSER_MANAGER_ADDRESS.toLowerCase(), // 挂售合约
  BSC_MAINNET_CONFIG.MIX_OPERATOR_ADDRESS.toLowerCase(), // Mix Operator
];

/**
 * 检查地址是否在黑名单中
 * @param address 要检查的地址
 * @returns 如果在黑名单中返回 true，否则返回 false
 */
export const isAddressBlacklisted = (address: string): boolean => {
  return BOUND_BLACKLIST_ADDRESSES.map((addr) => addr.toLowerCase()).includes(
    address.toLowerCase(),
  );
};
