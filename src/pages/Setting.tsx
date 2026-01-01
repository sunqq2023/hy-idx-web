import {
  MiningMachineNodeSystemABI,
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
  SelluserManagerABI,
  MiningMachineSystemStorageExtendABI,
  MiningMachineSystemLogicExtendABI,
  MiningMachineHistoryExtendABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { validateAddressFnMap } from "@/utils/validateAddress";
import { Button, Input, TextArea, Toast, Dialog, Checkbox } from "antd-mobile";
import { useEffect, useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import {
  waitForTransactionReceipt,
  multicall,
  readContract,
  getBalance,
} from "@wagmi/core";
import config from "@/proviers/config";
import { parseEther, erc20Abi, formatEther, getAddress } from "viem";

const Setting = () => {
  const { address: currentWalletAddress, chainId: walletChainId } =
    useAccount();
  const chainConfig = useChainConfig();

  // 使用动态地址（添加类型断言）
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineNodeSystemAddress =
    chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`;
  const MiningMachineSelluserManagerAddress =
    chainConfig.SELLUSER_MANAGER_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageExtendAddress =
    chainConfig.EXTEND_STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicExtendAddress =
    chainConfig.EXTEND_LOGIC_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;

  /* ===== 新增：本地登录态 ===== */
  const [passed, setPassed] = useState(false); // 是否已通过
  const [inputPwd, setInputPwd] = useState(""); // 输入框实时值
  const [visible, setVisible] = useState(true); // 弹窗开关

  // 写死密码
  const PASSWORD = "247798";

  // 点击确认
  const handleLogin = () => {
    if (inputPwd === PASSWORD) {
      setPassed(true);
      setVisible(false);
    } else {
      Toast.show({ content: "密码错误", position: "center", duration: 2000 });
    }
  };
  const [idxTokenAddress, setIdxTokenAddress] = useState("");
  const [usdtTokenAddress, setusdtTokenAddress] = useState("");
  const [pancakeRouterAddress, setPancakeRouterAddress] = useState("");
  const [idxUsdtPairAddress, setIdxUsdtPairAddress] = useState("");

  const [idxLoading, setIdxLoading] = useState(false);
  const [usdtLoading, setUsdtLoading] = useState(false);
  const [pancakeLoading, setPancakeLoading] = useState(false);
  const [idxUsdtPairLoading, setIdxUsdtPairLoading] = useState(false);
  const [motherLoading, setMotherLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [nodeLoading, setNodeLoading] = useState(false);

  const [motherLifeCycle, setMotherLifeCycle] = useState("");
  const [motherProductInterval, setMoterhProductInterval] = useState("");
  const [childLifeCycle, setChildLifeCycle] = useState("");
  const [childProductInterval, setChildProductInterval] = useState("");

  const [nodeCount, setNodeCount] = useState("");
  const [lockDuration, setLockDuration] = useState("");
  const [releaseDuration, setReleaseDuration] = useState("");
  const [releaseIntervalMinutes, setReleaseIntervalMinutes] = useState("");

  const [withdrawTokenAddress, setWithdrawTokenAddress] = useState("");
  const [withdrawTokenAmount, setWithdrawTokenAmount] = useState("");
  const [withdrawTokenLoading, setWithdrawTokenLoading] = useState(false);

  const [activeAndGasFee, setActiveAndGasFee] = useState("");

  const [PLATFORM_FEE_USD, setPLATFORM_FEE_USD] = useState("");
  const [SELLER_INCOME_USD, setSELLER_INCOME_USD] = useState("");

  const [adminAddress, setAdminAddress] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);

  const [mixCount, setMixCount] = useState("");
  const [idxCount, setIdxCount] = useState("");
  const [isChangingMixToIdxRate, setIsChangingMixToIdxRate] = useState(false);

  const [serviceChargeAddress, setServiceChargeAddress] = useState("");
  const [serviceChargeAddressLoading, setServiceChargeAddressLoading] =
    useState(false);

  // 新增状态定义
  const [mintChildMachineAddress, setMintChildMachineAddress] = useState("");
  const [mintChildMachineCount, setMintChildMachineCount] = useState("");
  const [isMintingChildMachine, setIsMintingChildMachine] = useState(false);

  // 挂售账号相关状态
  const [sellUserAddress, setSellUserAddress] = useState("");
  const [sellUserStatus, setSellUserStatus] = useState(true);
  const [isSettingSellUser, setIsSettingSellUser] = useState(false);

  // 授权空投IDX相关状态
  const [airdropperAddress, setAirdropperAddress] = useState("");
  const [airdropperLoading, setAirdropperLoading] = useState(false);

  // 授权铸造子矿机相关状态
  const [machineTransferAddress, setMachineTransferAddress] = useState("");
  const [machineTransferLoading, setMachineTransferLoading] = useState(false);

  // 授权标记工作室相关状态
  const [studioMarkerAddress, setStudioMarkerAddress] = useState("");
  const [studioMarkerLoading, setStudioMarkerLoading] = useState(false);

  // 奖励池管理相关状态
  const [addIdxAmount, setAddIdxAmount] = useState(""); // 往奖励池增加IDX数量
  const [withdrawIdxAmount, setWithdrawIdxAmount] = useState(""); // 从奖励池提取IDX数量
  const [isAddingIdx, setIsAddingIdx] = useState(false); // 增加IDX中状态
  const [isWithdrawingIdx, setIsWithdrawingIdx] = useState(false); // 提取IDX中状态
  const [rewardPoolBalance, setRewardPoolBalance] = useState("0"); // 奖励池余额
  const [isLoadingRewardPool, setIsLoadingRewardPool] = useState(false); // 加载奖励池余额状态

  // 算力上限设置相关状态
  const [promotionPowerLimit, setPromotionPowerLimit] = useState(""); // 推广算力上限
  const [activatedPowerLimit, setActivatedPowerLimit] = useState(""); // 激活算力上限
  const [promotionPowerLimitLoading, setPromotionPowerLimitLoading] =
    useState(false); // 设置推广算力上限中状态
  const [activatedPowerLimitLoading, setActivatedPowerLimitLoading] =
    useState(false); // 设置激活算力上限中状态

  // MIX 操作相关状态
  const [addMixForOperatorAmount, setAddMixForOperatorAmount] = useState(""); // 给操作员添加 MIX 数量
  const [subMixForOperatorAmount, setSubMixForOperatorAmount] = useState(""); // 从操作员减少 MIX 数量
  const [transferMixFromAddress, setTransferMixFromAddress] = useState(""); // 转移 MIX 源地址
  const [transferMixToAddress, setTransferMixToAddress] = useState(""); // 转移 MIX 目标地址
  const [transferMixAmount, setTransferMixAmount] = useState(""); // 转移 MIX 数量
  const [useCurrentAccount, setUseCurrentAccount] = useState(false); // 是否从当前账户转移
  const [useOperatorAddress, setUseOperatorAddress] = useState(false); // 是否给 MixOperator 充值
  const [isAddingMixForOperator, setIsAddingMixForOperator] = useState(false); // 添加 MIX 中状态
  const [isSubtractingMixForOperator, setIsSubtractingMixForOperator] =
    useState(false); // 减少 MIX 中状态
  const [isTransferringMix, setIsTransferringMix] = useState(false); // 转移 MIX 中状态
  const [operatorMixBalance, setOperatorMixBalance] = useState("0"); // 操作员 MIX 余额
  const [operatorBnbBalance, setOperatorBnbBalance] = useState("0"); // 操作员 BNB 余额
  const [isLoadingOperatorBalance, setIsLoadingOperatorBalance] =
    useState(false); // 加载操作员余额状态

  // LogicExtend 升级相关状态
  // 旧 LogicExtend 合约地址（主网）
  const OLD_LOGIC_EXTEND_ADDRESS =
    "0x1AAE73285d2bc36fe25e9b935f3a8f8E8f5776d0" as `0x${string}`;

  const [activeMachineRewardsEnabled, setActiveMachineRewardsEnabled] =
    useState<boolean | null>(null); // 激活奖励开关状态
  const [isLoadingRewardsEnabled, setIsLoadingRewardsEnabled] = useState(false); // 加载开关状态
  const [isSettingRewardsEnabled, setIsSettingRewardsEnabled] = useState(false); // 设置开关中状态

  const [isAuthorizingStorageExtend, setIsAuthorizingStorageExtend] =
    useState(false); // 授权 StorageExtend 中状态
  const [isAuthorizingHistoryExtend, setIsAuthorizingHistoryExtend] =
    useState(false); // 授权 HistoryExtend 中状态
  const [isUpdatingLogicAddress, setIsUpdatingLogicAddress] = useState(false); // 更新 Logic 地址中状态
  const [isWithdrawingOldIdx, setIsWithdrawingOldIdx] = useState(false); // 提取旧合约 IDX 中状态
  const [oldLogicExtendIdxBalance, setOldLogicExtendIdxBalance] = useState("0"); // 旧合约 IDX 余额
  const [isLoadingOldIdxBalance, setIsLoadingOldIdxBalance] = useState(false); // 加载旧合约余额状态
  const [adminIdxBalance, setAdminIdxBalance] = useState("0"); // 管理员地址 IDX 余额
  const [isLoadingAdminIdxBalance, setIsLoadingAdminIdxBalance] =
    useState(false); // 加载管理员余额状态

  const handleModifyAdmin = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(adminAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的的地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setAdminLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "setSadmin",
        args: [adminAddress],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setAdminLoading(false);
      setAdminAddress("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setAdminLoading(false);
      console.error(error);
    }
  };

  const handleModifyMintAddress = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(mintAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的的地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setMintLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "setPlatformWallet",
        args: [mintAddress],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setMintLoading(false);
      setMintAddress("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setMintLoading(false);
      console.error(error);
    }
  };

  const handleChangeActiveAndGasFee = async () => {
    if (PLATFORM_FEE_USD === "" || SELLER_INCOME_USD === "") {
      Toast.show({
        content: "正在读取链上数据，请稍后再尝试",
        position: "center",
      });
      return;
    }

    if (+activeAndGasFee === 0 || activeAndGasFee === "") {
      Toast.show({
        content: "燃料费、提现费不能为0",
        position: "center",
      });
      return;
    }
    try {
      setFeeLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "setChildMachineTradeConfig",
        args: [PLATFORM_FEE_USD, SELLER_INCOME_USD, activeAndGasFee],
        gas: 600000n, // 复杂操作：修改多个参数，提高到 600000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setFeeLoading(false);
      setActiveAndGasFee("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setFeeLoading(false);
      console.error(error);
    }
  };

  const queryActiveAndGasFee = async () => {
    try {
      const contracts = [
        {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "PLATFORM_FEE_USD",
          args: [],
        },
        {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "SELLER_INCOME_USD",
          args: [],
        },
      ] as any;

      const res = await multicall(config, {
        contracts,
      });

      setPLATFORM_FEE_USD(String(res[0]?.result || ""));
      setSELLER_INCOME_USD(String(res[1]?.result || ""));
    } catch (error) {
      console.error(error);
    }
  };

  // 查询当前算力上限
  const queryPowerLimits = async () => {
    try {
      const contracts = [
        {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "promotionPowerLimit",
          args: [],
        },
        {
          address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
          abi: MiningMachineSystemLogicExtendABI,
          functionName: "activatedPowerLimit",
          args: [],
        },
      ];

      const res = await multicall(config, {
        contracts,
      });

      setPromotionPowerLimit(String(res[0].result));
      setActivatedPowerLimit(String(res[1].result));
    } catch (error) {
      console.error(error);
    }
  };

  // 设置推广算力上限
  const handleSetPromotionPowerLimit = async () => {
    if (promotionPowerLimit === "" || +promotionPowerLimit === 0) {
      Toast.show({
        content: "推广算力上限不能为空或0",
        position: "center",
      });
      return;
    }

    try {
      setPromotionPowerLimitLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "setPromotionPowerLimit",
        args: [BigInt(promotionPowerLimit)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "设置成功!",
        position: "center",
      });
      setPromotionPowerLimitLoading(false);
      setPromotionPowerLimit("");
      // 重新查询当前值
      queryPowerLimits();
    } catch (error) {
      Toast.show({
        content: "设置失败",
        position: "center",
      });
      setPromotionPowerLimitLoading(false);
      console.error(error);
    }
  };

  // 设置激活算力上限
  const handleSetActivatedPowerLimit = async () => {
    if (activatedPowerLimit === "" || +activatedPowerLimit === 0) {
      Toast.show({
        content: "激活算力上限不能为空或0",
        position: "center",
      });
      return;
    }

    try {
      setActivatedPowerLimitLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "setActivatedPowerLimit",
        args: [BigInt(activatedPowerLimit)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "设置成功!",
        position: "center",
      });
      setActivatedPowerLimitLoading(false);
      setActivatedPowerLimit("");
      // 重新查询当前值
      queryPowerLimits();
    } catch (error) {
      Toast.show({
        content: "设置失败",
        position: "center",
      });
      setActivatedPowerLimitLoading(false);
      console.error(error);
    }
  };

  // ===== MIX 操作函数 =====

  // 查询操作员 MIX 余额和 BNB 余额
  const fetchOperatorMixBalance = async () => {
    try {
      setIsLoadingOperatorBalance(true);

      // 查询 MIX 余额
      const mixBalance = await readContract(config, {
        address: MiningMachineNodeSystemAddress as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "getUserMixBalance",
        args: [chainConfig.MIX_OPERATOR_ADDRESS as `0x${string}`],
      });

      const formattedMixBalance = formatEther(mixBalance);
      setOperatorMixBalance(formattedMixBalance);

      // 查询 BNB 余额
      const bnbBalance = await getBalance(config, {
        address: chainConfig.MIX_OPERATOR_ADDRESS as `0x${string}`,
      });

      const formattedBnbBalance = formatEther(bnbBalance.value);
      setOperatorBnbBalance(formattedBnbBalance);
    } catch (error) {
      console.error("获取操作员余额失败:", error);
      Toast.show({
        content: "获取操作员余额失败",
        position: "center",
      });
    } finally {
      setIsLoadingOperatorBalance(false);
    }
  };

  // 给操作员添加 MIX
  const handleAddMixForOperator = async () => {
    if (!addMixForOperatorAmount || +addMixForOperatorAmount <= 0) {
      Toast.show({
        content: "请输入有效的 MIX 数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsAddingMixForOperator(true);
      const hash = await writeContractAsync({
        address: MiningMachineNodeSystemAddress as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "addMixForOperator",
        args: [parseEther(addMixForOperatorAmount)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "成功添加 MIX",
        position: "center",
      });
      setAddMixForOperatorAmount("");
      // 刷新操作员余额
      fetchOperatorMixBalance();
    } catch (error) {
      Toast.show({
        content: "添加 MIX 失败",
        position: "center",
      });
      console.error("Add MIX for operator failed:", error);
    } finally {
      setIsAddingMixForOperator(false);
    }
  };

  // 从操作员减少 MIX
  const handleSubMixForOperator = async () => {
    if (!subMixForOperatorAmount || +subMixForOperatorAmount <= 0) {
      Toast.show({
        content: "请输入有效的 MIX 数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsSubtractingMixForOperator(true);
      const hash = await writeContractAsync({
        address: MiningMachineNodeSystemAddress as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "subMixForOperator",
        args: [parseEther(subMixForOperatorAmount)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "成功减少 MIX",
        position: "center",
      });
      setSubMixForOperatorAmount("");
      // 刷新操作员余额
      fetchOperatorMixBalance();
    } catch (error) {
      Toast.show({
        content: "减少 MIX 失败",
        position: "center",
      });
      console.error("Subtract MIX for operator failed:", error);
    } finally {
      setIsSubtractingMixForOperator(false);
    }
  };

  // 转移 MIX（使用 transferMixBetweenUsers 函数，在用户之间转移）
  const handleTransferMix = async () => {
    // 验证 from 地址
    const isFromValid = validateAddressFnMap?.["EVM"]?.(transferMixFromAddress);
    if (!isFromValid) {
      Toast.show({
        content: "请输入合法的源地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 验证 to 地址
    const isToValid = validateAddressFnMap?.["EVM"]?.(transferMixToAddress);
    if (!isToValid) {
      Toast.show({
        content: "请输入合法的接收地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 验证数量
    if (!transferMixAmount || +transferMixAmount <= 0) {
      Toast.show({
        content: "请输入有效的 MIX 数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsTransferringMix(true);
      const hash = await writeContractAsync({
        address: MiningMachineNodeSystemAddress as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "transferMixBetweenUsers",
        args: [
          getAddress(transferMixFromAddress),
          getAddress(transferMixToAddress),
          parseEther(transferMixAmount),
        ],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "成功转移 MIX",
        position: "center",
      });
      setTransferMixFromAddress("");
      setTransferMixToAddress("");
      setTransferMixAmount("");
      setUseCurrentAccount(false);
      setUseOperatorAddress(false);
    } catch (error) {
      Toast.show({
        content: "转移 MIX 失败",
        position: "center",
      });
      console.error("Transfer MIX failed:", error);
    } finally {
      setIsTransferringMix(false);
    }
  };

  // ===== LogicExtend 升级相关函数 =====

  // 查询激活奖励开关状态
  const fetchActiveMachineRewardsEnabled = async () => {
    try {
      setIsLoadingRewardsEnabled(true);
      const enabled = await readContract(config, {
        address: MiningMachineSystemLogicExtendAddress,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "activeMachineRewardsEnabled",
        args: [],
      });
      setActiveMachineRewardsEnabled(enabled as boolean);
    } catch (error) {
      console.error("获取激活奖励开关状态失败:", error);
      Toast.show({
        content: "获取激活奖励开关状态失败",
        position: "center",
      });
    } finally {
      setIsLoadingRewardsEnabled(false);
    }
  };

  // 设置激活奖励开关
  const handleSetActiveMachineRewardsEnabled = async (enabled: boolean) => {
    try {
      setIsSettingRewardsEnabled(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "setActiveMachineRewardsEnabled",
        args: [enabled],
        gas: 400000n,
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: enabled ? "已开启激活奖励" : "已关闭激活奖励",
        position: "center",
      });
      // 刷新状态
      fetchActiveMachineRewardsEnabled();
    } catch (error) {
      Toast.show({
        content: "设置失败",
        position: "center",
      });
      console.error("设置激活奖励开关失败:", error);
    } finally {
      setIsSettingRewardsEnabled(false);
    }
  };

  // 步骤 2: 授权 StorageExtend
  const handleAuthorizeStorageExtend = async () => {
    try {
      setIsAuthorizingStorageExtend(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageExtendAddress,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "setAuthorizedCaller",
        args: [MiningMachineSystemLogicExtendAddress, true],
        gas: 400000n,
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "授权成功",
        position: "center",
      });
    } catch (error) {
      Toast.show({
        content: "授权失败",
        position: "center",
      });
      console.error("授权 StorageExtend 失败:", error);
    } finally {
      setIsAuthorizingStorageExtend(false);
    }
  };

  // 步骤 3: 授权 HistoryExtend
  const handleAuthorizeHistoryExtend = async () => {
    try {
      setIsAuthorizingHistoryExtend(true);
      const hash = await writeContractAsync({
        address: chainConfig.EXTEND_HISTORY_ADDRESS as `0x${string}`,
        abi: MiningMachineHistoryExtendABI,
        functionName: "setAuthorizedCaller",
        args: [MiningMachineSystemLogicExtendAddress, true],
        gas: 400000n,
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "授权成功",
        position: "center",
      });
    } catch (error) {
      Toast.show({
        content: "授权失败",
        position: "center",
      });
      console.error("授权 HistoryExtend 失败:", error);
    } finally {
      setIsAuthorizingHistoryExtend(false);
    }
  };

  // 步骤 1: 更新 Logic 地址（原步骤3，现在是步骤1）
  const handleUpdateLogicAddress = async () => {
    try {
      setIsUpdatingLogicAddress(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "setExtendLogic",
        args: [MiningMachineSystemLogicExtendAddress],
        gas: 400000n,
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "更新成功",
        position: "center",
      });
    } catch (error) {
      Toast.show({
        content: "更新失败",
        position: "center",
      });
      console.error("更新 Logic 地址失败:", error);
    } finally {
      setIsUpdatingLogicAddress(false);
    }
  };

  // 查询旧合约 IDX 余额
  const fetchOldLogicExtendIdxBalance = async () => {
    try {
      setIsLoadingOldIdxBalance(true);
      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [OLD_LOGIC_EXTEND_ADDRESS],
      });
      const formattedBalance = formatEther(balance);
      setOldLogicExtendIdxBalance(formattedBalance);
    } catch (error) {
      console.error("获取旧合约 IDX 余额失败:", error);
      Toast.show({
        content: "获取旧合约 IDX 余额失败",
        position: "center",
      });
    } finally {
      setIsLoadingOldIdxBalance(false);
    }
  };

  // 查询管理员地址 IDX 余额
  const fetchAdminIdxBalance = async () => {
    if (!currentWalletAddress) return;

    try {
      setIsLoadingAdminIdxBalance(true);
      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [currentWalletAddress],
      });
      const formattedBalance = formatEther(balance);
      setAdminIdxBalance(formattedBalance);
    } catch (error) {
      console.error("获取管理员 IDX 余额失败:", error);
      Toast.show({
        content: "获取管理员 IDX 余额失败",
        position: "center",
      });
    } finally {
      setIsLoadingAdminIdxBalance(false);
    }
  };

  // 步骤 4: 从旧合约提取 IDX 到管理员
  const handleWithdrawOldIdx = async () => {
    try {
      setIsWithdrawingOldIdx(true);

      // 先查询余额
      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [OLD_LOGIC_EXTEND_ADDRESS],
      });

      if (balance === 0n) {
        Toast.show({
          content: "旧合约无 IDX 余额",
          position: "center",
        });
        return;
      }

      // 从旧合约提取 IDX
      const hash = await writeContractAsync({
        address: OLD_LOGIC_EXTEND_ADDRESS,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "withdrawIDX",
        args: [balance],
        gas: 400000n,
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "IDX 已提取到管理员地址",
        position: "center",
      });
      // 刷新余额
      fetchOldLogicExtendIdxBalance();
      fetchAdminIdxBalance(); // 刷新管理员余额
    } catch (error) {
      Toast.show({
        content: "提取失败",
        position: "center",
      });
      console.error("提取旧合约 IDX 失败:", error);
    } finally {
      setIsWithdrawingOldIdx(false);
    }
  };

  // 步骤 5: 转移 IDX 到新合约（新增）
  const [isTransferringIdxToNew, setIsTransferringIdxToNew] = useState(false);

  // 直接从管理员地址转移所有 IDX 到新合约
  const handleTransferAllIdxToNewContract = async () => {
    try {
      if (!currentWalletAddress) {
        Toast.show({
          content: "请先连接钱包",
          position: "center",
        });
        return;
      }

      setIsTransferringIdxToNew(true);

      // 查询管理员地址的 IDX 余额
      const adminBalance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [currentWalletAddress],
      });

      if (adminBalance === 0n) {
        Toast.show({
          content: "管理员地址无 IDX 余额",
          position: "center",
          duration: 3000,
        });
        return;
      }

      // 从管理员地址转账所有 IDX 到新 LogicExtend 合约
      const hash = await writeContractAsync({
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [MiningMachineSystemLogicExtendAddress, adminBalance],
        gas: 400000n,
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });

      const formattedAmount = formatEther(adminBalance);
      Toast.show({
        content: `成功转移 ${formattedAmount} IDX 到新合约`,
        position: "center",
        duration: 3000,
      });

      // 刷新余额
      fetchRewardPoolBalance();
      fetchAdminIdxBalance();
    } catch (error) {
      console.error("转移 IDX 失败:", error);

      let errorMsg = "转移失败";
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied")
        ) {
          errorMsg = "用户取消了交易";
        } else if (errorMessage.includes("insufficient funds")) {
          errorMsg = "BNB 余额不足，无法支付 gas 费";
        } else {
          errorMsg = `转移失败: ${error.message}`;
        }
      }

      Toast.show({
        content: errorMsg,
        position: "center",
        duration: 3000,
      });
    } finally {
      setIsTransferringIdxToNew(false);
    }
  };

  useEffect(() => {
    queryActiveAndGasFee();
    fetchRewardPoolBalance();
    fetchOperatorMixBalance();
    queryPowerLimits();
    fetchActiveMachineRewardsEnabled();
    fetchOldLogicExtendIdxBalance();
    fetchAdminIdxBalance(); // 查询管理员余额
  }, []);

  const handleChangeMachineProduct = async () => {
    if (
      motherProductInterval === "" ||
      motherLifeCycle === "" ||
      +motherLifeCycle === 0 ||
      +motherProductInterval === 0 ||
      childLifeCycle === "" ||
      childProductInterval === "" ||
      +childLifeCycle === 0 ||
      +childProductInterval === 0
    ) {
      Toast.show({
        content: "母矿机生命周期、生产间隔，子矿机生命周期、生产间隔不能为0",
        position: "center",
      });
      return;
    }

    try {
      setMotherLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "setMachineParams",
        args: [
          +motherProductInterval * 60 * 24,
          +motherLifeCycle * 60 * 24,
          +childProductInterval * 60 * 24,
          parseEther(childProductInterval), // 4* 1e18
        ],
        gas: 600000n, // 复杂操作：修改多个矿机参数，提高到 600000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setMotherLoading(false);
      setMotherLifeCycle("");
      setMoterhProductInterval("");
      setChildLifeCycle("");
      setChildProductInterval("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setMotherLoading(false);
      console.error(error);
    }
  };

  const { writeContractAsync } = useWriteContract();

  const handleChangeAddress = async (
    type: "idx" | "usdt" | "pancake" | "pair",
    address: string,
  ) => {
    const addressMap = {
      idx: "setIdxToken",
      usdt: "setUsdtToken",
      pancake: "setPancakeRouter",
      pair: "setIdxUsdtPair",
    } as const;

    try {
      if (type === "idx") {
        setIdxLoading(true);
      } else if (type === "usdt") {
        setUsdtLoading(true);
      } else if (type === "pancake") {
        setPancakeLoading(true);
      } else if (type === "pair") {
        setIdxUsdtPairLoading(true);
      }

      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: addressMap[type],
        args: [getAddress(address)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });

      if (type === "idx") {
        setIdxLoading(false);
        setIdxTokenAddress("");
      } else if (type === "usdt") {
        setUsdtLoading(false);
        setusdtTokenAddress("");
      } else if (type === "pancake") {
        setPancakeLoading(false);
        setPancakeRouterAddress("");
      } else if (type === "pair") {
        setIdxUsdtPairLoading(false);
        setIdxUsdtPairAddress("");
      }
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      if (type === "idx") {
        setIdxLoading(true);
      } else if (type === "usdt") {
        setUsdtLoading(true);
      } else if (type === "pancake") {
        setPancakeLoading(true);
      } else if (type === "pair") {
        setIdxUsdtPairLoading(true);
      }
      console.error(error);
    }
  };

  const handleModifyAddress = (receiveAddress: string, text: string) => {
    const isValid = validateAddressFnMap?.["EVM"]?.(receiveAddress);

    if (!isValid) {
      Toast.show({
        content: (
          <div className="text-[13px]">请输入合法的{text}代币合约地址</div>
        ),
        position: "center",
        duration: 2000,
      });
      return;
    }

    switch (text) {
      case "IDX":
        handleChangeAddress("idx", receiveAddress);
        break;
      case "USDT":
        handleChangeAddress("usdt", receiveAddress);
        break;
      case "PancakeRouter":
        handleChangeAddress("pancake", receiveAddress);
        break;
      case "IDX与USDT交易对":
        handleChangeAddress("pair", receiveAddress);
        break;

      default:
        break;
    }
  };

  const hadnleSetLockReleaseParams = async () => {
    if (+lockDuration === 0 || lockDuration === "") {
      Toast.show({
        content: "提现锁定周期不能为0",
        position: "center",
      });
      return;
    }
    if (+releaseDuration === 0 || releaseDuration === "") {
      Toast.show({
        content: "释放总周期不能为0",
        position: "center",
      });
      return;
    }
    if (+releaseIntervalMinutes === 0 || releaseIntervalMinutes === "") {
      Toast.show({
        content: "释放间隔不能为0",
        position: "center",
      });
      return;
    }
    try {
      setWithdrawalLoading(true);

      const hash = await writeContractAsync({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "setLockReleaseParams",
        args: [
          BigInt(lockDuration) * 24n * 60n * 60n,
          BigInt(releaseDuration) * 24n * 60n * 60n,
          BigInt(releaseIntervalMinutes) * 1440n,
        ],
        gas: 600000n, // 复杂操作：设置多个锁定释放参数，提高到 600000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setWithdrawalLoading(false);
      setLockDuration("");
      setReleaseDuration("");
      setReleaseIntervalMinutes("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setWithdrawalLoading(false);
      console.error(error);
    }
  };

  const handleChangeNodeCount = async () => {
    if (+nodeCount === 0 || nodeCount === "") {
      Toast.show({
        content: "合成矿机的个数不能为0",
        position: "center",
        duration: 2000,
      });
      return;
    }
    try {
      setNodeLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineNodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "setNodesAmount",
        args: [BigInt(nodeCount)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });

      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setNodeLoading(false);
      setNodeCount("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setNodeLoading(false);
      console.error(error);
    }
  };

  const handleWithdrawToken = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(withdrawTokenAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的代币合约地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    if (+withdrawTokenAmount === 0 || withdrawTokenAmount === "") {
      Toast.show({
        content: "提取数量不能为0",
        position: "center",
        duration: 2000,
      });
      return;
    }
    try {
      setWithdrawTokenLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "withdrawToken",
        args: [withdrawTokenAddress, parseEther(withdrawTokenAmount)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "提取成功!",
        position: "center",
      });
      setWithdrawTokenLoading(false);
      setWithdrawTokenAddress("");
      setWithdrawTokenAmount("");
    } catch (error) {
      Toast.show({
        content: "提取失败",
        position: "center",
      });
      setWithdrawTokenLoading(false);
      console.error(error);
    }
  };

  const handleChangeMixToIdxRate = async () => {
    if (+mixCount === 0 || mixCount === "") {
      Toast.show({
        content: "MIX数量不能为0",
        position: "center",
        duration: 2000,
      });
      return;
    }
    if (+idxCount === 0 || idxCount === "") {
      Toast.show({
        content: "IDX数量不能为0",
        position: "center",
        duration: 2000,
      });
      return;
    }
    try {
      setIsChangingMixToIdxRate(true);
      const hash = await writeContractAsync({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "setSwap",
        args: [idxCount, mixCount],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setIsChangingMixToIdxRate(false);
      setIdxCount("");
      setMixCount("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setIsChangingMixToIdxRate(false);
      console.error(error);
    }
  };

  const handleModifyServiceChargeAddress = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(serviceChargeAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的接收地址",
        position: "center",
        duration: 2000,
      });
      return;
    }
    try {
      setServiceChargeAddressLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "setCommissionWallet",
        args: [serviceChargeAddress],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setServiceChargeAddressLoading(false);
      setServiceChargeAddress("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setServiceChargeAddressLoading(false);
      console.error(error);
    }
  };

  // 新增处理函数
  const handleMintChildMachines = async () => {
    // 地址验证
    const isValid = validateAddressFnMap?.["EVM"]?.(mintChildMachineAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的接收地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 数量验证（根据合约要求：count必须大于8且小于等于188）
    const count = +mintChildMachineCount;

    if (
      count <= 1 ||
      count > 100 ||
      isNaN(count) ||
      mintChildMachineCount === ""
    ) {
      Toast.show({
        content: "铸造数量必须在1-100之间",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsMintingChildMachine(true);
      // 调用合约接口，使用 MiningMachineProductionLogic 对应的地址和 ABI
      const hash = await writeContractAsync({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "sadminMintChildMachines",
        args: [mintChildMachineAddress, count],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "子矿机铸造成功!",
        position: "center",
      });
      setMintChildMachineAddress("");
      setMintChildMachineCount("");
    } catch (error) {
      Toast.show({
        content: "子矿机铸造失败",
        position: "center",
      });
      console.error("Minting child machine failed:", error);
    } finally {
      setIsMintingChildMachine(false);
    }
  };

  // 挂售账号处理函数
  const handleSetSellUser = async () => {
    // 地址验证
    const isValid = validateAddressFnMap?.["EVM"]?.(sellUserAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的账号地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsSettingSellUser(true);
      // 调用合约接口
      const hash = await writeContractAsync({
        address: MiningMachineSelluserManagerAddress,
        abi: SelluserManagerABI,
        functionName: "setSelluser",
        args: [sellUserAddress, sellUserStatus],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: `已${sellUserStatus ? "开启" : "关闭"}该账号挂售权限`,
        position: "center",
      });
      setSellUserAddress("");
      setSellUserStatus(true); // 重置为默认状态
    } catch (error) {
      Toast.show({
        content: "操作失败",
        position: "center",
      });
      console.error("Set sell user failed:", error);
    } finally {
      setIsSettingSellUser(false);
    }
  };

  // 授权空投IDX处理函数
  const handleAddAirdropper = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(airdropperAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setAirdropperLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "addAirdropper",
        args: [airdropperAddress, true],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "授权空投IDX成功",
        position: "center",
      });
      setAirdropperAddress("");
    } catch (error) {
      Toast.show({
        content: "授权失败",
        position: "center",
      });
      console.error("Add airdropper failed:", error);
    } finally {
      setAirdropperLoading(false);
    }
  };

  // 授权铸造子矿机处理函数
  const handleAddMachineTransfer = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(machineTransferAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setMachineTransferLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "addmachineTransfer",
        args: [machineTransferAddress, true],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "授权铸造子矿机成功",
        position: "center",
      });
      setMachineTransferAddress("");
    } catch (error) {
      Toast.show({
        content: "授权失败",
        position: "center",
      });
      console.error("Add machine transfer failed:", error);
    } finally {
      setMachineTransferLoading(false);
    }
  };

  // 授权标记工作室处理函数
  const handleAddStudioMarker = async () => {
    const isValid = validateAddressFnMap?.["EVM"]?.(studioMarkerAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setStudioMarkerLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemStorageExtendAddress as `0x${string}`,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "addStudioMarker",
        args: [studioMarkerAddress, true],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });
      Toast.show({
        content: "授权标记工作室成功",
        position: "center",
      });
      setStudioMarkerAddress("");
    } catch (error) {
      Toast.show({
        content: "授权失败",
        position: "center",
      });
      console.error("Add studio marker failed:", error);
    } finally {
      setStudioMarkerLoading(false);
    }
  };

  // 往奖励池增加IDX处理函数
  const handleAddIdxToRewardPool = async () => {
    if (!addIdxAmount || +addIdxAmount <= 0) {
      Toast.show({
        content: "请输入有效的IDX数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsAddingIdx(true);

      // 调用IDX合约的transfer函数，将IDX转账到ExtendLogicAddress
      const hash = await writeContractAsync({
        address: IDX_CONTRACTS_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [MiningMachineSystemLogicExtendAddress, parseEther(addIdxAmount)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });

      Toast.show({
        content: "成功往奖励池增加IDX",
        position: "center",
      });
      setAddIdxAmount("");
      // 增加成功后刷新奖励池余额
      fetchRewardPoolBalance();
    } catch (error) {
      Toast.show({
        content: "增加IDX失败",
        position: "center",
      });
      console.error("Add IDX to reward pool failed:", error);
    } finally {
      setIsAddingIdx(false);
    }
  };

  // 从奖励池提取IDX处理函数
  const handleWithdrawIdxFromRewardPool = async () => {
    if (!withdrawIdxAmount || +withdrawIdxAmount <= 0) {
      Toast.show({
        content: "请输入有效的IDX数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    try {
      setIsWithdrawingIdx(true);

      // 调用ExtendLogicAddress的withdrawIDX函数
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress as `0x${string}`,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "withdrawIDX",
        args: [parseEther(withdrawIdxAmount)],
        gas: 400000n, // 管理员操作：统一提高到 400000
        chainId: walletChainId,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId: walletChainId,
      });

      Toast.show({
        content: "成功从奖励池提取IDX",
        position: "center",
      });
      setWithdrawIdxAmount("");
      // 提取成功后刷新奖励池余额
      fetchRewardPoolBalance();
    } catch (error) {
      Toast.show({
        content: "提取IDX失败",
        position: "center",
      });
      console.error("Withdraw IDX from reward pool failed:", error);
    } finally {
      setIsWithdrawingIdx(false);
    }
  };

  // 获取奖励池余额
  const fetchRewardPoolBalance = async () => {
    try {
      setIsLoadingRewardPool(true);
      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [MiningMachineSystemLogicExtendAddress],
      });

      const formattedBalance = formatEther(balance);
      setRewardPoolBalance(formattedBalance);
    } catch (error) {
      console.error("获取奖励池余额失败:", error);
      Toast.show({
        content: "获取奖励池余额失败",
        position: "center",
      });
    } finally {
      setIsLoadingRewardPool(false);
    }
  };

  // 提取全部奖励池余额
  const handleWithdrawAllRewardPool = () => {
    setWithdrawIdxAmount(rewardPoolBalance);
  };

  return (
    <>
      {/* 1. 密码弹窗 */}
      <Dialog
        visible={visible}
        closeOnMaskClick={false}
        content={
          <div className="flex flex-col gap-3 pt-2">
            <span className="font-bold text-center">验证码</span>
            <Input
              placeholder="验证码："
              type="password"
              value={inputPwd}
              onChange={setInputPwd}
              className="!bg-[#f3f3f3] rounded-2xl px-3 py-2"
            />
            <Button
              block // 保持宽高自适应父容器（原有属性）
              color="default" // 先将内置主题色改为默认
              onClick={handleLogin} // 保持原有点击事件
              className="!rounded-2xl !bg-black !text-white !border-none !hover:bg-gray-800"
            >
              确认
            </Button>
          </div>
        }
      />

      {/* 2. 校验通过后渲染原页面 */}
      {passed && (
        <div className="h-full overflow-scroll px-[1.3125rem] mt-2 pb-4">
          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">手动铸造子矿机</h2>

            <TextArea
              placeholder="输入接收地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center mb-2"
              value={mintChildMachineAddress}
              onChange={(val) => setMintChildMachineAddress(val)}
            />
            <Input
              placeholder="输入铸造数量(0-100)"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={mintChildMachineCount}
              type="number"
              onChange={(val) => setMintChildMachineCount(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isMintingChildMachine}
              onClick={handleMintChildMachines}
            >
              铸造子矿机
            </Button>
          </div>

          {/* 挂售账号管理卡片 */}
          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">挂售账号管理</h2>
            <TextArea
              placeholder="输入账号地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center mb-2"
              value={sellUserAddress}
              onChange={(val) => setSellUserAddress(val)}
            />
            <div className="flex items-center mb-2">
              <span className="text-[13px] mr-2">状态：</span>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button
                  className={`px-3 py-1 text-[13px] transition-colors ${
                    sellUserStatus
                      ? "bg-black text-white"
                      : "bg-[#f3f3f3] text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSellUserStatus(true)}
                  disabled={sellUserStatus}
                >
                  开启挂售权限
                </button>
                <button
                  className={`px-3 py-1 text-[13px] transition-colors ${
                    !sellUserStatus
                      ? "bg-black text-white"
                      : "bg-[#f3f3f3] text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSellUserStatus(false)}
                  disabled={!sellUserStatus}
                >
                  关闭挂售权限
                </button>
              </div>
            </div>
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isSettingSellUser}
              onClick={handleSetSellUser}
            >
              确认设置
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">铸造矿机的权限</h2>
            <TextArea
              placeholder="输入目标地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={mintAddress}
              onChange={(val) => setMintAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={mintLoading}
              onClick={handleModifyMintAddress}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">更改管理员</h2>
            <TextArea
              placeholder="输入目标地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={adminAddress}
              onChange={(val) => setAdminAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={adminLoading}
              onClick={handleModifyAdmin}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">手续费接收地址</h2>
            <TextArea
              placeholder="输入目标地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={serviceChargeAddress}
              onChange={(val) => setServiceChargeAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={serviceChargeAddressLoading}
              onClick={handleModifyServiceChargeAddress}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">提取代币</h2>
            <TextArea
              placeholder="输入代币地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={withdrawTokenAddress}
              onChange={(val) => setWithdrawTokenAddress(val)}
            />
            <Input
              placeholder="输入提取数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={withdrawTokenAmount}
              type="number"
              onChange={(val) => setWithdrawTokenAmount(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={withdrawTokenLoading}
              onClick={handleWithdrawToken}
            >
              提取
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">IDX合约地址设置</h2>
            <TextArea
              placeholder="输入IDX代币合约地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={idxTokenAddress}
              onChange={(val) => setIdxTokenAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={idxLoading}
              onClick={() => handleModifyAddress(idxTokenAddress, "IDX")}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">USDT合约地址设置</h2>
            <TextArea
              placeholder="输入USDT代币合约地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={usdtTokenAddress}
              onChange={(val) => setusdtTokenAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={usdtLoading}
              onClick={() => handleModifyAddress(usdtTokenAddress, "USDT")}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">PancakeRouter合约地址设置</h2>
            <TextArea
              placeholder="输入PancakeRouter代币合约地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={pancakeRouterAddress}
              onChange={(val) => setPancakeRouterAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={pancakeLoading}
              onClick={() =>
                handleModifyAddress(pancakeRouterAddress, "PancakeRouter")
              }
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">IDX与USDT交易对地址设置</h2>
            <TextArea
              placeholder="输入IDX与USDT交易对地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={idxUsdtPairAddress}
              onChange={(val) => setIdxUsdtPairAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={idxUsdtPairLoading}
              onClick={() =>
                handleModifyAddress(idxUsdtPairAddress, "IDX与USDT交易对")
              }
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col justify-between">
            <h2 className="mb-2 font-bold">矿机设置</h2>
            <span className="text-[12px]">规则：</span>
            <div className="text-[12px]">
              <div>母矿机产矿数量 = 总生命周期（天）/ 生产间隔（天）</div>
            </div>
            <Input
              placeholder="总生命周期（天）"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-1 !flex !items-center !justify-center mb-2"
              value={motherLifeCycle}
              type="number"
              onChange={(val) => setMotherLifeCycle(val)}
            />
            <Input
              placeholder="生产间隔（天）"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-1 !flex !items-center !justify-center"
              value={motherProductInterval}
              type="number"
              onChange={(val) => setMoterhProductInterval(val)}
            />
            <span className="text-[12px]">规则：</span>

            <div className="text-[12px]">
              子矿机产MIX量 = 总生命周期（天）/ 生产MiX数（天）
            </div>
            <Input
              placeholder="总生命周期（天）"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-1 !flex !items-center !justify-center mb-2"
              value={childLifeCycle}
              type="number"
              onChange={(val) => setChildLifeCycle(val)}
            />
            <Input
              placeholder="生产MiX个数（天）"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-1 !flex !items-center !justify-center"
              value={childProductInterval}
              type="number"
              onChange={(val) => setChildProductInterval(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={motherLoading}
              onClick={() => handleChangeMachineProduct()}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">提现设置</h2>
            <Input
              placeholder="提现锁定周期"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={lockDuration}
              type="number"
              onChange={(val) => setLockDuration(val)}
            />
            <Input
              placeholder="释放总周期"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={releaseDuration}
              type="number"
              onChange={(val) => setReleaseDuration(val)}
            />
            <Input
              placeholder="释放间隔"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={releaseIntervalMinutes}
              type="number"
              onChange={(val) => setReleaseIntervalMinutes(val)}
            />

            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={withdrawalLoading}
              onClick={hadnleSetLockReleaseParams}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">节点设置</h2>
            <Input
              placeholder="合成小节点的矿机个数"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={nodeCount}
              type="number"
              onChange={(val) => setNodeCount(val)}
            />

            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={nodeLoading}
              onClick={handleChangeNodeCount}
            >
              修改
            </Button>
          </div>

          {/* <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
        <h2 className="mb-2 font-bold">授权地址空投IDX权限</h2>
        <TextArea
          placeholder="输入要授权的地址"
          style={{
            '--font-size': '13px'
          }}
          className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
          value={airdropperOfIdx}
          onChange={(val) => setAirdropperOfIdx(val)}

        />
        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
          style={{
            fontSize: '13px'
          }}
          loading={idxUsdtPairLoading}
          onClick={() =>
            handleModifyAddress(idxUsdtPairAddress, 'IDX与USDT交易对')
          }
        >
          修改
        </Button>
      </div> */}

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">MIX兑换IDX设置</h2>
            <Input
              placeholder="MIX数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={mixCount}
              type="number"
              onChange={(val) => setMixCount(val)}
            />
            <Input
              placeholder="IDX数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={idxCount}
              type="number"
              onChange={(val) => setIdxCount(val)}
            />

            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isChangingMixToIdxRate}
              onClick={handleChangeMixToIdxRate}
            >
              修改
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">授权空投IDX</h2>
            <TextArea
              placeholder="输入要授权的地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={airdropperAddress}
              onChange={(val) => setAirdropperAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={airdropperLoading}
              onClick={handleAddAirdropper}
            >
              授权
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">授权铸造子矿机</h2>
            <TextArea
              placeholder="输入要授权的地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={machineTransferAddress}
              onChange={(val) => setMachineTransferAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={machineTransferLoading}
              onClick={handleAddMachineTransfer}
            >
              授权
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">授权标记工作室</h2>
            <TextArea
              placeholder="输入要授权的地址"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 pt-2 !flex !items-center !justify-center"
              value={studioMarkerAddress}
              onChange={(val) => setStudioMarkerAddress(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={studioMarkerLoading}
              onClick={handleAddStudioMarker}
            >
              授权
            </Button>
          </div>

          {/* 奖励池管理功能 */}
          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">往奖励池增加IDX</h2>
            <Input
              placeholder="输入IDX数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={addIdxAmount}
              type="number"
              onChange={(val) => setAddIdxAmount(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isAddingIdx}
              onClick={handleAddIdxToRewardPool}
            >
              增加IDX到奖励池
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">从奖励池提取IDX</h2>

            {/* 显示奖励池余额 */}
            <div className="mb-2 p-2 bg-[#f3f3f3] rounded-xl">
              <div className="text-[12px] text-gray-600 mb-1">
                当前奖励池余额:
              </div>
              <div className="text-[14px] font-bold text-[#895EFE]">
                {isLoadingRewardPool ? (
                  <div className="animate-pulse">加载中...</div>
                ) : (
                  `${rewardPoolBalance} IDX`
                )}
              </div>
            </div>

            <Input
              placeholder="输入IDX数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={withdrawIdxAmount}
              type="number"
              onChange={(val) => setWithdrawIdxAmount(val)}
            />

            {/* 提取全部按钮 */}
            <Button
              className="!bg-[#895EFE] !text-white !rounded-3xl !py-1 !w-full !mb-2"
              style={{
                fontSize: "13px",
              }}
              onClick={handleWithdrawAllRewardPool}
              disabled={
                isLoadingRewardPool || parseFloat(rewardPoolBalance) <= 0
              }
            >
              提取全部余额
            </Button>

            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isWithdrawingIdx}
              onClick={handleWithdrawIdxFromRewardPool}
            >
              从奖励池提取IDX
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">算力上限设置</h2>

            {/* 显示当前算力上限值 */}
            <div className="mb-2 p-2 bg-[#f3f3f3] rounded-xl">
              <div className="text-[12px] text-gray-600 mb-1">
                当前算力上限:
              </div>
              <div className="text-[12px] mb-1">
                推广算力上限:{" "}
                <span className="font-bold text-[#895EFE]">
                  {promotionPowerLimit || "加载中..."}
                </span>
              </div>
              <div className="text-[12px]">
                激活算力上限:{" "}
                <span className="font-bold text-[#895EFE]">
                  {activatedPowerLimit || "加载中..."}
                </span>
              </div>
            </div>

            <Input
              placeholder="推广算力上限"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={promotionPowerLimit}
              type="number"
              onChange={(val) => setPromotionPowerLimit(val)}
            />

            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={promotionPowerLimitLoading}
              onClick={handleSetPromotionPowerLimit}
            >
              设置推广算力上限
            </Button>

            <Input
              placeholder="激活算力上限"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2 mt-2"
              value={activatedPowerLimit}
              type="number"
              onChange={(val) => setActivatedPowerLimit(val)}
            />

            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={activatedPowerLimitLoading}
              onClick={handleSetActivatedPowerLimit}
            >
              设置激活算力上限
            </Button>
          </div>

          {/* MIX 操作管理 */}
          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">给操作员添加 MIX</h2>

            {/* 显示操作员地址 */}
            <div className="mb-2 p-2 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-[12px] text-blue-500 mb-1">
                地址: {chainConfig.MIX_OPERATOR_ADDRESS}
              </div>
            </div>

            {/* 显示操作员 BNB 余额 */}
            <div className="mb-2 p-2 bg-[#fff3cd] rounded-xl border border-[#ffc107]">
              <div className="text-[12px] text-yellow-600 mb-1">
                BNB 余额:{" "}
                {isLoadingOperatorBalance ? (
                  <div className="animate-pulse">加载中...</div>
                ) : (
                  `${operatorBnbBalance} BNB`
                )}
              </div>
            </div>

            {/* 显示操作员 MIX 余额 */}
            <div className="mb-2 p-2 bg-[#f3f3f3] rounded-xl">
              <div className="text-[12px] text-purple-600 mb-1">
                MIX 余额:{" "}
                {isLoadingOperatorBalance ? (
                  <div className="animate-pulse">加载中...</div>
                ) : (
                  `${operatorMixBalance} MIX`
                )}
              </div>
            </div>

            <Input
              placeholder="输入 MIX 数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={addMixForOperatorAmount}
              type="number"
              onChange={(val) => setAddMixForOperatorAmount(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isAddingMixForOperator}
              onClick={handleAddMixForOperator}
            >
              添加 MIX
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">从操作员减少 MIX</h2>
            <Input
              placeholder="输入 MIX 数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={subMixForOperatorAmount}
              type="number"
              onChange={(val) => setSubMixForOperatorAmount(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isSubtractingMixForOperator}
              onClick={handleSubMixForOperator}
            >
              减少 MIX
            </Button>
          </div>

          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">转移 MIX</h2>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Checkbox
                checked={useCurrentAccount}
                onChange={(checked) => {
                  setUseCurrentAccount(checked);
                  if (checked && currentWalletAddress) {
                    setTransferMixFromAddress(currentWalletAddress);
                  } else if (!checked) {
                    setTransferMixFromAddress("");
                  }
                }}
                style={{
                  "--icon-size": "18px",
                  "--font-size": "13px",
                }}
              >
                从当前账户转移
              </Checkbox>
              <Checkbox
                checked={useOperatorAddress}
                onChange={(checked) => {
                  setUseOperatorAddress(checked);
                  if (checked) {
                    setTransferMixToAddress(chainConfig.MIX_OPERATOR_ADDRESS);
                  } else if (!checked) {
                    setTransferMixToAddress("");
                  }
                }}
                style={{
                  "--icon-size": "18px",
                  "--font-size": "13px",
                }}
              >
                给MixOperator充值
              </Checkbox>
            </div>
            <Input
              placeholder="输入源地址（从哪个地址转出）"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={transferMixFromAddress}
              onChange={(val) => setTransferMixFromAddress(val)}
              disabled={useCurrentAccount}
            />
            <Input
              placeholder="输入接收地址（转到哪个地址）"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={transferMixToAddress}
              onChange={(val) => setTransferMixToAddress(val)}
              disabled={useOperatorAddress}
            />
            <Input
              placeholder="输入 MIX 数量"
              style={{
                "--font-size": "13px",
              }}
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
              value={transferMixAmount}
              type="number"
              onChange={(val) => setTransferMixAmount(val)}
            />
            <Button
              className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
              style={{
                fontSize: "13px",
              }}
              loading={isTransferringMix}
              onClick={handleTransferMix}
            >
              转移 MIX
            </Button>
          </div>

          {/* ===== LogicExtend 升级管理 ===== */}

          {/* 激活奖励开关（放在最前面） */}
          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold">激活矿机奖励开关</h2>
            <div className="mb-2 p-2 bg-[#f3f3f3] rounded-xl">
              <div className="text-[12px] text-gray-600 mb-1">当前状态:</div>
              <div className="text-[14px] font-bold text-[#895EFE]">
                {isLoadingRewardsEnabled ? (
                  <div className="animate-pulse">加载中...</div>
                ) : activeMachineRewardsEnabled === null ? (
                  "未知"
                ) : activeMachineRewardsEnabled ? (
                  "✅ 已开启"
                ) : (
                  "❌ 已关闭"
                )}
              </div>
            </div>
            <Button
              className={`!text-white !rounded-3xl !py-1 !w-full ${
                activeMachineRewardsEnabled ? "!bg-red-600" : "!bg-green-600"
              }`}
              style={{
                fontSize: "13px",
              }}
              loading={isSettingRewardsEnabled}
              onClick={() =>
                handleSetActiveMachineRewardsEnabled(
                  !activeMachineRewardsEnabled,
                )
              }
              disabled={activeMachineRewardsEnabled === null}
            >
              {activeMachineRewardsEnabled ? "关闭奖励" : "开启奖励"}
            </Button>
          </div>

          {/* ===== LogicExtend 合约升级操作 ===== */}
          <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
            <h2 className="mb-2 font-bold text-red-600">
              LogicExtend 合约升级操作
            </h2>
            <div className="text-[11px] text-gray-500 mb-2 p-2 bg-yellow-50 rounded-xl border border-yellow-200">
              ⚠️ 警告：以下操作仅在合约升级时使用，请按顺序执行！
            </div>

            {/* 步骤 1: 更新 Logic 合约配置 */}
            <div className="mb-3 p-2 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-[13px] font-bold mb-2 text-blue-700">
                步骤 1: 更新 Logic 合约配置
              </h3>
              <div className="text-[11px] text-gray-600 mb-2">
                当前新 LogicExtend 地址:{" "}
                <span className="font-mono text-[10px]">
                  {MiningMachineSystemLogicExtendAddress}
                </span>
              </div>
              <Button
                className="!bg-blue-600 !text-white !rounded-3xl !py-1 !w-full"
                style={{ fontSize: "13px" }}
                loading={isUpdatingLogicAddress}
                onClick={handleUpdateLogicAddress}
              >
                执行步骤 1: setExtendLogic
              </Button>
            </div>

            {/* 步骤 2: 授权 StorageExtend */}
            <div className="mb-3 p-2 bg-green-50 rounded-xl border border-green-200">
              <h3 className="text-[13px] font-bold mb-2 text-green-700">
                步骤 2: 授权 StorageExtend
              </h3>
              <div className="text-[11px] text-gray-600 mb-2">
                授权新 LogicExtend 访问 StorageExtend
              </div>
              <Button
                className="!bg-green-600 !text-white !rounded-3xl !py-1 !w-full"
                style={{ fontSize: "13px" }}
                loading={isAuthorizingStorageExtend}
                onClick={handleAuthorizeStorageExtend}
              >
                执行步骤 2: 授权 StorageExtend
              </Button>
            </div>

            {/* 步骤 3: 授权 HistoryExtend */}
            <div className="mb-3 p-2 bg-purple-50 rounded-xl border border-purple-200">
              <h3 className="text-[13px] font-bold mb-2 text-purple-700">
                步骤 3: 授权 HistoryExtend
              </h3>
              <div className="text-[11px] text-gray-600 mb-2">
                授权新 LogicExtend 访问 HistoryExtend
              </div>
              <Button
                className="!bg-purple-600 !text-white !rounded-3xl !py-1 !w-full"
                style={{ fontSize: "13px" }}
                loading={isAuthorizingHistoryExtend}
                onClick={handleAuthorizeHistoryExtend}
              >
                执行步骤 3: 授权 HistoryExtend
              </Button>
            </div>

            {/* 步骤 4: 从旧合约提取 IDX */}
            <div className="mb-3 p-2 bg-orange-50 rounded-xl border border-orange-200">
              <h3 className="text-[13px] font-bold mb-2 text-orange-700">
                步骤 4: 从旧合约提取 IDX
              </h3>
              <div className="text-[11px] text-gray-600 mb-2">
                旧 LogicExtend 地址:{" "}
                <span className="font-mono text-[10px]">
                  {OLD_LOGIC_EXTEND_ADDRESS}
                </span>
              </div>
              <div className="mb-2 p-2 bg-white rounded-xl">
                <div className="text-[12px] text-gray-600 mb-1">
                  旧合约 IDX 余额:
                </div>
                <div className="text-[14px] font-bold text-orange-600">
                  {isLoadingOldIdxBalance ? (
                    <div className="animate-pulse">加载中...</div>
                  ) : (
                    `${oldLogicExtendIdxBalance} IDX`
                  )}
                </div>
              </div>
              <Button
                className="!bg-orange-600 !text-white !rounded-3xl !py-1 !w-full"
                style={{ fontSize: "13px" }}
                loading={isWithdrawingOldIdx}
                onClick={handleWithdrawOldIdx}
              >
                执行步骤 4: 提取旧合约 IDX
              </Button>
            </div>

            {/* 步骤 5: 转移 IDX 到新合约 */}
            <div className="mb-3 p-2 bg-pink-50 rounded-xl border border-pink-200">
              <h3 className="text-[13px] font-bold mb-2 text-pink-700">
                步骤 5: 转移 IDX 到新合约
              </h3>
              <div className="text-[11px] text-gray-600 mb-2">
                从管理员地址转移所有 IDX 到新 LogicExtend 合约
              </div>
              <div className="mb-2 p-2 bg-white rounded-xl">
                <div className="text-[12px] text-gray-600 mb-1">
                  管理员 IDX 余额:
                </div>
                <div className="text-[14px] font-bold text-pink-600">
                  {isLoadingAdminIdxBalance ? (
                    <div className="animate-pulse">加载中...</div>
                  ) : (
                    `${adminIdxBalance} IDX`
                  )}
                </div>
              </div>
              <Button
                className="!bg-pink-600 !text-white !rounded-3xl !py-1 !w-full"
                style={{ fontSize: "13px" }}
                loading={isTransferringIdxToNew}
                onClick={handleTransferAllIdxToNewContract}
              >
                执行步骤 5: 转移 IDX 到新合约
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Setting;
