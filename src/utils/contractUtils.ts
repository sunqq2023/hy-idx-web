import { writeContract, WriteContractParameters } from "@wagmi/core";
import config from "@/proviers/config";

/**
 * Gas Limit 配置映射
 *
 * 为什么需要手动设置 Gas Limit？
 * 1. BSC 网络的 gas 估算有时不准确，特别是复杂操作
 * 2. 某些操作（如 addFriend）需要追溯多层关系，自动估算可能不足
 * 3. Gas Limit 只是上限，实际消耗会退还，设置稍高不会浪费
 *
 * 为什么不设置 Gas Price？
 * 1. Gas Price 应该由钱包根据网络状况实时估算
 * 2. 用户可以在钱包中根据需求调整 Gas Price
 * 3. 网络不拥堵时自动使用较低价格，节省费用
 */
const GAS_LIMIT_MAP: Record<string, bigint> = {
  // 用户操作
  approve: 350000n, // 授权操作 - ERC20 approve（实际 ~65k，余量 5.4x）
  claimRewards: 400000n, // 提现功能 - 涉及多个状态更新（实际 ~150k，余量 2.7x）
  addFriend: 1000000n, // 添加推荐人 - 需要追溯15层推荐关系（实际 ~500k，余量 2x）⚠️ 已提高
  addStudio: 100000n, // 标记工作室 - 简单的存储操作（实际 ~50k，余量 2x）
  claimActivatedMachineRewards: 400000n, // 领取激活奖励（实际 ~180k，余量 2.2x）
  buyMachine: 500000n, // 购买矿机 - 最复杂的操作（实际 ~250k，余量 2x）

  // 矿机操作
  activateMachine: 400000n, // 激活单台矿机（实际 ~180k，余量 2.2x）⚠️ 新增
  deactivateMachine: 400000n, // 关停矿机（实际 ~125k-290k，余量 1.4x-3.2x，从 250k 提高到 400k 确保安全）⚠️ 已提高
  addFuel: 400000n, // 添加燃料（实际 ~200k，余量 2x）⚠️ 新增
  convertMIXtoIDX: 600000n, // 兑换 IDX（实际 ~280k，余量 2.1x）⚠️ 新增
  claimReleasedIdx: 350000n, // 提取释放的 IDX（实际 ~150k，余量 2.3x）⚠️ 新增
  claimMixReward: 350000n, // 领取 MIX 奖励（实际 ~180k，余量 1.9x）⚠️ 新增
  createNode: 450000n, // 创建节点（实际 ~220k，余量 2x）⚠️ 新增
  cancelOrder: 200000n, // 取消订单（实际 ~100k，余量 2x）⚠️ 新增
  sellToPlatform: 250000n, // 卖给平台（实际 ~120k，余量 2.1x）⚠️ 新增
  cancelListedMachine: 200000n, // 取消挂售（实际 ~100k，余量 2x）⚠️ 新增
  airdrop: 400000n, // 空投（实际 ~180k，余量 2.2x）⚠️ 新增
  listChildMachine: 300000n, // 挂售子矿机（实际 ~150k，余量 2x）⚠️ 新增
  buyListedChildMachine: 500000n, // 购买挂售的子矿机（实际 ~250k，余量 2x）⚠️ 新增
  createInternalOrder: 300000n, // 创建内部订单（实际 ~150k，余量 2x）⚠️ 新增
  synthesizeMachine: 400000n, // 合成矿机（实际 ~200k，余量 2x）⚠️ 新增
  boundUserPhone: 150000n, // 绑定手机号（实际 ~80k，余量 1.9x）⚠️ 新增

  // 管理员操作 - 简单配置
  setSadmin: 400000n, // 设置管理员（实际 ~85k，余量 4.7x）
  setPlatformWallet: 400000n, // 设置平台钱包（实际 ~85k，余量 4.7x）
  setPromotionPowerLimit: 400000n, // 设置推广算力限制（实际 ~90k，余量 4.4x）
  setActivatedPowerLimit: 400000n, // 设置激活算力限制（实际 ~90k，余量 4.4x）
  addMixForOperator: 400000n, // 为运营商添加 MIX（实际 ~100k，余量 4x）
  subMixForOperator: 400000n, // 为运营商减少 MIX（实际 ~100k，余量 4x）
  transferMix: 400000n, // 转移 MIX（实际 ~120k，余量 3.3x）
  setNodesAmount: 400000n, // 设置节点数量（实际 ~85k，余量 4.7x）
  withdrawToken: 400000n, // 提取代币（实际 ~100k，余量 4x）
  setSwap: 400000n, // 设置兑换比例（实际 ~90k，余量 4.4x）
  setCommissionWallet: 400000n, // 设置手续费钱包（实际 ~85k，余量 4.7x）
  sadminMintChildMachines: 400000n, // 铸造子矿机（实际 ~150k，余量 2.7x）
  setSelluser: 400000n, // 设置挂售用户（实际 ~90k，余量 4.4x）
  addAirdropper: 400000n, // 添加空投者（实际 ~90k，余量 4.4x）
  addmachineTransfer: 400000n, // 添加矿机转移权限（实际 ~90k，余量 4.4x）
  addStudioMarker: 400000n, // 添加工作室标记（实际 ~90k，余量 4.4x）
  transferIDX: 400000n, // 转移 IDX（实际 ~65k，余量 6.2x）
  withdrawIDX: 400000n, // 提取 IDX（实际 ~100k，余量 4x）
  setContractAddress: 400000n, // 设置合约地址（实际 ~85k，余量 4.7x）

  // 管理员操作 - 复杂配置（涉及多个参数或状态）
  setChildMachineTradeConfig: 600000n, // 设置子矿机交易配置（实际 ~200k，余量 3x）
  setMotherMachineConfig: 600000n, // 设置母矿机配置（实际 ~250k，余量 2.4x）
  setWithdrawalConfig: 600000n, // 设置提现配置（实际 ~220k，余量 2.7x）
};

/**
 * 获取 Gas Limit 配置
 *
 * @param functionName - 合约函数名
 * @returns Gas 配置对象，只包含 gas limit，不包含 gas price
 *
 * 注意：返回的配置只设置 gas limit，不设置 gas price
 * Gas price 由 wagmi/钱包自动估算，确保最优价格
 */
export function getGasConfigByFunctionName(functionName: string) {
  return {
    gas: GAS_LIMIT_MAP[functionName] || 300000n, // 默认 300000，适用于大多数简单操作
    // 不设置 maxFeePerGas 和 maxPriorityFeePerGas
    // 让钱包根据当前网络状况自动估算最优 gas price
  };
}

/**
 * 带 Gas 回退的合约写入函数
 *
 * 这个函数提供了一个安全的合约调用机制：
 * 1. 首先尝试让 wagmi 自动估算所有参数（包括 gas limit 和 gas price）
 * 2. 如果自动估算失败，使用提供的 gasConfig 作为回退方案
 *
 * @param params - 合约调用参数
 * @param gasConfig - Gas 配置（可选），用作回退方案
 * @returns 交易哈希
 *
 * 使用场景：
 * - 复杂操作可能需要手动指定 gas limit
 * - BSC 网络的 gas 估算有时不准确
 * - 提供更好的用户体验（避免因 gas 估算失败而交易失败）
 */
export async function writeContractWithGasFallback(
  params: WriteContractParameters,
  gasConfig?: any,
): Promise<`0x${string}`> {
  try {
    // 首先尝试自动Gas估算
    console.log("尝试自动Gas估算...");
    const hash = await writeContract(config, params);
    console.log("交易已发送，哈希:", hash);
    return hash;
  } catch (error: any) {
    // 如果Gas估算失败，使用回退方案
    if (
      error.message?.includes("gasLimit") ||
      error.message?.includes("null") ||
      error.message?.includes("Transaction does not have a transaction hash")
    ) {
      console.warn("Gas估算失败，使用回退方案:", error.message);

      const fallbackParams = {
        ...params,
        ...gasConfig,
      };

      const hash = await writeContract(config, fallbackParams);
      console.log("交易已发送（回退方案），哈希:", hash);
      return hash;
    } else {
      // 其他错误正常抛出
      throw error;
    }
  }
}
