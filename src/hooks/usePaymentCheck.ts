import { useAccount, useBalance, useReadContract } from "wagmi";
import { useMemo } from "react";
import { erc20Abi } from "viem";

type PaymentCheckResult = {
  isLoading: boolean;
  isBalanceSufficient: boolean;
  isAllowanceSufficient: boolean;
  balance: bigint;
  allowance: bigint;
  balanceShortfall: bigint;
  allowanceShortfall: bigint;
  error?: Error | null;
};

interface PaymentCheckOptions {
  paymentAmount: bigint;
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
}

export function usePaymentCheck({
  paymentAmount,
  tokenAddress,
  spenderAddress,
}: PaymentCheckOptions): PaymentCheckResult {
  const { address } = useAccount();

  // 查询余额
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
  } = useBalance({
    address,
    token: tokenAddress,
  });

  // 查询授权
  const {
    data: allowanceData,
    isLoading: allowanceLoading,
    error: allowanceError,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, spenderAddress],
  });

  // 计算结果
  return useMemo(() => {
    // 加载状态
    if (balanceLoading || allowanceLoading || !address) {
      return {
        isLoading: true,
        isBalanceSufficient: false,
        isAllowanceSufficient: false,
        balance: 0n,
        allowance: 0n,
        balanceShortfall: paymentAmount,
        allowanceShortfall: paymentAmount,
        error: undefined,
      };
    }

    // 错误状态
    const error = balanceError || allowanceError;
    if (error) {
      return {
        isLoading: false,
        isBalanceSufficient: false,
        isAllowanceSufficient: false,
        balance: 0n,
        allowance: 0n,
        balanceShortfall: paymentAmount,
        allowanceShortfall: paymentAmount,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    // 正常状态
    const balance = balanceData?.value ?? 0n;
    const allowance = allowanceData ?? 0n;

    return {
      isLoading: false,
      isBalanceSufficient: balance >= paymentAmount,
      isAllowanceSufficient: allowance >= paymentAmount,
      balance,
      allowance,
      balanceShortfall: balance >= paymentAmount ? 0n : paymentAmount - balance,
      allowanceShortfall:
        allowance >= paymentAmount ? 0n : paymentAmount - allowance,
      error: undefined,
    };
  }, [
    balanceData,
    allowanceData,
    paymentAmount,
    balanceLoading,
    allowanceLoading,
    address,
    balanceError,
    allowanceError,
  ]);
}
