import { useState } from "react";
import { Button, Toast } from "antd-mobile";
import { useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { getAddress, encodeFunctionData } from "viem";
import config from "@/proviers/config";
import {
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicAddress,
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress,
  MiningMachineSystemStorageExtendABI,
  MiningMachineSystemStorageExtendAddress,
  MiningMachineHistoryExtendABI,
  MiningMachineHistoryExtendAddress,
  MiningMachineSystemLogicExtendAddress,
  MiningMachineNodeSystemAddress,
  MiningMachineProductionLogicAddress,
} from "@/constants";

// Multicall3 合约地址（通用地址，大多数链都支持）
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Multicall3 ABI（只需要 aggregate3 函数）
const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "target", type: "address" },
          { name: "allowFailure", type: "bool" },
          { name: "callData", type: "bytes" },
        ],
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate3",
    outputs: [
      {
        components: [
          { name: "success", type: "bool" },
          { name: "returnData", type: "bytes" },
        ],
        name: "returnData",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

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
 */
export default function UpgradeContracts() {
  const { writeContractAsync } = useWriteContract();
  const [isUpgrading, setIsUpgrading] = useState(false);

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
  ];

  // 使用 Multicall 一次性执行所有步骤
  const handleUpgradeAll = async () => {
    setIsUpgrading(true);

    try {
      Toast.show({
        content: "正在准备 Multicall 交易...",
        position: "center",
        duration: 1000,
      });

      // 准备 4 个调用的 calldata
      const calls = [
        // 1. Storage.setLogicAddress
        {
          target: getAddress(MiningMachineSystemStorageAddress),
          allowFailure: false,
          callData: encodeFunctionData({
            abi: MiningMachineSystemStorageABI,
            functionName: "setLogicAddress",
            args: [
              getAddress(MiningMachineSystemLogicAddress),
              getAddress(MiningMachineProductionLogicAddress),
              getAddress(MiningMachineNodeSystemAddress),
            ],
          }),
        },
        // 2. SystemLogic.setExtendLogic
        {
          target: getAddress(MiningMachineSystemLogicAddress),
          allowFailure: false,
          callData: encodeFunctionData({
            abi: MiningMachineSystemLogicABI,
            functionName: "setExtendLogic",
            args: [getAddress(MiningMachineSystemLogicExtendAddress)],
          }),
        },
        // 3. StorageExtend.setAuthorizedCaller
        {
          target: getAddress(MiningMachineSystemStorageExtendAddress),
          allowFailure: false,
          callData: encodeFunctionData({
            abi: MiningMachineSystemStorageExtendABI,
            functionName: "setAuthorizedCaller",
            args: [getAddress(MiningMachineSystemLogicExtendAddress), true],
          }),
        },
        // 4. HistoryExtend.setAuthorizedCaller
        {
          target: getAddress(MiningMachineHistoryExtendAddress),
          allowFailure: false,
          callData: encodeFunctionData({
            abi: MiningMachineHistoryExtendABI,
            functionName: "setAuthorizedCaller",
            args: [getAddress(MiningMachineSystemLogicExtendAddress), true],
          }),
        },
      ];

      Toast.show({
        content: "请在钱包中确认交易（包含 4 个操作）",
        position: "center",
        duration: 2000,
      });

      // 执行 Multicall
      const hash = await writeContractAsync({
        address: MULTICALL3_ADDRESS,
        abi: MULTICALL3_ABI,
        functionName: "aggregate3",
        args: [calls],
      });

      Toast.show({
        content: "交易已提交，等待确认...",
        position: "center",
        duration: 2000,
      });

      // 等待交易确认
      await waitForTransactionReceipt(config, { hash });

      Toast.show({
        content: "🎉 所有合约地址更新完成！",
        position: "center",
        duration: 3000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      Toast.show({
        content: `❌ 升级失败: ${errorMessage}`,
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
        <div className="text-[13px] font-semibold text-green-600 bg-green-50 p-2 rounded">
          💳 只需确认 1 次钱包交易（包含 4 个操作）
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
            <strong>3-4. setAuthorizedCaller:</strong>{" "}
            授权新合约访问扩展存储和历史记录
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
        {isUpgrading
          ? "正在执行 Multicall 交易..."
          : "🚀 一键升级所有合约地址（Multicall）"}
      </Button>

      {/* 警告信息 */}
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
        <p className="text-xs text-red-700 font-semibold mb-2">⚠️ 重要提示：</p>
        <p className="text-xs text-red-700 space-y-1">
          <div>• 升级前请确保已在 constants/index.ts 中更新新合约地址</div>
          <div>• 升级过程中请勿关闭页面或刷新</div>
          <div className="font-bold text-green-800 bg-green-100 p-1 rounded">
            • 💳 使用 Multicall：只需确认 1 次钱包交易，但包含 4 个操作
          </div>
          <div className="font-bold text-orange-800">
            • ⚡ 虽然只确认 1 次，但实际执行 4 笔交易操作
          </div>
          <div>• 如果失败，所有操作都会回滚，可以重新点击按钮</div>
          <div>• 预计总耗时：约 30 秒（取决于网络速度）</div>
        </p>
      </div>
    </div>
  );
}
