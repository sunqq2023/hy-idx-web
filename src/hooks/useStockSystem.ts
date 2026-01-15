import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState, useEffect } from "react";
import type {
  StockSystemConfig,
  UserStockInfo,
  ExchangePreview,
} from "../types/stock";

// 合约地址 - 部署后需要更新
const STOCK_LOGIC_ADDRESS = import.meta.env
  .VITE_STOCK_LOGIC_ADDRESS as `0x${string}`;
const STOCK_STORAGE_ADDRESS = import.meta.env
  .VITE_STOCK_STORAGE_ADDRESS as `0x${string}`;

// StockSystemLogic ABI (仅包含需要的函数)
const STOCK_LOGIC_ABI = [
  {
    name: "exchangeMixForStock",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "mixAmount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getUserStockBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getRemainingStock",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getTotalStockIssued",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getMaxStockSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getMixToStockRate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isExchangeEnabled",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "previewExchange",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "mixAmount", type: "uint256" }],
    outputs: [
      { name: "stockAmount", type: "uint256" },
      { name: "isValid", type: "bool" },
    ],
  },
  {
    name: "canUserExchange",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "mixAmount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * 股权系统 Hook
 */
export function useStockSystem() {
  const { address } = useAccount();
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // 查询系统配置
  const { data: maxStockSupply } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "getMaxStockSupply",
  });

  const { data: totalStockIssued } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "getTotalStockIssued",
  });

  const { data: mixToStockRate } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "getMixToStockRate",
  });

  const { data: exchangeEnabled } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "isExchangeEnabled",
  });

  const { data: remainingStock } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "getRemainingStock",
  });

  // 查询用户股权余额
  const { data: userStockBalance, refetch: refetchBalance } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "getUserStockBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 系统配置
  const config: StockSystemConfig = {
    maxStockSupply: maxStockSupply || 0n,
    totalStockIssued: totalStockIssued || 0n,
    mixToStockRate: mixToStockRate || 0n,
    exchangeEnabled: exchangeEnabled || false,
    remainingStock: remainingStock || 0n,
  };

  // 用户信息
  const userInfo: UserStockInfo = {
    stockBalance: userStockBalance || 0n,
    exchangeCount: 0, // 需要通过事件查询
    exchangeIds: [], // 不再使用
  };

  /**
   * 预览兑换
   */
  const previewExchange = async (
    mixAmount: bigint,
  ): Promise<ExchangePreview> => {
    if (!STOCK_LOGIC_ADDRESS) {
      return { stockAmount: 0n, isValid: false };
    }

    try {
      // 这里可以直接调用合约的 view 函数
      // 或者简单计算
      const rate = config.mixToStockRate;
      if (rate === 0n) return { stockAmount: 0n, isValid: false };

      const stockAmount = mixAmount / rate;
      const isValid =
        stockAmount > 0n &&
        stockAmount <= config.remainingStock &&
        config.exchangeEnabled;

      return { stockAmount, isValid };
    } catch (error) {
      console.error("Preview exchange error:", error);
      return { stockAmount: 0n, isValid: false };
    }
  };

  /**
   * 执行兑换
   */
  const exchangeMixForStock = async (mixAmount: bigint) => {
    if (!address) {
      throw new Error("请先连接钱包");
    }

    if (!STOCK_LOGIC_ADDRESS) {
      throw new Error("股权系统合约地址未配置");
    }

    writeContract({
      address: STOCK_LOGIC_ADDRESS,
      abi: STOCK_LOGIC_ABI,
      functionName: "exchangeMixForStock",
      args: [mixAmount],
    });
  };

  /**
   * 检查用户是否可以兑换
   */
  const { data: canExchange } = useReadContract({
    address: STOCK_LOGIC_ADDRESS,
    abi: STOCK_LOGIC_ABI,
    functionName: "canUserExchange",
    args: address && mixToStockRate ? [address, mixToStockRate] : undefined,
    query: {
      enabled: !!address && !!mixToStockRate,
    },
  });

  // 兑换成功后刷新余额
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
    }
  }, [isSuccess, refetchBalance]);

  return {
    // 系统配置
    config,

    // 用户信息
    userInfo,

    // 操作函数
    exchangeMixForStock,
    previewExchange,

    // 状态
    isPending,
    isConfirming,
    isSuccess,
    error: writeError,
    hash,

    // 其他
    canExchange: canExchange || false,
    isConfigured: !!STOCK_LOGIC_ADDRESS && !!STOCK_STORAGE_ADDRESS,
  };
}
