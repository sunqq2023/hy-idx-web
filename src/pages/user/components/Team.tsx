import { Button, Toast } from "antd-mobile";
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { useAccount } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import config from "@/proviers/config";
import { formatEther, parseEther, erc20Abi } from "viem";
import {
  MiningMachineSystemLogicExtendABI,
  MiningMachineSystemStorageExtendABI,
  MiningMachineHistoryExtendABI,
  CHAIN_ID,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import {
  writeContractWithGasFallback,
  getGasConfigByFunctionName,
} from "@/utils/contractUtils";

// 提现记录类型定义
interface WithdrawRecord {
  claimType: number; // 提现类型 (0=业绩提现)
  claimDate: number; // 提现日期
  claimAmount: string; // 提现金额 (格式化的字符串)
  tokenType: number; // 代币类型 (0=IDX)
}

// 算力记录类型定义
interface PowerRecord {
  getDate: number; // 获得算力日期
  getAmount: string; // 获得算力数量 (格式化的字符串)
  recordType: number; // 记录类型
}

// 合约返回的原始记录类型
interface RawWithdrawRecord {
  claimType: bigint;
  claimDate: bigint;
  claimAmount: bigint;
  tokenType: bigint;
}

interface RawPowerRecord {
  getDate: bigint;
  getAmount: bigint;
  recordType: bigint;
}

export const Team = () => {
  const { address: userAddress } = useAccount();
  const chainConfig = useChainConfig();

  // 使用动态地址，而不是静态导出的地址
  const MiningMachineSystemStorageExtendAddress =
    chainConfig.EXTEND_STORAGE_ADDRESS;
  const MiningMachineSystemLogicExtendAddress =
    chainConfig.EXTEND_LOGIC_ADDRESS;
  const MiningMachineHistoryExtendAddress = chainConfig.EXTEND_HISTORY_ADDRESS;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN;

  // 动态数据
  const [performanceCommission, setPerformanceCommission] = useState("0"); // 业绩提成
  const [teamCount, setTeamCount] = useState(0); // 团队人数
  const [introducerAddress, setIntroducerAddress] = useState<string | null>(
    null,
  ); // 推荐人地址
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isFillingReferrer, setIsFillingReferrer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 推荐人填写相关状态
  const [showReferrerForm, setShowReferrerForm] = useState(false);
  const [showReferrerConfirm, setShowReferrerConfirm] = useState(false);
  const [referrerInput, setReferrerInput] = useState("");
  const [isSubmittingReferrer, setIsSubmittingReferrer] = useState(false);
  const [referrerError, setReferrerError] = useState("");

  // 提现历史相关状态
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // 算力记录相关状态
  const [powerRecords, setPowerRecords] = useState<PowerRecord[]>([]);
  const [isLoadingPowerRecords, setIsLoadingPowerRecords] = useState(false);
  const [showPowerRecords, setShowPowerRecords] = useState(false);

  // 提现功能相关状态
  const [treasuryBalance, setTreasuryBalance] = useState("0"); // 国库IDX余额
  const [showWithdrawForm, setShowWithdrawForm] = useState(false); // 显示提现表单
  const [withdrawAmount, setWithdrawAmount] = useState(""); // 提现金额
  const [withdrawError, setWithdrawError] = useState(""); // 提现错误信息

  // 标记工作室相关状态
  const [showMarkStudioForm, setShowMarkStudioForm] = useState(false); // 显示标记工作室表单
  const [markStudioAddress, setMarkStudioAddress] = useState(""); // 要标记的地址
  const [isMarkingStudio, setIsMarkingStudio] = useState(false); // 标记工作室中状态
  const [markStudioError, setMarkStudioError] = useState(""); // 标记工作室错误信息

  // 空投/释放相关状态
  const [activatedMachineRewards, setActivatedMachineRewards] = useState("0"); // 已空投的值
  const [claimedActivatedMachineRewards, setClaimedActivatedMachineRewards] =
    useState("0"); // 已获得的释放奖励值
  const [withdrawableRewards, setWithdrawableRewards] = useState("0"); // 可提取的IDX值
  const [dailyReleaseRate, setDailyReleaseRate] = useState("0.1"); // 每天释放速率
  const [isLoadingAirdropData, setIsLoadingAirdropData] = useState(false); // 加载空投数据状态

  // 工作室相关状态
  const [isStudio, setIsStudio] = useState(false); // 是否为工作室
  const [canMarkStudio, setCanMarkStudio] = useState(false); // 是否可以标记工作室
  const [isLoadingStudioStatus, setIsLoadingStudioStatus] = useState(false); // 加载工作室状态

  // 检查工作室状态
  const checkStudioStatus = useCallback(async () => {
    if (!userAddress) return;

    try {
      setIsLoadingStudioStatus(true);

      // 检查是否为工作室
      const studioStatus = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "checkIfStudio",
        args: [userAddress],
      });

      // 检查是否为工作室标记者（有权限标记其他地址为工作室）
      const studioMarkerStatus = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "checkStudioMarker",
        args: [userAddress],
      });

      setIsStudio(studioStatus as boolean);
      setCanMarkStudio(studioMarkerStatus as boolean);
      console.log(
        "工作室状态:",
        studioStatus,
        "标记者状态:",
        studioMarkerStatus,
      );
    } catch (error) {
      console.error("检查工作室状态失败:", error);
    } finally {
      setIsLoadingStudioStatus(false);
    }
  }, [userAddress]);

  // 获取国库IDX余额
  const fetchTreasuryBalance = useCallback(async () => {
    try {
      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [MiningMachineSystemLogicExtendAddress as `0x${string}`],
      });

      const formattedBalance = formatEther(balance);
      setTreasuryBalance(formattedBalance);
      console.log("国库IDX余额:", formattedBalance);
    } catch (error) {
      console.error("获取奖励池余额失败:", error);
    }
  }, []);

  // 获取提现历史
  const fetchWithdrawRecords = useCallback(async () => {
    if (!userAddress) return;

    try {
      setIsLoadingRecords(true);

      const records = await readContract(config, {
        address: MiningMachineHistoryExtendAddress as `0x${string}`,
        abi: MiningMachineHistoryExtendABI,
        functionName: "getUserClaimRecords",
        args: [userAddress],
      });

      // 转换数据格式
      const formattedRecords = (records as unknown as RawWithdrawRecord[]).map(
        (record: RawWithdrawRecord, index: number) => {
          const formattedAmount = formatEther(record.claimAmount);
          console.log(`提现记录 ${index + 1}:`, {
            原始值: record.claimAmount.toString(),
            格式化后: formattedAmount,
            类型: typeof formattedAmount,
          });

          return {
            claimType: Number(record.claimType),
            claimDate: Number(record.claimDate),
            claimAmount: formattedAmount, // 保持为字符串，避免精度丢失
            tokenType: Number(record.tokenType),
          };
        },
      );

      // 按时间倒序排列
      formattedRecords.sort((a, b) => b.claimDate - a.claimDate);

      setWithdrawRecords(formattedRecords);
    } catch (error) {
      console.error("获取提现历史失败:", error);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [userAddress]);

  // 获取算力记录
  const fetchPowerRecords = useCallback(async () => {
    if (!userAddress) return;

    try {
      setIsLoadingPowerRecords(true);

      console.log("开始获取算力记录，用户地址:", userAddress);
      console.log("使用的合约地址:", MiningMachineHistoryExtendAddress);

      const records = await readContract(config, {
        address: MiningMachineHistoryExtendAddress as `0x${string}`,
        abi: MiningMachineHistoryExtendABI,
        functionName: "getUserGetPowerRecords",
        args: [userAddress],
      });

      console.log("原始算力记录数据:", records);

      // 转换数据格式
      const formattedRecords = (records as unknown as RawPowerRecord[]).map(
        (record: RawPowerRecord, index: number) => {
          // 算力值直接使用原始数值，不需要formatEther转换
          const formattedAmount = record.getAmount.toString();
          console.log(`算力记录 ${index + 1}:`, {
            原始值: record.getAmount.toString(),
            格式化后: formattedAmount,
            获得日期: new Date(Number(record.getDate) * 1000).toLocaleString(),
            记录类型: Number(record.recordType),
          });

          return {
            getDate: Number(record.getDate),
            getAmount: formattedAmount, // 保持为字符串，避免精度丢失
            recordType: Number(record.recordType),
          };
        },
      );

      // 按时间倒序排列
      formattedRecords.sort((a, b) => b.getDate - a.getDate);

      setPowerRecords(formattedRecords);
      console.log("格式化后的算力记录:", formattedRecords);
    } catch (error) {
      console.error("获取算力记录失败:", error);
      Toast.show({
        content: "获取算力记录失败",
        position: "center",
      });
    } finally {
      setIsLoadingPowerRecords(false);
    }
  }, [userAddress]);

  // 获取空投/释放数据
  const fetchAirdropData = useCallback(async () => {
    if (!userAddress) return;

    try {
      setIsLoadingAirdropData(true);

      console.log("开始获取空投数据，用户地址:", userAddress);
      console.log("使用的合约地址:", {
        ExtendStorageAddress: MiningMachineSystemStorageExtendAddress,
        ExtendLogicAddress: MiningMachineSystemLogicExtendAddress,
      });

      // 验证合约地址是否有效
      if (!MiningMachineSystemLogicExtendAddress || !MiningMachineSystemStorageExtendAddress) {
        console.error("合约地址未配置");
        Toast.show({
          content: "合约地址未配置，请检查网络配置",
          position: "center",
        });
        return;
      }

      // 获取已空投的值
      console.log("正在调用 getActivatedMachineRewards...");
      const activatedRewards = (await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "getActivatedMachineRewards",
        args: [userAddress],
      })) as bigint;
      console.log(
        "getActivatedMachineRewards 结果:",
        activatedRewards.toString(),
      );

      // 获取已获得的释放奖励值
      console.log("正在调用 getClaimedActivatedMachineRewards...");
      const claimedRewards = (await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "getClaimedActivatedMachineRewards",
        args: [userAddress],
      })) as bigint;
      console.log(
        "getClaimedActivatedMachineRewards 结果:",
        claimedRewards.toString(),
      );

      // 获取可提取的IDX值
      console.log("正在调用 calculateActivatedMachineRewards...");
      let withdrawable: bigint;
      try {
        withdrawable = (await readContract(config, {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "calculateActivatedMachineRewards",
          args: [userAddress],
        })) as bigint;
        console.log(
          "calculateActivatedMachineRewards 结果:",
          withdrawable.toString(),
        );
      } catch (error) {
        console.warn("calculateActivatedMachineRewards 调用失败，使用默认值 0:", error);
        // 如果函数调用失败（可能是合约未部署或函数不存在），使用默认值 0
        withdrawable = 0n;
      }

      // 获取每天释放速率
      console.log("正在调用 calculateRewardRate...");
      let rewardRate: bigint;
      try {
        rewardRate = (await readContract(config, {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "calculateRewardRate",
          args: [userAddress],
        })) as bigint;
        console.log("calculateRewardRate 结果:", rewardRate.toString());
      } catch (error) {
        console.warn("calculateRewardRate 调用失败，使用默认值 0:", error);
        // 如果函数调用失败，使用默认值 0
        rewardRate = 0n;
      }

      // 计算每天释放速率百分比 (除以 1e18)
      const rateInWei = BigInt(rewardRate.toString());
      const divisor = BigInt("1000000000000000000"); // 1e18

      console.log("=== 每天释放速率计算详情 ===");
      console.log("1. 合约返回的原始值 (rewardRate):", rewardRate.toString());
      console.log("2. 转换为 BigInt (rateInWei):", rateInWei.toString());
      console.log("3. 除数 (1e18):", divisor.toString());
      console.log(
        "4. 除法计算 (rateInWei / divisor):",
        Number(rateInWei) / Number(divisor),
      );
      console.log(
        "5. 转换为百分比 (× 100):",
        (Number(rateInWei) / Number(divisor)) * 100,
      );

      const ratePercentage = (Number(rateInWei) / Number(divisor)) * 100;
      const formattedRate = ratePercentage.toFixed(4);
      console.log("6. 格式化后 (保留4位小数):", formattedRate + "%");
      console.log("=== 计算完成 ===");

      setActivatedMachineRewards(formatEther(activatedRewards));
      setClaimedActivatedMachineRewards(formatEther(claimedRewards));
      setWithdrawableRewards(formatEther(withdrawable));
      setDailyReleaseRate(formattedRate);

      console.log("空投数据获取结果:", {
        activatedRewards: activatedRewards.toString(),
        claimedRewards: claimedRewards.toString(),
        withdrawable: withdrawable.toString(),
        rewardRate: rewardRate.toString(),
        formattedActivated: formatEther(activatedRewards),
        formattedClaimed: formatEther(claimedRewards),
        formattedWithdrawable: formatEther(withdrawable),
        dailyReleaseRate: formattedRate + "%",
      });
    } catch (error) {
      console.error("获取空投数据失败:", error);
      if (error instanceof Error) {
        console.error("错误详情:", {
          message: error.message,
          code: (error as { code?: unknown })?.code,
          data: (error as { data?: unknown })?.data,
        });
      }
    } finally {
      setIsLoadingAirdropData(false);
    }
  }, [userAddress]);

  // 递归计算团队总人数
  const calculateTotalTeamCount = useCallback(
    async (
      address: string,
      visited: Set<string> = new Set(),
    ): Promise<number> => {
      // 防止循环引用
      if (visited.has(address)) return 0;
      visited.add(address);

      try {
        // 获取直推好友列表
        const friendList = (await readContract(config, {
          address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
          abi: MiningMachineSystemStorageExtendABI,
          functionName: "getFriendList",
          args: [address],
        })) as string[];

        if (!friendList || friendList.length === 0) return 0;

        // 递归计算每个好友的团队人数
        let totalCount = friendList.length; // 直推好友数
        for (const friend of friendList) {
          const subTeamCount = await calculateTotalTeamCount(
            friend,
            new Set(visited),
          );
          totalCount += subTeamCount;
        }

        return totalCount;
      } catch (error) {
        console.error(`计算地址 ${address} 的团队人数失败:`, error);
        return 0;
      }
    },
    [],
  );

  // 获取团队数据
  const fetchTeamData = useCallback(async () => {
    if (!userAddress) return;

    try {
      setIsLoading(true);

      // 获取团队总人数（递归计算）
      const totalTeamCount = await calculateTotalTeamCount(userAddress);
      setTeamCount(totalTeamCount);

      // 获取可提现金额
      const claimableRewards = (await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "getUserClaimableRewards",
        args: [userAddress],
      })) as bigint;
      setPerformanceCommission(
        claimableRewards ? formatEther(claimableRewards) : "0",
      );

      // 获取推荐人地址
      const introducer = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "getIntroducer",
        args: [userAddress],
      });
      setIntroducerAddress(introducer as string);
    } catch (error) {
      console.error("获取团队数据失败:", error);
      Toast.show({
        content: "获取数据失败",
        position: "center",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, calculateTotalTeamCount]);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchTeamData();
    fetchWithdrawRecords();
    fetchTreasuryBalance();
    fetchAirdropData();
    checkStudioStatus();
  }, [
    fetchTeamData,
    fetchWithdrawRecords,
    fetchTreasuryBalance,
    fetchAirdropData,
    checkStudioStatus,
  ]);

  // 检查是否可以提现
  const canWithdraw =
    parseFloat(performanceCommission) > 0 &&
    parseFloat(treasuryBalance) >= parseFloat(performanceCommission);

  // 检查是否可以提取空投奖励
  const canWithdrawAirdrop =
    parseFloat(withdrawableRewards) > 0 &&
    parseFloat(treasuryBalance) >= parseFloat(withdrawableRewards);

  // 打开提现表单
  const handleWithdraw = () => {
    if (!canWithdraw) {
      Toast.show({
        content: "奖励池余额不足或无可提现金额",
        position: "center",
      });
      return;
    }
    setShowWithdrawForm(true);
    setWithdrawAmount("");
    setWithdrawError("");
  };

  // 提交提现
  const handleSubmitWithdraw = async () => {
    if (!withdrawAmount.trim()) {
      setWithdrawError("请输入提现金额");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const maxAmount = parseFloat(performanceCommission);
    const treasuryAmount = parseFloat(treasuryBalance);

    if (amount <= 0) {
      setWithdrawError("提现金额必须大于0");
      return;
    }

    if (amount > maxAmount) {
      setWithdrawError(`提现金额不能超过可提现余额 ${maxAmount}`);
      return;
    }

    if (amount > treasuryAmount) {
      setWithdrawError("奖励池余额不足");
      return;
    }

    try {
      setIsWithdrawing(true);
      setWithdrawError("");

      console.log("开始提现:", {
        提现金额: amount,
        可提现余额: maxAmount,
        奖励池余额: treasuryAmount,
      });

      const hash = await writeContractWithGasFallback(
        {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "claimRewards",
          args: [parseEther(withdrawAmount)],
        },
        getGasConfigByFunctionName("claimRewards"),
      );

      console.log("提现交易已发送，哈希:", hash);

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID,
      });

      console.log("提现交易已确认，区块号:", receipt.blockNumber);

      Toast.show({
        content: "提现成功",
        position: "center",
      });

      // 刷新数据
      fetchTeamData();
      fetchTreasuryBalance();
      fetchWithdrawRecords();

      setShowWithdrawForm(false);
      setWithdrawAmount("");
    } catch (error) {
      console.error("提现失败:", error);
      Toast.show({
        content: "提现失败，请重试",
        position: "center",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 取消提现
  const handleCancelWithdraw = () => {
    setShowWithdrawForm(false);
    setWithdrawAmount("");
    setWithdrawError("");
  };

  // 格式化推荐人地址显示
  const formatIntroducerAddress = (address: string) => {
    if (address.length < 8) return address;
    const start = address.slice(0, 4);
    const end = address.slice(-4);
    return `${start}....${end}`;
  };

  // 格式化时间显示
  const formatWithdrawTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${month}月${day}日 ${hours}:${minutes}:${seconds}`;
  };

  // 获取提现类型显示文本
  const getWithdrawTypeText = (claimType: number) => {
    switch (claimType) {
      case 0:
        return "业绩提现";
      case 1:
        return "空投提现";
      default:
        return "未知类型";
    }
  };

  // 获取提现类型图标
  const getWithdrawTypeIcon = (claimType: number) => {
    const isAirdropWithdraw = claimType === 1;
    const iconColor = isAirdropWithdraw ? "bg-[#895EFE]" : "bg-black";

    return (
      <div
        className={`w-10 h-10 ${iconColor} rounded-full flex items-center justify-center mr-4`}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </div>
    );
  };

  // 获取代币类型显示文本
  const getTokenTypeText = (tokenType: number) => {
    switch (tokenType) {
      case 0:
        return "IDX";
      default:
        return "未知代币";
    }
  };

  // 格式化提现金额显示
  const formatWithdrawAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (numAmount === 0) return "0";

    // 对于所有非零数值，都显示足够的小数位来展示实际值
    if (numAmount < 0.000001) {
      // 对于非常小的数值，显示更多小数位
      return numAmount.toFixed(12);
    }
    if (numAmount < 0.01) {
      // 对于小于0.01的数值，显示8位小数
      return numAmount.toFixed(8);
    }
    if (numAmount < 1) {
      // 对于小于1的数值，显示6位小数
      return numAmount.toFixed(6);
    }
    // 对于正常数值，显示2位小数
    return numAmount.toFixed(2);
  };

  // 格式化空投/释放数值显示（保留小数点后4位）
  const formatAirdropNumber = (amount: string) => {
    const numAmount = parseFloat(amount);
    return numAmount.toFixed(4);
  };

  // 格式化释放速率（保留2位小数）
  const formatReleaseRate = (rate: string) => {
    const numRate = parseFloat(rate);
    return numRate.toFixed(2);
  };

  // 打开推荐人填写表单
  const handleFillReferrer = () => {
    setShowReferrerForm(true);
  };

  // 提交推荐人地址
  const handleSubmitReferrer = () => {
    // 清除之前的错误信息
    setReferrerError("");

    if (!referrerInput.trim()) {
      setReferrerError("请输入推荐人地址");
      return;
    }

    // 地址长度验证
    if (referrerInput.length !== 42) {
      setReferrerError("地址长度不正确，请输入有效的钱包地址");
      return;
    }

    // 地址格式验证
    if (!referrerInput.startsWith("0x")) {
      setReferrerError("地址格式不正确，请输入有效的钱包地址");
      return;
    }

    // 不能自己推荐自己
    if (referrerInput.toLowerCase() === userAddress?.toLowerCase()) {
      setReferrerError("不能推荐自己作为推荐人");
      return;
    }

    setShowReferrerForm(false);
    setShowReferrerConfirm(true);
  };

  // 确认提交推荐人
  const handleConfirmReferrer = async () => {
    try {
      setIsSubmittingReferrer(true);

      const hash = await writeContractWithGasFallback(
        {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "addFriend",
          args: [referrerInput],
        },
        getGasConfigByFunctionName("addFriend"),
      );

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID,
      });

      Toast.show({
        content: "推荐人设置成功",
        position: "center",
      });

      // 关闭确认弹窗
      setShowReferrerConfirm(false);
      // 重置输入
      setReferrerInput("");

      // 刷新数据
      await fetchTeamData();
    } catch (error) {
      console.error("Add friend failed:", error);
      Toast.show({
        content: "设置推荐人失败",
        position: "center",
      });
    } finally {
      setIsSubmittingReferrer(false);
    }
  };

  // 取消推荐人设置
  const handleCancelReferrer = () => {
    setShowReferrerForm(false);
    setShowReferrerConfirm(false);
    setReferrerInput("");
    setReferrerError("");
  };

  // 打开标记工作室表单
  const handleOpenMarkStudio = () => {
    setShowMarkStudioForm(true);
    setMarkStudioAddress("");
    setMarkStudioError("");
  };

  // 提交标记工作室
  const handleSubmitMarkStudio = async () => {
    if (!markStudioAddress.trim()) {
      setMarkStudioError("请输入要标记的地址");
      return;
    }

    // 地址长度验证
    if (markStudioAddress.length !== 42) {
      setMarkStudioError("地址长度不正确，请输入有效的钱包地址");
      return;
    }

    // 地址格式验证
    if (!markStudioAddress.startsWith("0x")) {
      setMarkStudioError("地址格式不正确，请输入有效的钱包地址");
      return;
    }

    try {
      setIsMarkingStudio(true);
      setMarkStudioError("");

      const hash = await writeContractWithGasFallback(
        {
          address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
          abi: MiningMachineSystemStorageExtendABI,
          functionName: "addStudio",
          args: [markStudioAddress, true],
        },
        getGasConfigByFunctionName("addStudio"),
      );

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID,
      });

      Toast.show({
        content: "标记工作室成功",
        position: "center",
      });

      setShowMarkStudioForm(false);
      setMarkStudioAddress("");
    } catch (error) {
      console.error("标记工作室失败:", error);
      Toast.show({
        content: "标记工作室失败，请重试",
        position: "center",
      });
    } finally {
      setIsMarkingStudio(false);
    }
  };

  // 取消标记工作室
  const handleCancelMarkStudio = () => {
    setShowMarkStudioForm(false);
    setMarkStudioAddress("");
    setMarkStudioError("");
  };

  // 处理空投奖励提取
  const handleWithdrawAirdrop = async () => {
    if (!canWithdrawAirdrop) {
      if (parseFloat(withdrawableRewards) <= 0) {
        Toast.show({
          content: "无可提取的空投奖励",
          position: "center",
        });
      } else if (
        parseFloat(treasuryBalance) < parseFloat(withdrawableRewards)
      ) {
        Toast.show({
          content: "奖励池余额不足",
          position: "center",
        });
      }
      return;
    }

    try {
      setIsWithdrawing(true);

      // 调用ExtendLogicAddress的提取空投奖励函数
      const hash = await writeContractWithGasFallback(
        {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "claimActivatedMachineRewards",
          args: [],
        },
        getGasConfigByFunctionName("claimActivatedMachineRewards"),
      );

      await waitForTransactionReceipt(config, {
        hash,
        chainId: CHAIN_ID,
      });

      Toast.show({
        content: "空投奖励提取成功",
        position: "center",
      });

      // 刷新数据
      fetchAirdropData();
      fetchWithdrawRecords();
    } catch (error) {
      console.error("空投奖励提取失败:", error);
      Toast.show({
        content: "空投奖励提取失败，请重试",
        position: "center",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 处理点击每天释放速率问号
  const handleDailyReleaseRateClick = async () => {
    setShowPowerRecords(true);
    await fetchPowerRecords();
  };

  // 关闭算力记录弹窗
  const handleClosePowerRecords = () => {
    setShowPowerRecords(false);
  };

  // 格式化算力获得时间显示
  const formatPowerTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${month}月${day}日 ${hours}:${minutes}:${seconds}`;
  };

  // 格式化算力数量显示
  const formatPowerAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (numAmount === 0) return "0";

    // 对于所有非零数值，都显示足够的小数位来展示实际值
    if (numAmount < 0.000001) {
      // 对于非常小的数值，显示更多小数位
      return numAmount.toFixed(12);
    }
    if (numAmount < 0.01) {
      // 对于小于0.01的数值，显示8位小数
      return numAmount.toFixed(8);
    }
    if (numAmount < 1) {
      // 对于小于1的数值，显示6位小数
      return numAmount.toFixed(6);
    }
    // 对于正常数值，显示2位小数
    return numAmount.toFixed(2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-[21px]">
        {/* 上方深色区域卡片 */}
        <div className="bg-[#09090a] rounded-2xl text-white p-4 mt-2 relative">
          {/* 工作室标签 */}
          {isStudio && (
            <div className="absolute top-2 left-3">
              <div className="bg-[#895EFE] text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                工作室
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-4 relative">
            {/* 左侧：我的团队 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-[#c6c6c6] text-[12px] font-[400] mb-2">
                我的团队(个)
              </div>
              <div className="text-[#895EFE] font-bold text-[1.5rem] mb-3">
                {isLoading ? (
                  <div className="animate-pulse">加载中...</div>
                ) : (
                  teamCount
                )}
              </div>

              {/* 根据是否有推荐人显示不同内容 */}
              {introducerAddress &&
              introducerAddress !==
                "0x0000000000000000000000000000000000000000" ? (
                <div className="text-center">
                  <div className="text-[#c6c6c6] text-[10px] font-[400] mb-1">
                    推荐人
                  </div>
                  <div className="text-[#895EFE] text-[12px] font-medium">
                    {formatIntroducerAddress(introducerAddress)}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleFillReferrer}
                  loading={isFillingReferrer}
                  disabled={isLoading}
                  className="!bg-[#333] !text-white !rounded-3xl !py-1.5 !px-3 !text-xs !font-medium !border !border-[#555] disabled:!opacity-50"
                >
                  {isFillingReferrer ? "提交中..." : "填写推荐人"}
                </Button>
              )}
            </div>

            {/* 分割线 - 贯穿整个卡片高度 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-600 transform -translate-x-1/2"></div>

            {/* 右侧：团队业绩提成 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-[#c6c6c6] text-[12px] font-[400] mb-2">
                团队业绩提成(IDX)
              </div>
              <div className="text-[#895EFE] font-bold text-[1.5rem] mb-3">
                {isLoading ? (
                  <div className="animate-pulse">加载中...</div>
                ) : (
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={performanceCommission}
                    decimalSubLen={2}
                  />
                )}
              </div>
              <Button
                onClick={handleWithdraw}
                loading={isWithdrawing}
                disabled={isLoading || !canWithdraw}
                className="!bg-[#895EFE] !text-white !rounded-3xl !py-1.5 !px-3 !text-xs !font-medium disabled:!opacity-50"
              >
                {isWithdrawing
                  ? "提取中..."
                  : parseFloat(performanceCommission) > 0 &&
                      parseFloat(treasuryBalance) <
                        parseFloat(performanceCommission)
                    ? "奖励池不足"
                    : "提取到钱包"}
              </Button>
            </div>
          </div>
        </div>

        {/* 空投/释放信息卡片 */}
        <div className="mt-4">
          <div className="bg-white rounded-2xl p-4">
            {/* 顶部信息行和数值显示行区域 - 带分割线 */}
            <div className="relative">
              {/* 分割线 - 只在这两行区域中 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 transform -translate-x-1/2"></div>

              {/* 顶部信息行 */}
              <div className="flex items-center mb-3">
                <div className="flex-1 text-center text-black text-[12px] font-medium">
                  空投/释放(IDX)
                </div>
                <div
                  className="flex-1 text-center flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleDailyReleaseRateClick}
                >
                  <span className="text-black text-[12px] font-medium mr-1">
                    每天释放速率?
                  </span>
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* 数值显示行 */}
              <div className="flex items-center mb-4">
                <div className="flex-1 text-center text-gray-500 text-[12px]">
                  {isLoadingAirdropData ? (
                    <div className="animate-pulse">加载中...</div>
                  ) : (
                    `${formatAirdropNumber(
                      activatedMachineRewards,
                    )}/${formatAirdropNumber(claimedActivatedMachineRewards)}`
                  )}
                </div>
                <div className="flex-1 text-center text-[#895EFE] text-[12px] font-bold">
                  {isLoadingAirdropData ? (
                    <div className="animate-pulse">加载中...</div>
                  ) : (
                    `${formatReleaseRate(dailyReleaseRate)}%`
                  )}
                </div>
              </div>
            </div>

            {/* 可提取金额 */}
            <div className="text-center mb-4">
              <div className="text-[32px] font-bold text-black mb-1">
                {isLoadingAirdropData ? (
                  <div className="animate-pulse">加载中...</div>
                ) : (
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={withdrawableRewards}
                    decimalSubLen={2}
                  />
                )}
              </div>
              <div className="text-gray-500 text-[12px]">可提取(IDX)</div>
            </div>

            {/* 提取按钮 */}
            <Button
              onClick={handleWithdrawAirdrop}
              loading={isWithdrawing}
              disabled={isLoadingAirdropData || !canWithdrawAirdrop}
              className="!bg-[#895EFE] !text-white !rounded-3xl !py-3 !px-4 !text-sm !font-medium !w-full disabled:!opacity-50"
            >
              {isWithdrawing
                ? "提取中..."
                : parseFloat(withdrawableRewards) > 0 &&
                    parseFloat(treasuryBalance) <
                      parseFloat(withdrawableRewards)
                  ? "奖励池不足"
                  : "提取到钱包"}
            </Button>
          </div>
        </div>

        {/* 提现历史部分 */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-black text-[16px] font-bold">提现记录:</div>
            {canMarkStudio && (
              <Button
                onClick={handleOpenMarkStudio}
                className="!bg-[#895EFE] !text-white !rounded-3xl !py-1 !px-3 !text-sm !font-medium"
              >
                标记工作室
              </Button>
            )}
          </div>

          {isLoadingRecords ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : withdrawRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无提现记录</div>
          ) : (
            <div className="space-y-3">
              {withdrawRecords.map((record, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-4 flex items-center"
                >
                  {/* 左侧图标 */}
                  {getWithdrawTypeIcon(record.claimType)}

                  {/* 中间信息 */}
                  <div className="flex-1">
                    <div className="text-black text-[14px] font-medium mb-1">
                      {getWithdrawTypeText(record.claimType)}
                    </div>
                    <div className="text-gray-500 text-[12px]">
                      {formatWithdrawTime(record.claimDate)}
                    </div>
                  </div>

                  {/* 右侧金额 */}
                  <div className="text-right">
                    <div className="text-[#895EFE] text-[16px] font-bold">
                      +{formatWithdrawAmount(record.claimAmount)}
                    </div>
                    <div className="text-gray-500 text-[12px]">
                      {getTokenTypeText(record.tokenType)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 提现表单弹窗 */}
      {showWithdrawForm &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <div className="text-lg font-bold mb-4 text-center">
                提现到钱包
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  可提现金额:{" "}
                  <span className="font-bold text-[#895EFE]">
                    {performanceCommission} IDX
                  </span>
                </div>
                {/* <div className="text-sm text-gray-600 mb-2">
                奖励池余额: <span className="font-bold text-[#895EFE]">{treasuryBalance} IDX</span>
              </div> */}
              </div>

              <div className="mb-6">
                <input
                  type="number"
                  placeholder="请输入提现金额"
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value);
                    setWithdrawError(""); // 输入时清除错误信息
                  }}
                  className={`w-full p-4 border rounded-xl text-sm ${
                    withdrawError ? "border-red-500" : "border-gray-300"
                  }`}
                  step="0.000000000000000001"
                  min="0"
                  max={performanceCommission}
                />
                {withdrawError && (
                  <div className="text-red-500 text-sm mt-2">
                    {withdrawError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelWithdraw}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {isWithdrawing ? "提现中..." : "确认提现"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 推荐人填写表单弹窗 */}
      {showReferrerForm &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <div className="text-lg font-bold mb-4 text-center">
                请输入你的推荐人钱包地址
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="输入推荐人钱包地址"
                  value={referrerInput}
                  onChange={(e) => {
                    setReferrerInput(e.target.value);
                    setReferrerError(""); // 输入时清除错误信息
                  }}
                  className={`w-full p-4 border rounded-xl text-sm ${
                    referrerError ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {referrerError && (
                  <div className="text-red-500 text-sm mt-2">
                    {referrerError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelReferrer}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReferrer}
                  className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium"
                >
                  提交
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 推荐人确认弹窗 */}
      {showReferrerConfirm &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <div className="text-lg font-bold mb-4 text-center">
                确认提示:
              </div>

              <div className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
                推荐人一但填写成功,将不可更改;请确认你刚才填写的地址是否为你的推荐人:
              </div>

              <div className="text-center mb-6">
                <div className="text-lg font-bold text-[#895EFE]">
                  {formatIntroducerAddress(referrerInput)}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelReferrer}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                >
                  不是
                </button>
                <Button
                  onClick={handleConfirmReferrer}
                  loading={isSubmittingReferrer}
                  disabled={isSubmittingReferrer}
                  className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {isSubmittingReferrer ? "提交中..." : "是"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 标记工作室表单弹窗 */}
      {showMarkStudioForm &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm">
              <div className="text-lg font-bold mb-4 text-center">
                标记工作室
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="输入要标记为工作室的地址"
                  value={markStudioAddress}
                  onChange={(e) => {
                    setMarkStudioAddress(e.target.value);
                    setMarkStudioError(""); // 输入时清除错误信息
                  }}
                  className={`w-full p-4 border rounded-xl text-sm ${
                    markStudioError ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {markStudioError && (
                  <div className="text-red-500 text-sm mt-2">
                    {markStudioError}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelMarkStudio}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                >
                  取消
                </button>
                <Button
                  onClick={handleSubmitMarkStudio}
                  disabled={isMarkingStudio}
                  loading={isMarkingStudio}
                  className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {isMarkingStudio ? "标记中..." : "确认标记"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 算力记录弹窗 */}
      {showPowerRecords &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm max-h-[80vh] flex flex-col">
              {/* 标题栏 */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">算力详情</div>
                <button
                  onClick={handleClosePowerRecords}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 我的算力总览 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">我的算力</div>
                <div className="text-2xl font-bold text-black">
                  {powerRecords
                    .reduce(
                      (total, record) => total + parseFloat(record.getAmount),
                      0,
                    )
                    .toFixed(0)}
                </div>
              </div>

              {/* 算力记录列表 */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingPowerRecords ? (
                  <div className="text-center py-8 text-gray-500">
                    加载中...
                  </div>
                ) : powerRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无算力记录
                  </div>
                ) : (
                  <div className="space-y-3">
                    {powerRecords.map((record, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 flex items-center"
                      >
                        {/* 左侧图标 */}
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mr-4">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                          </svg>
                        </div>

                        {/* 中间信息 */}
                        <div className="flex-1">
                          <div className="text-black text-[14px] font-medium mb-1">
                            获得算力
                          </div>
                          <div className="text-gray-500 text-[12px]">
                            {formatPowerTime(record.getDate)}
                          </div>
                        </div>

                        {/* 右侧数量 */}
                        <div className="text-right">
                          <div className="text-[#895EFE] text-[16px] font-bold">
                            +{formatPowerAmount(record.getAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 关闭按钮 */}
              <div className="mt-4">
                <button
                  onClick={handleClosePowerRecords}
                  className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
