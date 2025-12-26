import { useState } from "react";
import { Button, Toast } from "antd-mobile";
import { useWriteContract, useConfig, useAccount } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { getAddress } from "viem";
import {
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageExtendABI,
  MiningMachineHistoryExtendABI,
  MiningMachineSystemLogicExtendABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";

/**
 * 统一升级合约组件
 *
 * 升级场景：重新部署了 NodeSystem 和 LogicExtend 合约
 *
 * 需要执行的操作：
 * 1. Storage.setLogicAddress() - 更新 NodeSystem 地址
 * 2. SystemLogic.setExtendLogic() - 更新 LogicExtend 地址
 * 3. StorageExtend.setAuthorizedCaller() - 授权新的 LogicExtend
 * 4. HistoryExtend.setAuthorizedCaller() - 授权新的 LogicExtend
 * 5. LogicExtend.setAuthorizedCaller() - 授权 SystemLogic 访问 LogicExtend
 */
export default function UpgradeContracts() {
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig(); // 使用 useConfig hook
  const { chain } = useAccount(); // 获取当前链信息
  const chainConfig = useChainConfig();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // 使用动态地址
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineNodeSystemAddress =
    chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageExtendAddress =
    chainConfig.EXTEND_STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicExtendAddress =
    chainConfig.EXTEND_LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineHistoryExtendAddress =
    chainConfig.EXTEND_HISTORY_ADDRESS as `0x${string}`;

  const steps = [
    {
      name: "更新 NodeSystem 地址",
      description: "在 Storage 合约中更新 NodeSystem 合约地址",
      contract: "MiningMachineSystemStorage",
      function: "setLogicAddress",
      reason: "重新部署 NodeSystem 后，需要让 Storage 合约知道新的地址",
    },
    {
      name: "更新 LogicExtend 地址",
      description: "在 SystemLogic 合约中更新 LogicExtend 合约地址",
      contract: "MiningMachineSystemLogic",
      function: "setExtendLogic",
      reason: "重新部署 LogicExtend 后，需要让 SystemLogic 合约知道新的地址",
    },
    {
      name: "授权 StorageExtend",
      description: "授权新的 LogicExtend 合约访问 StorageExtend",
      contract: "MiningMachineSystemStorageExtend",
      function: "setAuthorizedCaller",
      reason: "新的 LogicExtend 合约需要权限才能读写 StorageExtend 中的数据",
    },
    {
      name: "授权 HistoryExtend",
      description: "授权新的 LogicExtend 合约访问 HistoryExtend",
      contract: "MiningMachineHistoryExtend",
      function: "setAuthorizedCaller",
      reason: "新的 LogicExtend 合约需要权限才能记录历史数据",
    },
    {
      name: "授权 LogicExtend",
      description: "授权 SystemLogic 合约访问 LogicExtend",
      contract: "MiningMachineSystemLogicExtend",
      function: "setAuthorizedCaller",
      reason:
        "SystemLogic 合约需要权限才能调用 LogicExtend 的奖励函数（如 addRewardForAddressByFuelFee）",
    },
  ];

  // 逐个执行所有步骤（因为需要 sadmin 权限，不能使用 Multicall）
  const handleUpgradeAll = async () => {
    if (!chain?.id) {
      Toast.show({
        content: "请先连接钱包",
        position: "center",
        duration: 2000,
      });
      return;
    }

    setIsUpgrading(true);

    try {
      console.log("=== 开始执行合约升级授权 ===");
      console.log("当前链信息:", {
        chainId: chain.id,
        chainName: chain.name,
      });

      // 步骤 1: Storage.setLogicAddress
      Toast.show({
        content: "步骤 1/5: 更新 Storage 中的合约地址...",
        position: "center",
        duration: 2000,
      });

      const hash1 = await writeContractAsync({
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "setLogicAddress",
        args: [
          getAddress(MiningMachineSystemLogicAddress),
          getAddress(MiningMachineProductionLogicAddress),
          getAddress(MiningMachineNodeSystemAddress),
        ],
        gas: 250000n, // 优化: 500,000 → 250,000 (实际消耗约 150,000)
        maxFeePerGas: 10000000000n, // 10 Gwei
        maxPriorityFeePerGas: 2000000000n, // 2 Gwei
        chainId: chain.id,
      });

      console.log("步骤 1 交易哈希:", hash1);
      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash1,
        chainId: chain.id,
      });

      Toast.show({
        content: "✅ 步骤 1/5 完成",
        position: "center",
        duration: 1000,
      });

      // 步骤 2: SystemLogic.setExtendLogic
      Toast.show({
        content: "步骤 2/5: 更新 SystemLogic 中的 LogicExtend 地址...",
        position: "center",
        duration: 2000,
      });

      const hash2 = await writeContractAsync({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "setExtendLogic",
        args: [getAddress(MiningMachineSystemLogicExtendAddress)],
        gas: 150000n, // 优化: 300,000 → 150,000 (实际消耗约 80,000)
        maxFeePerGas: 10000000000n, // 10 Gwei
        maxPriorityFeePerGas: 2000000000n, // 2 Gwei
        chainId: chain.id,
      });

      console.log("步骤 2 交易哈希:", hash2);
      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash2,
        chainId: chain.id,
      });

      Toast.show({
        content: "✅ 步骤 2/5 完成",
        position: "center",
        duration: 1000,
      });

      // 步骤 3: StorageExtend.setAuthorizedCaller
      Toast.show({
        content: "步骤 3/5: 授权 LogicExtend 访问 StorageExtend...",
        position: "center",
        duration: 2000,
      });

      const hash3 = await writeContractAsync({
        address: MiningMachineSystemStorageExtendAddress,
        abi: MiningMachineSystemStorageExtendABI,
        functionName: "setAuthorizedCaller",
        args: [getAddress(MiningMachineSystemLogicExtendAddress), true],
        gas: 150000n, // 优化: 300,000 → 150,000 (实际消耗约 80,000)
        maxFeePerGas: 10000000000n, // 10 Gwei
        maxPriorityFeePerGas: 2000000000n, // 2 Gwei
        chainId: chain.id,
      });

      console.log("步骤 3 交易哈希:", hash3);
      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash3,
        chainId: chain.id,
      });

      Toast.show({
        content: "✅ 步骤 3/5 完成",
        position: "center",
        duration: 1000,
      });

      // 步骤 4: HistoryExtend.setAuthorizedCaller
      Toast.show({
        content: "步骤 4/5: 授权 LogicExtend 访问 HistoryExtend...",
        position: "center",
        duration: 2000,
      });

      const hash4 = await writeContractAsync({
        address: MiningMachineHistoryExtendAddress,
        abi: MiningMachineHistoryExtendABI,
        functionName: "setAuthorizedCaller",
        args: [getAddress(MiningMachineSystemLogicExtendAddress), true],
        gas: 150000n, // 优化: 300,000 → 150,000 (实际消耗约 80,000)
        maxFeePerGas: 10000000000n, // 10 Gwei
        maxPriorityFeePerGas: 2000000000n, // 2 Gwei
        chainId: chain.id,
      });

      console.log("步骤 4 交易哈希:", hash4);
      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash4,
        chainId: chain.id,
      });

      Toast.show({
        content: "✅ 步骤 4/5 完成",
        position: "center",
        duration: 1000,
      });

      // 步骤 5: LogicExtend.setAuthorizedCaller (授权 SystemLogic)
      Toast.show({
        content: "步骤 5/5: 授权 SystemLogic 访问 LogicExtend...",
        position: "center",
        duration: 2000,
      });

      const hash5 = await writeContractAsync({
        address: MiningMachineSystemLogicExtendAddress,
        abi: MiningMachineSystemLogicExtendABI,
        functionName: "setAuthorizedCaller",
        args: [getAddress(MiningMachineSystemLogicAddress), true],
        gas: 150000n, // 优化: 300,000 → 150,000 (实际消耗约 80,000)
        maxFeePerGas: 10000000000n, // 10 Gwei
        maxPriorityFeePerGas: 2000000000n, // 2 Gwei
        chainId: chain.id,
      });

      console.log("步骤 5 交易哈希:", hash5);
      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash5,
        chainId: chain.id,
      });

      Toast.show({
        content: "✅ 步骤 5/5 完成",
        position: "center",
        duration: 1000,
      });

      console.log("=== 所有授权步骤完成 ===");
      Toast.show({
        content: "✅ 所有授权步骤完成！",
        position: "center",
        duration: 3000,
      });
    } catch (error) {
      console.error("升级失败:", error);
      Toast.show({
        content: `升级失败: ${error instanceof Error ? error.message : String(error)}`,
        position: "center",
        duration: 3000,
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <div className="text-[15px] font-bold mb-2">🚀 一键升级合约地址</div>
        <div className="text-[12px] text-gray-600 mb-2">
          重新部署 NodeSystem 和 LogicExtend 合约后，点击按钮自动完成所有配置
        </div>
        <div className="text-[13px] font-semibold text-orange-600 bg-orange-50 p-2 rounded">
          💳 需要确认 5 次钱包交易（逐个执行）
        </div>
      </div>

      {/* 升级说明 */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 font-semibold mb-2">
          📋 将执行以下操作：
        </p>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`mb-2 pb-2 ${
              index < steps.length - 1 ? "border-b border-blue-100" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-blue-900">
                  {step.name}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {step.description}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  💡 {step.reason}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 合约地址信息 */}
      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-semibold text-gray-800 mb-2">
          📍 将要设置的合约地址：
        </p>

        <div className="space-y-2">
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Logic 合约地址：
            </div>
            <div className="text-[10px] font-mono text-gray-600 break-all">
              {MiningMachineSystemLogicAddress}
            </div>
          </div>

          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Production 合约地址：
            </div>
            <div className="text-[10px] font-mono text-gray-600 break-all">
              {MiningMachineProductionLogicAddress}
            </div>
          </div>

          <div className="bg-white p-2 rounded border-2 border-blue-200">
            <div className="text-xs font-medium text-blue-700 mb-1">
              NodeSystem 合约地址（新）：
            </div>
            <div className="text-[10px] font-mono text-blue-600 break-all">
              {MiningMachineNodeSystemAddress}
            </div>
          </div>

          <div className="bg-white p-2 rounded border-2 border-blue-200">
            <div className="text-xs font-medium text-blue-700 mb-1">
              LogicExtend 合约地址（新）：
            </div>
            <div className="text-[10px] font-mono text-blue-600 break-all">
              {MiningMachineSystemLogicExtendAddress}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-orange-600 mt-2 bg-orange-50 p-2 rounded">
          ⚠️ 地址来自 constants/index.ts 配置文件，请确保已更新为新部署的地址
        </div>
      </div>

      {/* 技术细节 */}
      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800 font-semibold mb-1">
          🔧 技术细节
        </p>
        <div className="text-xs text-yellow-700 space-y-1">
          <div>
            <strong>1. setLogicAddress:</strong> 更新 Storage 中的三个合约引用
          </div>
          <div>
            <strong>2. setExtendLogic:</strong> 更新 SystemLogic 中的
            LogicExtend 引用
          </div>
          <div>
            <strong>3-4. setAuthorizedCaller:</strong> 授权新的 LogicExtend
            访问扩展存储和历史记录
          </div>
          <div>
            <strong>5. setAuthorizedCaller:</strong> 授权 SystemLogic 访问
            LogicExtend（重要：用于燃料费奖励功能）
          </div>
        </div>
      </div>

      {/* 执行按钮 */}
      <Button
        className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white !rounded-3xl !py-2 !w-full !font-bold"
        style={{
          fontSize: "14px",
        }}
        loading={isUpgrading}
        onClick={handleUpgradeAll}
        disabled={isUpgrading}
      >
        {isUpgrading ? "正在执行升级交易..." : "🚀 一键升级所有合约地址"}
      </Button>

      {/* 警告信息 */}
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
        <div className="text-xs text-red-700 font-semibold mb-2">
          ⚠️ 重要提示：
        </div>
        <div className="text-xs text-red-700 space-y-1">
          <div>• 升级前请确保已在 constants/index.ts 中更新新合约地址</div>
          <div>• 升级过程中请勿关闭页面或刷新</div>
          <div className="font-bold text-orange-800 bg-orange-100 p-1 rounded">
            • 💳 需要确认 5 次钱包交易（逐个执行）
          </div>
          <div>• 每个步骤都会等待前一个步骤完成后再执行</div>
          <div>• 如果某个步骤失败，可以重新点击按钮继续</div>
          <div>• 预计总耗时：约 1-2 分钟（取决于网络速度）</div>
        </div>
      </div>
    </div>
  );
}
