import {
  chainsSvgs,
  gasSvg,
  idxBackgroundSvg,
  selectedSvg,
  usdtSvg,
} from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { BindWalletModal } from "@/components/BindWalletModal";
import EmptyComp from "@/components/EmptyComp";
import {
  MiningMachineNodeSystemABI,
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicExtendABI,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageExtendABI,
} from "@/constants";
import { isAddressBlacklisted } from "@/constants/boundblacklist";
import { MachineInfo } from "@/constants/types";
import { useChainConfig } from "@/hooks/useChainConfig";
import config from "@/proviers/config";
import { getExplorerUrl } from "@/utils/helper";
import { sendSignedRequest } from "@/utils/rsaSignature";
import {
  getBalance,
  multicall,
  readContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { Button, Checkbox, Divider, Skeleton, Tabs, Toast } from "antd-mobile";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { erc20Abi, formatEther, formatUnits } from "viem";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import styles from "./Home.module.css";
import UserPageCheckableItem from "./UserPageCheckableItem";

// 导入调试工具（仅开发环境）
if (import.meta.env.DEV) {
  import("@/utils/debugSignature");
}

interface HomeProps {
  onStudioStatusChange?: (isStudio: boolean) => void;
  onStudioMarkerStatusChange?: (canMarkStudio: boolean) => void;
}

export const Home = ({
  onStudioStatusChange,
  onStudioMarkerStatusChange,
}: HomeProps) => {
  const { address: userAddress } = useAccount();
  const chainId = useChainId(); // 获取当前连接的链ID
  const chainConfig = useChainConfig();

  // 使用动态地址，而不是静态导出的地址
  const MiningMachineSystemStorageExtendAddress =
    chainConfig.EXTEND_STORAGE_ADDRESS;
  const MiningMachineSystemLogicExtendAddress =
    chainConfig.EXTEND_LOGIC_ADDRESS;
  const MiningMachineSystemStorageAddress = chainConfig.STORAGE_ADDRESS;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN;
  const USDT_CONTRACTS_ADDRESS = chainConfig.USDT_TOKEN;

  const [machineList, setMachineList] = useState<MachineInfo[]>([]);
  const [allList, setAllList] = useState<MachineInfo[]>([]);
  const [startedList, setStartedList] = useState<MachineInfo[]>([]);
  const [notTurnedOnList, setNotTurnedOnList] = useState<MachineInfo[]>([]);

  const [allStatus, setAllStatus] = useState(false);
  const [isStudio, setIsStudio] = useState(false); // 是否为工作室账户
  const [canMarkStudio, setCanMarkStudio] = useState(false); // 是否可以标记工作室
  const [isLoadingStudio, setIsLoadingStudio] = useState(false); // 加载工作室状态

  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [fuelList, setFuelList] = useState<MachineInfo[]>([]);

  // 绑定钱包相关状态
  const [showBindModal, setShowBindModal] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string>("");
  const [isBinding, setIsBinding] = useState(false);
  const [lastBindingTxHash, setLastBindingTxHash] = useState<string>("");
  const [boundPhone, setBoundPhone] = useState<string>(""); // 已绑定的手机号

  const navigate = useNavigate();
  const location = useLocation(); // 添加路由位置监听

  const [tabs, setTabs] = useState(["全部(0)", "已启动(0)", "未开机(0)"]);
  const [tabKey, setTabKey] = useState("0");

  const { writeContractAsync } = useWriteContract();

  // 检查工作室状态
  const checkStudioStatus = useCallback(async () => {
    if (!userAddress) return;

    try {
      setIsLoadingStudio(true);

      // 检查是否为工作室
      const isStudioResult = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "checkIfStudio",
        args: [userAddress],
      });

      // 检查是否为工作室标记者
      const canMarkStudioResult = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "checkStudioMarker",
        args: [userAddress],
      });

      const studioStatus = Boolean(isStudioResult);
      const markerStatus = Boolean(canMarkStudioResult);

      setIsStudio(studioStatus);
      setCanMarkStudio(markerStatus);
      onStudioStatusChange?.(studioStatus);
      onStudioMarkerStatusChange?.(markerStatus);
    } catch (error) {
      console.error("检查工作室状态失败:", error);
      setIsStudio(false);
      setCanMarkStudio(false);
      onStudioStatusChange?.(false);
      onStudioMarkerStatusChange?.(false);
    } finally {
      setIsLoadingStudio(false);
    }
  }, [userAddress, onStudioStatusChange, onStudioMarkerStatusChange]);

  const [bnbBalance, setBnbBalance] = useState("");
  const [idxBalance, setIdxBalance] = useState("");
  const [usdtBalance, setUsdtBalance] = useState("");
  const [mixBalance, setMixBalance] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const [mixPointsToBeClaimed, setMixPointsToBeClaimed] = useState(0);
  const [manageMachineCount, setManageMachineCount] = useState(0);

  // 空投相关状态
  const [airdropAddress, setAirdropAddress] = useState("");
  const [airdropAmount, setAirdropAmount] = useState("");
  const [hasAirdropPermission, setHasAirdropPermission] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [showAirdropForm, setShowAirdropForm] = useState(false);

  // 空投矿机相关状态
  const [machineAirdropAddress, setMachineAirdropAddress] = useState("");
  const [machineAirdropCount, setMachineAirdropCount] = useState("");
  const [hasMachineAirdropPermission, setHasMachineAirdropPermission] =
    useState(false);
  const [isMachineAirdropping, setIsMachineAirdropping] = useState(false);
  const [showMachineAirdropForm, setShowMachineAirdropForm] = useState(false);

  // 检查空投权限
  const checkAirdropPermission = useCallback(async () => {
    if (!userAddress) return;

    try {
      const hasPermission = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "airdroperAddresses",
        args: [userAddress],
      });
      setHasAirdropPermission(hasPermission as boolean);
    } catch (error) {
      console.error("检查空投权限失败:", error);
      setHasAirdropPermission(false);
    }
  }, [userAddress]);

  // 检查空投矿机权限
  const checkMachineAirdropPermission = useCallback(async () => {
    if (!userAddress) return;

    try {
      console.log("=== 检查空投矿机权限 ===");
      console.log("用户地址:", userAddress);
      console.log("合约地址:", MiningMachineSystemStorageExtendAddress);
      console.log("检查函数: checkIfmachineTransfer");

      const hasPermission = await readContract(config, {
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "checkIfmachineTransfer",
        args: [userAddress],
      });

      console.log("权限检查结果:", hasPermission);
      setHasMachineAirdropPermission(hasPermission as boolean);
    } catch (error) {
      console.error("=== 检查空投矿机权限失败 ===");
      console.error("错误详情:", error);
      setHasMachineAirdropPermission(false);
    }
  }, [userAddress]);

  // 检查待确认的地址绑定
  const checkPendingBinding = useCallback(async () => {
    if (!userAddress) return;

    // 检查 BIND_ADDRESS_URL 是否配置
    if (!chainConfig.BIND_ADDRESS_URL) {
      console.warn("⚠️ BIND_ADDRESS_URL 未配置，跳过绑定检查");
      return;
    }

    try {
      // 使用配置的 BIND_ADDRESS_URL（外部 API，不是 idmix.app 的接口）
      const response = await fetch(
        `${chainConfig.BIND_ADDRESS_URL}/mix/getPhoneByAddress/${userAddress}`,
      );
      const result = await response.json();

      if (
        result.data?.success === false &&
        result.data?.errorCode === "BINDING_PENDING" &&
        result.data?.phone
      ) {
        const pendingPhoneNumber = result.data.phone;

        // 检查地址是否在黑名单中
        if (isAddressBlacklisted(userAddress)) {
          console.warn("⚠️ 地址在黑名单中，禁止绑定");
          Toast.show({
            content: "此地址不可绑定，已删除绑定申请",
            position: "center",
            duration: 3000,
          });

          // 调用接口删除数据库中的绑定记录
          try {
            await sendSignedRequest<{
              code: number;
              message?: string;
              data?: {
                success: boolean;
                message?: string;
              };
            }>("POST", `${chainConfig.BIND_ADDRESS_URL}/mix/deleteBinding`, {
              address: userAddress,
            });
            console.log("✅ 已删除黑名单地址的绑定记录");
          } catch (error) {
            console.error("❌ 删除绑定记录失败:", error);
          }
          return;
        }

        // 在显示弹窗前，先检查链上是否已经绑定
        console.log("🔍 检查链上绑定状态...");
        try {
          const onChainPhone = await readContract(config, {
            address: chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`,
            abi: MiningMachineNodeSystemABI,
            functionName: "getUserPhone",
            args: [userAddress],
          });

          if (onChainPhone && onChainPhone === pendingPhoneNumber) {
            // 链上已绑定，直接调用后端同步
            console.log("✅ 链上已绑定，直接同步到后端");
            Toast.show({
              content: "检测到链上已绑定，正在同步...",
              position: "center",
              duration: 2000,
            });

            // 使用配置的 BIND_ADDRESS_URL（外部 API）
            const syncResult = await sendSignedRequest<{
              code: number;
              message?: string;
              data?: {
                success: boolean;
                message?: string;
                errorCode?: string;
              };
            }>("POST", `${chainConfig.BIND_ADDRESS_URL}/mix/confirmBinding`, {
              phone: pendingPhoneNumber,
              address: userAddress,
            });

            if (syncResult.code === 200 && syncResult.data?.success) {
              console.log("✅ 后端同步成功");
              Toast.show({
                content: "绑定同步成功",
                position: "center",
                duration: 2000,
              });
              // 同步成功后，保存已绑定的手机号
              setBoundPhone(pendingPhoneNumber);
            } else {
              console.warn("⚠️ 后端同步失败:", syncResult);
              // 同步失败仍然显示弹窗，让用户手动确认
              setPendingPhone(pendingPhoneNumber);
              setShowBindModal(true);
            }
            return;
          }
        } catch (onChainError) {
          console.warn("⚠️ 检查链上状态失败:", onChainError);
          // 检查失败，继续显示弹窗
        }

        // 链上未绑定，显示弹窗让用户确认
        setPendingPhone(pendingPhoneNumber);
        setShowBindModal(true);
      } else if (result.data?.success === true && result.data?.phone) {
        // 已经绑定成功，保存手机号用于显示
        setBoundPhone(result.data.phone);
      }
    } catch (error) {
      // 静默处理错误，不阻塞 UI
      console.debug("检查待确认绑定失败:", error);
    }
  }, [
    userAddress,
    chainConfig.BIND_ADDRESS_URL,
    chainConfig.NODE_SYSTEM_ADDRESS,
  ]);

  // 处理同意绑定
  const handleAgreeBinding = useCallback(async () => {
    if (!userAddress || !pendingPhone) return;

    // 检查地址是否在黑名单中
    if (isAddressBlacklisted(userAddress)) {
      console.warn("⚠️ 地址在黑名单中，禁止绑定");
      Toast.show({
        content: "此地址不可绑定",
        position: "center",
        duration: 3000,
      });

      // 调用接口删除数据库中的绑定记录
      try {
        await sendSignedRequest<{
          code: number;
          message?: string;
          data?: {
            success: boolean;
            message?: string;
          };
        }>("POST", `${chainConfig.BIND_ADDRESS_URL}/mix/deleteBinding`, {
          address: userAddress,
        });
        console.log("✅ 已删除黑名单地址的绑定记录");
      } catch (error) {
        console.error("❌ 删除绑定记录失败:", error);
      }

      // 关闭弹窗
      setShowBindModal(false);
      setPendingPhone("");
      return;
    }

    // 检查 BIND_ADDRESS_URL 是否配置
    if (!chainConfig.BIND_ADDRESS_URL) {
      Toast.show({
        content: "绑定服务未配置",
        position: "center",
      });
      return;
    }

    try {
      setIsBinding(true);
      Toast.show({
        content: "正在绑定...",
        position: "center",
      });

      // 第一步：调用合约的 boundUserPhone 函数
      console.log("📝 调用合约 boundUserPhone:", {
        phone: pendingPhone,
        nodeSystemAddress: chainConfig.NODE_SYSTEM_ADDRESS,
      });
      console.log("node system address: ", chainConfig.NODE_SYSTEM_ADDRESS);

      // 先检查手机号是否已被绑定
      const isPhoneBound = await readContract(config, {
        address: chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "isPhoneBound",
        args: [pendingPhone],
      });

      if (isPhoneBound) {
        Toast.show({
          content: "该手机号已被其他地址绑定",
          position: "center",
          duration: 3000,
        });
        setIsBinding(false);
        return;
      }

      // 检查当前地址是否已绑定
      const isAddressBound = await readContract(config, {
        address: chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "isAddressBound",
        args: [userAddress],
      });

      if (isAddressBound) {
        Toast.show({
          content: "该地址已绑定其他手机号",
          position: "center",
          duration: 3000,
        });
        setIsBinding(false);
        return;
      }

      const hash = await writeContractAsync({
        address: chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "boundUserPhone",
        args: [pendingPhone],
        gas: 150000n, // 绑定手机号（100000n → 150000n）⚠️ 已提高
      });

      // 保存交易哈希，以便后续手动同步
      setLastBindingTxHash(hash);

      console.log("⏳ 等待交易确认...", hash);

      // 更新提示信息
      Toast.show({
        content: "交易已发送，等待区块确认...",
        position: "center",
        duration: 0, // 不自动关闭
      });

      let receipt;
      let transactionSuccess = false;

      try {
        // 等待交易确认（会轮询 RPC 节点检查交易状态）
        receipt = await waitForTransactionReceipt(config, {
          hash,
          chainId: chainId, // 使用动态链ID
          confirmations: 1,
          timeout: 60_000,
        });

        transactionSuccess = receipt.status === "success";
        console.log("✅ 合约调用成功:", receipt);
      } catch (waitError) {
        // 超时或其他错误，尝试手动查询
        console.warn("⚠️ 等待确认失败，尝试手动查询交易状态...", waitError);

        try {
          // 使用 getTransactionReceipt 手动查询
          const txReceipt = await readContract(config, {
            address: chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`,
            abi: [
              {
                inputs: [],
                name: "isPhoneBound",
                outputs: [{ type: "bool" }],
                stateMutability: "view",
                type: "function",
              },
            ] as const,
            functionName: "isPhoneBound",
            args: [pendingPhone],
          });

          // 如果能查到绑定状态，说明交易成功了
          if (txReceipt) {
            console.log("✅ 通过合约状态确认交易已成功");
            transactionSuccess = true;
          }
        } catch (queryError) {
          console.error("❌ 无法确认交易状态:", queryError);
          // 即使查询失败，也尝试调用后端（可能交易已成功）
          transactionSuccess = true; // 乐观假设
        }
      }

      // 关闭等待提示
      Toast.clear();

      // 第二步：即使超时也尝试调用后端接口确认绑定
      console.log("📡 调用后端接口确认绑定...");

      if (!transactionSuccess) {
        Toast.show({
          content: "交易状态未确认，但仍尝试同步到后端...",
          position: "center",
          duration: 2000,
        });
      }

      // 使用配置的 BIND_ADDRESS_URL（外部 API）
      const result = await sendSignedRequest<{
        code: number;
        message?: string;
        data?: {
          success: boolean;
          message?: string;
          errorCode?: string;
        };
      }>("POST", `${chainConfig.BIND_ADDRESS_URL}/mix/confirmBinding`, {
        phone: pendingPhone,
        address: userAddress,
      });
      // 检查 result.code 和 result.data.success
      if (result.code !== 200 || !result.data?.success) {
        const errorMsg =
          (result.data && (result.data.message || result.data.errorCode)) ||
          result.message ||
          "后端确认绑定失败";
        console.warn("⚠️ 后端确认失败:", errorMsg);
        Toast.show({
          content: errorMsg,
          position: "center",
          duration: 3000,
        });
        setIsBinding(false);
        throw new Error(errorMsg);
      }

      console.log("✅ 绑定成功:", result);

      Toast.show({
        content: "绑定成功",
        position: "center",
      });

      setShowBindModal(false);
      setPendingPhone("");

      // 绑定成功后，保存已绑定的手机号用于显示
      setBoundPhone(pendingPhone);
    } catch (error) {
      console.error("❌ 绑定失败:", error);

      // 清除所有 Toast
      Toast.clear();

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 特殊处理超时错误
      if (errorMessage.includes("Timed out while waiting")) {
        const explorerUrl = getExplorerUrl(chainId, lastBindingTxHash);
        Toast.show({
          content: (
            <div>
              <div>交易确认超时，但交易可能已成功</div>
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                交易哈希: {lastBindingTxHash.slice(0, 10)}...
              </div>
              <div style={{ marginTop: "4px", fontSize: "12px" }}>
                请在区块链浏览器查看交易状态
              </div>
            </div>
          ),
          position: "center",
          duration: 8000,
        });
        console.log("🔗 查看交易:", explorerUrl);
      } else if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied")
      ) {
        Toast.show({
          content: "用户取消了交易",
          position: "center",
          duration: 2000,
        });
      } else if (
        errorMessage.includes("0x5e983351") ||
        errorMessage.includes("PhoneAlreadyBound")
      ) {
        Toast.show({
          content: "该手机号已被其他地址绑定",
          position: "center",
          duration: 3000,
        });
      } else if (
        errorMessage.includes("0xf6831fd5") ||
        errorMessage.includes("AddressAlreadyBound")
      ) {
        Toast.show({
          content: "该地址已绑定其他手机号",
          position: "center",
          duration: 3000,
        });
      } else {
        Toast.show({
          content: `绑定失败: ${errorMessage}`,
          position: "center",
          duration: 3000,
        });
      }
    } finally {
      setIsBinding(false);
    }
  }, [
    userAddress,
    pendingPhone,
    chainConfig.BIND_ADDRESS_URL,
    chainConfig.NODE_SYSTEM_ADDRESS,
    writeContractAsync,
  ]);

  // 处理拒绝绑定
  const handleRejectBinding = useCallback(async () => {
    if (!userAddress || !pendingPhone) return;

    // 检查 BIND_ADDRESS_URL 是否配置
    if (!chainConfig.BIND_ADDRESS_URL) {
      Toast.show({
        content: "绑定服务未配置",
        position: "center",
      });
      setShowBindModal(false);
      setPendingPhone("");
      return;
    }

    try {
      Toast.show({
        content: "正在拒绝绑定...",
        position: "center",
      });

      // 使用配置的 BIND_ADDRESS_URL（外部 API）
      const result = await sendSignedRequest<{
        code: number;
        message?: string;
        data?: {
          success: boolean;
          message?: string;
          errorCode?: string;
        };
      }>("POST", `${chainConfig.BIND_ADDRESS_URL}/mix/rejectBinding`, {
        phone: pendingPhone,
        address: userAddress,
      });

      // 检查 result.code 和 result.data.success
      if (result.code !== 200 || !result.data?.success) {
        const errorMsg =
          (result.data && (result.data.message || result.data.errorCode)) ||
          result.message ||
          "拒绝绑定失败";
        Toast.show({
          content: errorMsg,
          position: "center",
          duration: 3000,
        });
        throw new Error(errorMsg);
      }

      console.log("拒绝绑定成功:", result);

      Toast.show({
        content: "已拒绝绑定",
        position: "center",
      });

      // 注意：不保存拒绝状态到本地存储，下次仍会检查新的绑定请求
      setShowBindModal(false);
      setPendingPhone("");
    } catch (error) {
      console.error("拒绝绑定失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Toast.show({
        content: `拒绝绑定失败: ${errorMessage}`,
        position: "center",
        duration: 3000,
      });
      // 即使 API 调用失败，也关闭弹窗
      setShowBindModal(false);
      setPendingPhone("");
    }
  }, [userAddress, pendingPhone, chainConfig.BIND_ADDRESS_URL]);

  // 手机号脱敏显示
  const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 11) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  };

  // 检查空投权限
  useEffect(() => {
    checkAirdropPermission();
    checkStudioStatus();
    checkPendingBinding();
  }, [checkAirdropPermission, checkStudioStatus, checkPendingBinding]);

  // 检查空投矿机权限
  useEffect(() => {
    checkMachineAirdropPermission();
  }, [checkMachineAirdropPermission]);

  // query user balance
  const handleQueryUserBalance = useCallback(async () => {
    if (!userAddress) return;

    try {
      const data = await getBalance(config, {
        address: userAddress,
        chainId: chainId,
      });
      const bnbBalance = formatUnits(data.value, data.decimals);
      setBnbBalance(bnbBalance);

      const contracts = [
        {
          address: IDX_CONTRACTS_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress],
        },
        {
          address: USDT_CONTRACTS_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress],
        },
        {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: "mixBalances",
          args: [userAddress],
        },
      ];

      const result = await multicall(config, {
        contracts,
      });

      setIdxBalance(
        result[0].result && typeof result[0].result === "bigint"
          ? formatEther(result[0].result)
          : "0",
      );
      setUsdtBalance(
        result[1].result && typeof result[1].result === "bigint"
          ? formatEther(result[1].result)
          : "0",
      );
      setMixBalance(
        Number(
          result[2].result && typeof result[2].result === "bigint"
            ? formatEther(result[2].result)
            : "0",
        ),
      );
    } catch (error) {
      console.error(error);
    }
  }, [
    userAddress,
    chainId,
    IDX_CONTRACTS_ADDRESS,
    USDT_CONTRACTS_ADDRESS,
    MiningMachineSystemStorageAddress,
  ]);

  useEffect(() => {
    handleQueryUserBalance();
  }, [handleQueryUserBalance]);

  useEffect(() => {
    if (allStatus) {
      // 只选择已激活的子矿机
      const activatedChildMachines = machineList.filter(
        (item) => item.mtype === 2 && item.isActivatedStakedLP,
      );
      setFuelList(activatedChildMachines);
    }
  }, [allStatus, machineList]);

  useEffect(() => {
    // 检查是否所有可选矿机都已选中
    const selectableCount = machineList.filter(
      (item) => item.mtype === 2 && item.isActivatedStakedLP,
    ).length;

    if (selectableCount > 0 && fuelList.length === selectableCount) {
      setAllStatus(true);
    } else if (fuelList.length === 0) {
      setAllStatus(false);
    }
  }, [fuelList.length, machineList]);

  const toggleSelectAll = () => {
    setMachineList((prevList) => {
      // 计算 gas limit 限制
      const baseGas = 100000n;
      const perMachineGas = 1200000n;
      const MAX_GAS_LIMIT = 25000000n;
      const maxMachines = Math.floor(
        Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
      );

      const newList = prevList.map((item) => {
        // 只允许选择已激活的子矿机
        if (item.mtype === 2 && item.isActivatedStakedLP) {
          return {
            ...item,
            checked: !allStatus,
          };
        }
        return item;
      });

      if (!allStatus) {
        // 只添加已激活的子矿机到 fuelList
        const activatedChildMachines = newList.filter(
          (item) => item.mtype === 2 && item.isActivatedStakedLP,
        );

        // 检查是否超过 gas limit
        if (activatedChildMachines.length > maxMachines) {
          Toast.show({
            content: `一次最多只能为 ${maxMachines} 台矿机加注燃料，已自动选择前 ${maxMachines} 台`,
            position: "center",
            duration: 3000,
          });

          // 只选择前 maxMachines 台
          const limitedMachines = activatedChildMachines.slice(0, maxMachines);
          setFuelList(limitedMachines);

          // 更新选中状态
          return prevList.map((item) => {
            if (item.mtype === 2 && item.isActivatedStakedLP) {
              const isInLimitedList = limitedMachines.some(
                (m) => m.id === item.id,
              );
              return { ...item, checked: isInLimitedList };
            }
            return item;
          });
        }

        setFuelList(activatedChildMachines);
      } else {
        setFuelList([]);
      }

      return newList;
    });

    setAllStatus(!allStatus);
  };

  const handleLeftClick = useCallback(
    (item: MachineInfo) => {
      setMachineList((prevItems) => {
        const newItems = prevItems.map((e) => {
          return e.id === item.id ? { ...e, checked: !e.checked } : e;
        });

        const isItemChecked = !item.checked;
        if (isItemChecked) {
          // 检查 gas limit 限制
          const baseGas = 100000n;
          const perMachineGas = 1200000n;
          const MAX_GAS_LIMIT = 25000000n;
          const maxMachines = Math.floor(
            Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
          );

          const newCount = fuelList.length + 1;
          if (newCount > maxMachines) {
            Toast.show({
              content: `一次最多只能为 ${maxMachines} 台矿机加注燃料，请先取消其他选择`,
              position: "center",
              duration: 3000,
            });
            // 恢复选中状态
            return prevItems;
          }

          if (allStatus) {
            const activatedChildMachines = machineList.filter(
              (m) => m.mtype === 2 && m.isActivatedStakedLP,
            );
            setFuelList(activatedChildMachines);
          } else {
            setFuelList([...fuelList, item]);
          }
        } else {
          const list = fuelList.filter((e) => e.id !== item.id);
          setFuelList(list);
          setAllStatus(false);
        }

        return newItems;
      });
    },
    [allStatus, machineList, fuelList],
  );

  const handleQuery = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "getOwnerToMachineIds",
        args: [userAddress],
      });
      const bignumToNumber = (data as bigint[]).map((e) => Number(e));

      const contracts = bignumToNumber.map((e) => {
        return {
          address: MiningMachineSystemStorageAddress as `0x${string}`,
          abi: MiningMachineSystemStorageABI as const,
          functionName: "getMachineLifecycle" as const,
          args: [e] as const,
        };
      });
      const data2 = await multicall(config, {
        contracts,
      });
      const result = data2.map((e, i) => {
        return {
          activatedAt: Number(e.result.activatedAt),
          createTime: Number(e.result.createTime),
          expiredAt: Number(e.result.expiredAt),
          destroyed: e.result.destroyed,
          isActivatedStakedLP: e.result.isActivatedStakedLP,
          isFuelPaid: e.result.isFuelPaid,
          isProducing: e.result.isProducing,
          mtype: e.result.mtype,
          checked: false,
          status: e.status,
          id: bignumToNumber[i],
          lastProduceTime: Number(e.result.lastProduceTime),
          producedChildCount: Number(e.result.producedChildCount),
          producedHours: Number(e.result.producedHours),
          fuelRemainingMinutes: Number(e.result.fuelRemainingMinutes),
        };
      });

      const childListResult = result.filter(
        (e) => e.mtype === 2 && e.isActivatedStakedLP,
      );

      // 获取子矿机生命剩余
      const remainingContract = childListResult.map((item) => {
        return {
          address: MiningMachineProductionLogicAddress as `0x${string}`,
          abi: MiningMachineProductionLogicABI,
          functionName: "viewMachineProduction",
          args: [item.id],
        };
      });

      const data3 = await multicall(config, {
        contracts: remainingContract,
      });

      const result3 = childListResult.map((item, i) => {
        if (data3[i].status === "success" && data3[i].result) {
          const res = data3[i].result as readonly bigint[];
          return {
            ...item,
            unclaimedChildCount: Number(res[2]),
            producedMix: Number(res[3]),
            unclaimedMix: Number(res[5]),
          };
        }
        return {
          ...item,
          unclaimedChildCount: 0,
          producedMix: 0,
          unclaimedMix: 0,
        };
      });

      const contractsWithOnSale = result.map((item) => ({
        address: MiningMachineSystemStorageAddress as `0x${string}`,
        abi: MiningMachineSystemStorageABI,
        functionName: "_isOnSale",
        args: [item.id],
      }));

      const dataWithOnSale = await multicall(config, {
        contracts: contractsWithOnSale,
      });

      const resultWithOnSale = result.map((item, i) => ({
        ...item,
        isOnSale: dataWithOnSale[i].result,
      }));

      let motherAndChildList = resultWithOnSale.filter((e) => {
        if (e.mtype === 1) {
          return !e.isOnSale;
        } else if (e.mtype === 2) {
          return !e.isActivatedStakedLP && !e.isOnSale;
        }
      });
      motherAndChildList = motherAndChildList.filter((e) => !e.destroyed);
      setManageMachineCount(motherAndChildList.length);

      const allCliamMix = result3.reduce((acc, cur) => {
        return acc + cur.unclaimedMix;
      }, 0);

      setMixPointsToBeClaimed(+formatEther(BigInt(allCliamMix)));

      // 关键：根据最新的isProducing状态更新列表
      const activeMachines = result3.filter(
        (e) => e.isProducing && e.isActivatedStakedLP,
      );
      const inactiveMachines = result3.filter(
        (e) => !e.isProducing && e.isActivatedStakedLP && !e.destroyed,
      );

      setStartedList(activeMachines);
      setNotTurnedOnList(inactiveMachines);
      setAllList(result3);

      // 更新标签计数
      setTabs([
        `全部(${result3.length})`,
        `已启动(${activeMachines.length})`,
        `未开机(${inactiveMachines.length})`,
      ]);

      // 根据当前选中的标签页更新显示列表
      if (tabKey === "0") setMachineList(result3);
      if (tabKey === "1") setMachineList(activeMachines);
      if (tabKey === "2") setMachineList(inactiveMachines);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, tabKey]);

  // 初始加载数据
  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  // 监听刷新信号并重新加载数据
  useEffect(() => {
    const { state } = location;
    // 如果收到需要刷新的信号
    if (state?.needRefresh) {
      handleQuery().then(() => {
        // 清除信号，使用replace避免历史记录问题
        navigate(location.pathname, {
          state: { ...state, needRefresh: false },
          replace: true,
        });
      });
    }
    // 当从矿机详情页返回时也刷新数据（作为备选方案）
    else if (state?.fromMachineDetail) {
      handleQuery().then(() => {
        navigate(location.pathname, {
          state: { ...state, fromMachineDetail: false },
          replace: true,
        });
      });
    }
  }, [location, handleQuery, navigate]);

  useEffect(() => {
    if (fuelList.length === machineList.length && fuelList.length > 0) {
      setAllStatus(true);
    } else {
      setAllStatus(false);
    }
  }, [fuelList.length, machineList.length]);

  const handleRightClick = (item: MachineInfo) => {
    console.log("跳转的矿机ID:", item.id);
    navigate("/user/machineDetail", { state: { id: item.id, ...item } });
  };

  const Row = memo(
    ({
      index,
      style,
      data,
    }: {
      data: MachineInfo[];
      index: number;
      style: React.CSSProperties;
    }) => {
      const item = data[index];
      return (
        <div
          style={{
            ...style,
            height: "70px",
          }}
        >
          <UserPageCheckableItem
            item={item}
            onLeftClick={handleLeftClick}
            onRightClick={handleRightClick}
            disabled={item.mtype !== 2 || !item.isActivatedStakedLP}
          />
        </div>
      );
    },
  );

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = 100;
      const newHeight = windowHeight - topSectionHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const handleAddFuel = async () => {
    if (fuelList.length === 0) {
      Toast.show({
        content: "请选择要添加燃料的矿机",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 检查 gas limit 限制
    const baseGas = 100000n;
    const perMachineGas = 1200000n; // 每台矿机需要的 gas（追溯15层推荐人）
    const MAX_GAS_LIMIT = 25000000n;
    const calculatedGasLimit =
      baseGas + BigInt(fuelList.length) * perMachineGas;
    const maxMachines = Math.floor(
      Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
    );

    if (calculatedGasLimit > MAX_GAS_LIMIT) {
      Toast.show({
        content: `一次最多只能为 ${maxMachines} 台矿机加注燃料，当前选择了 ${fuelList.length} 台，请减少选择数量`,
        position: "center",
        duration: 3000,
      });
      return;
    }

    navigate("/user/addFuel", { state: fuelList });
  };

  const getChekeIcon = (checked: boolean): React.ReactNode =>
    checked ? (
      <img src={selectedSvg} alt="" width={16} height={16} />
    ) : (
      <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
    );

  const handleToBeActivatedClick = () => {
    navigate("/user/toBeActivatedMachine");
  };

  const handleClaimMix = useCallback(async () => {
    navigate("/user/claimMix", {
      state: {
        machineList,
        mixPointsToBeClaimed,
      },
    });
  }, [machineList, mixPointsToBeClaimed, navigate]);

  const handleMixBillClick = () => {
    navigate("/user/mixBill");
  };

  const handleExchangeIdxClick = () => {
    navigate("/user/exchangeIdx");
  };

  const handleMixTransfer = () => {
    navigate("/user/transferMix");
  };

  const handleStockExchange = () => {
    navigate("/user/exchangeStock");
  };

  const handleSyntheticMachine = () => {
    navigate("/user/syntheticMachine");
  };

  // 空投处理函数
  const handleAirdrop = async () => {
    if (!airdropAddress || !airdropAmount) {
      Toast.show({
        content: "请输入地址和数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    const amount = parseFloat(airdropAmount);
    const currentIdxBalance = parseFloat(idxBalance);

    if (amount <= 0) {
      Toast.show({
        content: "数量必须大于0",
        position: "center",
        duration: 2000,
      });
      return;
    }

    if (amount > currentIdxBalance) {
      Toast.show({
        content: "数量不能大于当前IDX余额",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsAirdropping(true);

      console.log("=== 开始空投IDX ===");
      console.log("目标地址:", airdropAddress);
      console.log("空投数量:", airdropAmount);
      console.log("合约地址:", MiningMachineSystemLogicExtendAddress);

      // airdrop 函数需要执行：
      // - 检查和设置激活日期（如果需要）
      // - 增加奖励余额
      // - 记录历史
      // 优化：提高安全余量，确保交易成功
      const baseGas = 300000n; // 200000n → 300000n (+50%)⚠️ 已提高
      const gasLimit = (baseGas * 120n) / 100n; // 添加 20% 安全余量

      console.log(`使用 Gas Limit: ${gasLimit} (包含 20% 安全余量)`);

      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "airdrop",
        args: [airdropAddress, airdropAmount],
        gas: gasLimit,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: chainId, // 使用动态链ID
      });

      Toast.show({
        content: "空投成功",
        position: "center",
      });

      // 重置表单
      setAirdropAddress("");
      setAirdropAmount("");
      setShowAirdropForm(false);

      // 刷新余额
      handleQueryUserBalance();
    } catch (error) {
      Toast.show({
        content: "空投失败",
        position: "center",
      });
      console.error("Airdrop failed:", error);
    } finally {
      setIsAirdropping(false);
    }
  };

  // 空投矿机处理函数
  const handleMachineAirdrop = async () => {
    if (!machineAirdropAddress || !machineAirdropCount) {
      Toast.show({
        content: "请输入地址和数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    const count = parseInt(machineAirdropCount);

    if (count <= 0) {
      Toast.show({
        content: "数量必须大于0",
        position: "center",
        duration: 2000,
      });
      return;
    }

    if (count > 100) {
      Toast.show({
        content: "数量不能大于100",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsMachineAirdropping(true);

      console.log("=== 开始空投矿机 ===");
      console.log("目标地址:", machineAirdropAddress);
      console.log("空投数量:", count);
      console.log("合约地址:", MiningMachineSystemLogicExtendAddress);

      // 根据矿机数量动态计算 gas limit
      // 优化：提高安全余量，确保交易成功
      // mintChildMachine 需要为每台矿机执行多次存储操作：
      // - setMachine (存储矿机信息)
      // - pushOwnerToMachineId (关联到所有者)
      // - setMachineLifecycle (初始化生命周期)
      const baseGas = 400000n; // 300000n → 400000n (+33%)⚠️ 已提高
      const perMachineGas = 180000n; // 150000n → 180000n (+20%)⚠️ 已提高
      const calculatedGas = baseGas + perMachineGas * BigInt(count);
      // 添加 20% 安全余量
      const gasLimit = (calculatedGas * 120n) / 100n;

      console.log(
        `计算的 Gas Limit: ${gasLimit} (${count}台矿机，包含 20% 安全余量)`,
      );

      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "mintChildMachine",
        args: [machineAirdropAddress, BigInt(count)],
        gas: gasLimit,
      });

      console.log("交易已发送，哈希:", hash);
      console.log("等待交易确认...");

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: chainId, // 使用动态链ID
      });

      console.log("=== 交易确认详情 ===");
      console.log("交易哈希:", receipt.transactionHash);
      console.log("区块号:", receipt.blockNumber);
      console.log("交易状态:", receipt.status);
      console.log("Gas使用量:", receipt.gasUsed?.toString());
      console.log("交易索引:", receipt.transactionIndex);
      console.log("日志数量:", receipt.logs?.length || 0);

      // 检查交易状态
      if (receipt.status === "success") {
        console.log("✅ 交易执行成功");
        Toast.show({
          content: "空投矿机成功",
          position: "center",
        });

        // 重置表单
        setMachineAirdropAddress("");
        setMachineAirdropCount("");
        setShowMachineAirdropForm(false);

        // 刷新数据
        handleQueryUserBalance();
      } else {
        console.log("❌ 交易执行失败，状态:", receipt.status);
        throw new Error(`交易执行失败，状态: ${receipt.status}`);
      }
    } catch (error) {
      console.error("=== 空投矿机失败详情 ===");
      console.error("错误类型:", error?.constructor?.name);
      console.error("错误消息:", error?.message);
      console.error("错误代码:", error?.code);
      console.error("完整错误对象:", error);

      // 根据错误类型显示不同的提示
      let errorMessage = "空投矿机失败";
      const errorObj = error as {
        name?: string;
        code?: number;
        message?: string;
      };
      if (
        errorObj?.name === "UserRejectedRequestError" ||
        errorObj?.code === 4001
      ) {
        errorMessage = "用户取消操作";
      } else if (errorObj?.message?.includes("交易执行失败")) {
        errorMessage = "交易执行失败，请检查权限或参数";
      } else if (errorObj?.message?.includes("insufficient funds")) {
        errorMessage = "Gas费不足";
      } else if (errorObj?.message?.includes("revert")) {
        errorMessage = "合约执行失败，请检查权限";
      }

      Toast.show({
        content: errorMessage,
        position: "center",
        duration: 3000,
      });
    } finally {
      setIsMachineAirdropping(false);
    }
  };

  const handleTabsChange = (key: string) => {
    setTabKey(key);
    if (key === "0") setMachineList(allList);
    if (key === "1") setMachineList(startedList);
    if (key === "2") setMachineList(notTurnedOnList);
  };

  return (
    <div className=" flex flex-col justify-between">
      <div className="px-[21px] ">
        <div className="bg-[#09090a] rounded-2xl text-white px-4 py-2 text-[1rem] relative">
          <div className="text-[#c6c6c6] text-[12px] font-[400] flex justify-between items-center">
            <span>钱包余额</span>
            {boundPhone && (
              <span className="text-[10px]">
                已绑定商城账号: {maskPhone(boundPhone)}
              </span>
            )}
          </div>

          <div className="flex mt-1 mb-1 items-center gap-1">
            <img src={usdtSvg} alt="" width={16} height={16} />
            <div className="text-[#c6c6c6] text-[10px] font-[400] w-[27px]">
              USDT
            </div>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={usdtBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>

          <div className="flex my-1 items-center  gap-1">
            <img src={chainsSvgs.bscSvg} alt="" width={16} height={16} />
            <span className="text-[#c6c6c6] text-[10px] font-[400] w-[27px]">
              BNB
            </span>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={bnbBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>

          <div className="flex  gap-1  mb-2 items-center">
            <div className="bg-[#895eff] rounded-[50%] text-[7px] flex items-center justify-center w-[16px] h-[16px]">
              IDX
            </div>
            <span className="text-[#c6c6c6] text-[10px] font-[400] w-[27px]">
              IDX
            </span>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5  font-bold"
              />
            </div>
          </div>

          <img
            src={idxBackgroundSvg}
            alt=""
            width={71}
            height={87}
            className="absolute top-[2.5rem] right-[2.5rem]"
          />
        </div>

        <div className="bg-black rounded-2xl text-white p-4 text-[1rem] mt-2">
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="bg-[#0B8659] rounded-[50%] text-[7px] flex items-center justify-center  w-[16px] h-[16px]">
                MIX
              </div>
              <div>
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={mixBalance}
                  decimalSubLen={2}
                  className="ml-2 mr-1.5"
                />
                <span className="text-[#c6c6c6] text-[10px] font-[400]">
                  MIX
                </span>
              </div>
            </div>

            <div
              className="flex gap-2 text-[10px] items-center"
              onClick={handleMixBillClick}
            >
              账单
              <div className="w-[16px] h-[18px] bg-[#333] rounded-[50%] text-[.6875rem] flex items-center justify-center ">
                i
              </div>
            </div>
          </div>

          <div className="flex gap-2 text-[#c6c6c6] mt-4">
            {/* <div
              onClick={handleSyntheticMachine}
              className="flex-[1] text-center bg-[#09090a] border border-[#212122] rounded-3xl py-1 text-[.7rem]"
            >
              合成矿机
            </div> */}
            <div
              onClick={handleExchangeIdxClick}
              className="flex-[1] text-center bg-[#09090a] border border-[#212122] rounded-3xl py-1 text-[.7rem]"
            >
              兑换IDX
            </div>
            <div
              onClick={handleMixTransfer}
              className="flex-[1] text-center bg-[#09090a] border border-[#212122] rounded-3xl py-1 text-[.7rem]"
            >
              MIX转账
            </div>
            <div
              onClick={handleStockExchange}
              className="flex-[1] text-center bg-[#09090a] border border-[#212122] rounded-3xl py-1 text-[.7rem]"
            >
              兑换股权
            </div>
          </div>

          <div className="flex gap-2 text-[#c6c6c6] mt-2">
            {hasAirdropPermission && (
              <div
                onClick={() => setShowAirdropForm(true)}
                className="flex-[1] text-center border border-[#212122] rounded-3xl py-1 text-[.7rem] bg-[#09090a] cursor-pointer"
              >
                空投IDX
              </div>
            )}
            {hasMachineAirdropPermission && (
              <div
                onClick={() => setShowMachineAirdropForm(true)}
                className="flex-[1] text-center border border-[#212122] rounded-3xl py-1 text-[.7rem] bg-[#09090a] cursor-pointer"
              >
                空投矿机
              </div>
            )}
          </div>
        </div>

        <div className="flex mt-2 items-center   text-[#C7BEDF] gap-2">
          <Button
            onClick={handleClaimMix}
            className="flex-1/2 !bg-[#09090a] !rounded-2xl  !mb-2  !items-center  !py-1 "
          >
            <div className="flex flex-col !text-[#C7BEDF] ">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={mixPointsToBeClaimed}
                decimalSubLen={2}
                className="ml-2 mr-1.5 text-[#895EFE] font-bold text-[1rem]"
              />
              <div className="text-[.75rem]">挖矿产出（MIX）</div>
            </div>
          </Button>

          <Button
            onClick={handleToBeActivatedClick}
            className="flex-1/2 !bg-[#09090a] !rounded-2xl  !mb-2  !items-center  !py-1 "
          >
            <div className="flex flex-col !text-[#C7BEDF] text-[.75rem]">
              <div className="ml-2 mr-1.5 text-[#895EFE] font-bold text-[1rem]">
                {manageMachineCount}
              </div>
              <div className="text-[.75rem]">矿机管理（个）</div>
            </div>
          </Button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center">
            <Checkbox
              className="mr-6 h-[36px] "
              checked={allStatus}
              icon={(isChecked) => getChekeIcon(isChecked)}
              onClick={toggleSelectAll}
              style={{
                "--font-size": "12px",
                "--gap": "6px",
                padding: "8px 0 10px",
              }}
            >
              全选
            </Checkbox>

            <Divider
              direction="vertical"
              style={{
                borderColor: "#666",
                height: "15px",
              }}
            />
          </div>

          <Tabs
            activeKey={tabKey}
            onChange={handleTabsChange}
            style={{
              "--active-line-height": "0",
            }}
            className={`
                  ${styles["adm-tabs"]}
                  !h-[40px] !shrink-0
                  [&_.adm-tabs-tab-wrapper]:flex-none [&_.adm-tabs-tab-wrapper]:px-0
                  [&_.adm-tabs-tab.adm-tabs-tab-active]:font-bold [&_.adm-tabs-tab.adm-tabs-tab-active]:opacity-100
                  [&_.adm-tabs-tab]:text-[12px]
                  [&_.adm-tabs-tab]:pb-[11px]
                  [&_.adm-tabs-tab]:pt-[14px]
                  [&_.adm-tabs-tab]:opacity-40 [&_.adm-tabs-tab]:transition-transform
                `}
          >
            {tabs.map((tab, index) => (
              <Tabs.Tab key={index} title={tab} className="flex flex-col" />
            ))}
          </Tabs>
        </div>

        {/* 列表 */}

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar mb-[4rem]"
        >
          {!isLoading ? (
            machineList.length > 0 ? (
              <List
                height={listHeight}
                width="100%"
                itemCount={machineList.length}
                itemSize={100}
                itemData={machineList}
              >
                {Row}
              </List>
            ) : (
              <EmptyComp />
            )
          ) : (
            <Skeleton.Paragraph
              lineCount={6}
              animated
              className={`customSkeleton`}
            />
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 w-full bg-white  py-[.75rem] flex items-center mt-auto px-[21px]"
        onClick={handleAddFuel}
      >
        {fuelList.length > 0 && (
          <div className="bg-[#F1F1F3] rounded-[50%] w-[32px] h-[32px] flex justify-center items-center text-[#895FFE] font-bold">
            {fuelList.length}
          </div>
        )}
        <div className="flex flex-col items-center justify-center  mx-auto">
          <img src={gasSvg} alt="" width={18} />
          <span className="text-[.8125rem] mt-1">添加燃料</span>
        </div>
      </div>

      {/* 空投表单弹窗 */}
      {showAirdropForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 mx-4 w-full max-w-sm">
            <div className="text-lg font-bold mb-4 text-center">空投IDX</div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">接收地址</div>
              <input
                type="text"
                placeholder="输入接收地址"
                value={airdropAddress}
                onChange={(e) => setAirdropAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">空投数量</div>
              <input
                type="number"
                placeholder="输入数量"
                value={airdropAmount}
                onChange={(e) => setAirdropAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                当前余额: {idxBalance} IDX
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAirdropForm(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAirdrop}
                disabled={isAirdropping || !airdropAddress || !airdropAmount}
                className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAirdropping ? "空投中..." : "确认空投"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 空投矿机表单弹窗 */}
      {showMachineAirdropForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 mx-4 w-full max-w-sm">
            <div className="text-lg font-bold mb-4 text-center">空投矿机</div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">接收地址</div>
              <input
                type="text"
                placeholder="输入接收地址"
                value={machineAirdropAddress}
                onChange={(e) => setMachineAirdropAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">空投数量</div>
              <input
                type="number"
                placeholder="输入数量"
                value={machineAirdropCount}
                onChange={(e) => setMachineAirdropCount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">最大数量: 100 个</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowMachineAirdropForm(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleMachineAirdrop}
                disabled={
                  isMachineAirdropping ||
                  !machineAirdropAddress ||
                  !machineAirdropCount
                }
                className="flex-1 py-3 bg-[#895EFE] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMachineAirdropping ? "空投中..." : "确认空投"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定钱包弹窗 */}
      <BindWalletModal
        visible={showBindModal}
        mallAccount={pendingPhone}
        onAgree={handleAgreeBinding}
        onReject={handleRejectBinding}
        onClose={() => {
          setShowBindModal(false);
          setPendingPhone("");
        }}
      />
    </div>
  );
};
