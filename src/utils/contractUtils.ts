import { writeContract, WriteContractParameters } from '@wagmi/core'
import config from '@/proviers/config'
import { parseGwei } from 'viem'

// Gas配置映射 - 网络拥堵时设置
const GAS_CONFIG_MAP: Record<string, any> = {
  approve: {
    gas: 350000n,  // 网络拥堵时，approve 需要更多 Gas
    maxFeePerGas: parseGwei('30'),  // 提高 Gas 价格
    maxPriorityFeePerGas: parseGwei('5')  // 提高优先费用
  },
  claimRewards: {
    gas: 400000n,  // 提现功能需要更多 Gas
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('5')
  },
  addFriend: {
    gas: 300000n,  // 添加推荐人
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('5')
  },
  addStudio: {
    gas: 350000n,  // 添加工作室
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('5')
  },
  claimActivatedMachineRewards: {
    gas: 400000n,  // 领取激活奖励
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('5')
  },
  buyMachine: {
    gas: 500000n,  // 购买矿机，最复杂的操作
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('5')
  }
}

// 获取Gas配置
export function getGasConfigByFunctionName(functionName: string) {
  return GAS_CONFIG_MAP[functionName] || {
    gas: 300000n,  // 默认值也提高到网络拥堵时设置
    maxFeePerGas: parseGwei('30'),
    maxPriorityFeePerGas: parseGwei('5')
  }
}

// 带Gas回退的合约写入函数
export async function writeContractWithGasFallback(
  params: WriteContractParameters,
  gasConfig?: any
): Promise<`0x${string}`> {
  try {
    // 首先尝试自动Gas估算
    console.log('尝试自动Gas估算...')
    const hash = await writeContract(config, params)
    console.log('交易已发送，哈希:', hash)
    return hash
  } catch (error: any) {
    // 如果Gas估算失败，使用回退方案
    if (error.message?.includes('gasLimit') || 
        error.message?.includes('null') || 
        error.message?.includes('Transaction does not have a transaction hash')) {
      console.warn('Gas估算失败，使用回退方案:', error.message)
      
      const fallbackParams = {
        ...params,
        ...gasConfig
      }
      
      const hash = await writeContract(config, fallbackParams)
      console.log('交易已发送（回退方案），哈希:', hash)
      return hash
    } else {
      // 其他错误正常抛出
      throw error
    }
  }
}
