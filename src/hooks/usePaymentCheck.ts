import { useAccount, useBalance, useReadContract } from 'wagmi'
import { useMemo } from 'react'
import { erc20Abi } from 'viem'
import {
  IDX_CONTRACTS_ADDRESS,
  MiningMachineSystemLogicAddress
} from '@/constants'

type PaymentCheckResult = {
  isLoading: boolean
  isBalanceSufficient: boolean
  isAllowanceSufficient: boolean
  balance: bigint
  allowance: bigint
  balanceShortfall: bigint
  allowanceShortfall: bigint
  error?: Error | null // 修改这里，允许 null
}

export function usePaymentCheck(paymentAmount: bigint): PaymentCheckResult {
  const { address } = useAccount()

  // 查询余额
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError
  } = useBalance({
    address,
    token: IDX_CONTRACTS_ADDRESS
  })

  // 查询授权
  const {
    data: allowanceData,
    isLoading: allowanceLoading,
    error: allowanceError
  } = useReadContract({
    address: IDX_CONTRACTS_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, MiningMachineSystemLogicAddress]
  })

  // 计算结果
  return useMemo(() => {
    // 加载状态
    if (balanceLoading || allowanceLoading || !address) {
      return {
        isLoading: true,
        isBalanceSufficient: false,
        isAllowanceSufficient: false, // 修正拼写错误 isAllowance -> isAllowance
        balance: 0n,
        allowance: 0n,
        balanceShortfall: paymentAmount,
        allowanceShortfall: paymentAmount,
        error: undefined
      }
    }

    // 错误状态
    const error = balanceError || allowanceError
    if (error) {
      return {
        isLoading: false,
        isBalanceSufficient: false,
        isAllowanceSufficient: false,
        balance: 0n,
        allowance: 0n,
        balanceShortfall: paymentAmount,
        allowanceShortfall: paymentAmount,
        error: error instanceof Error ? error : new Error(String(error)) // 确保是 Error 类型
      }
    }

    // 正常状态
    const balance = balanceData?.value ?? 0n
    const allowance = allowanceData ?? 0n

    return {
      isLoading: false,
      isBalanceSufficient: balance >= paymentAmount,
      isAllowanceSufficient: allowance >= paymentAmount,
      balance,
      allowance,
      balanceShortfall: balance >= paymentAmount ? 0n : paymentAmount - balance,
      allowanceShortfall:
        allowance >= paymentAmount ? 0n : paymentAmount - allowance,
      error: undefined
    }
  }, [
    balanceData,
    allowanceData,
    paymentAmount,
    balanceLoading,
    allowanceLoading,
    address,
    balanceError,
    allowanceError
  ])
}
