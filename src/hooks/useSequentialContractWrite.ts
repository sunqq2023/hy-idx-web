import { useCallback } from "react";
import { useAccount, useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { TransactionReceipt, parseGwei } from "viem";
import MiningMachineSystemLogicABI from "../constants/MiningMachineSystemLogic";

interface ContractCall {
  address: `0x${string}`;
  abi: any[];
  functionName: string;
  args?: any[];
  value?: bigint;
  gas?: bigint; // 可选的自定义 gas limit
  onConfirmed?: (
    receipt: TransactionReceipt,
    callIndex: number,
  ) => void | Promise<void>;
  onCancel?: (callIndex: number, error: unknown) => void | Promise<void>;
}

interface ExecutionResult {
  success: boolean;
  txHash?: `0x${string}`;
  receipt?: TransactionReceipt;
  error?: unknown;
  functionName?: string;
  callIndex?: number;
}

export function useSequentialContractWrite() {
  const { writeContractAsync } = useWriteContract();
  const { chain } = useAccount();
  const wagmiConfig = useConfig(); // 使用 useConfig hook 获取当前配置

  const executeSequentialCalls = useCallback(
    async (calls: ContractCall[]): Promise<ExecutionResult[]> => {
      if (!chain?.id) {
        throw new Error("No connected chain");
      }

      const results: ExecutionResult[] = [];

      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        const resultBase = {
          functionName: call.functionName,
          callIndex: i,
        };

        try {
          console.log(
            `Executing call ${i + 1}/${calls.length} to ${call.functionName}...`,
          );

          // 在 Anvil Fork 环境中，使用 legacy 交易类型
          const isAnvilFork = chain.id === 1056;

          const txParams: any = {
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args || [],
            value: call.value || BigInt(0),
            chainId: chain.id,
            gas: call.gas || 500000n,
          };

          // Anvil 环境使用 legacy 交易（gasPrice），其他环境使用 EIP-1559（让钱包自动估算）
          if (isAnvilFork) {
            txParams.gasPrice = parseGwei("5");
            // 在 Anvil 环境中，明确设置 type 为 'legacy'
            txParams.type = "legacy";
          }

          console.log("Transaction params:", {
            ...txParams,
            abi: "[ABI]",
            args: txParams.args,
          });

          const txHash = await writeContractAsync(txParams);

          console.log(
            `Waiting for confirmation of call ${i + 1} (${call.functionName})...`,
          );
          // 使用重命名后的wagmiConfig，并传递 chainId，添加30秒超时
          const receipt = await Promise.race([
            waitForTransactionReceipt(wagmiConfig, {
              hash: txHash,
              chainId: chain.id,
              confirmations: isAnvilFork ? 1 : 2, // Anvil 只需要 1 个确认
            }),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("交易确认超时（30秒）")),
                30000,
              ),
            ),
          ]);

          if (call.onConfirmed) {
            try {
              await call.onConfirmed(receipt, i);
            } catch (callbackError) {
              console.error(
                `onConfirmed callback failed for call ${i + 1}:`,
                callbackError,
              );
            }
          }

          results.push({
            ...resultBase,
            success: true,
            txHash,
            receipt,
          });

          console.log(
            `Call ${i + 1} (${call.functionName}) confirmed with txHash: ${txHash}`,
          );
        } catch (error) {
          const isUserRejected =
            (error as any)?.name === "UserRejectedRequestError" ||
            (error as any)?.code === 4001 ||
            (error as any)?.message?.includes("User rejected") ||
            (error as any)?.message?.includes("用户拒绝");

          if (isUserRejected && call.onCancel) {
            try {
              await call.onCancel(i, error);
            } catch (callbackError) {
              console.error(
                `第 ${i + 1} 个调用的 onCancel 回调失败:`,
                callbackError,
              );
            }
          }

          results.push({
            ...resultBase,
            success: false,
            error,
          });
        }
      }

      return results;
    },
    [writeContractAsync, chain?.id],
  );

  const batchActivateMachinesWithLP = useCallback(
    async (
      contractAddress: `0x${string}`,
      machineIds: bigint[],
    ): Promise<ExecutionResult> => {
      if (!chain?.id) {
        throw new Error("未连接区块链网络");
      }
      if (!machineIds.length) {
        throw new Error("请传入至少一个矿机ID");
      }
      if (machineIds.some((id) => id < 0n)) {
        throw new Error("矿机ID不能为负数");
      }

      let txHash: `0x${string}` | undefined;

      try {
        console.log(
          `开始批量激活矿机，共 ${machineIds.length} 台，函数: batchActivateMachinesWithLP`,
        );

        // 根据矿机数量动态计算 gas limit（按最复杂奖励过程计算）
        // 与 Machine.tsx 保持一致，确保有足够的安全余量
        //
        // 基于实际失败交易数据优化（tx: 0x7836f22e...）：
        // - 场景：激活1台矿机，已激活30台（触发里程碑），11层推荐人（使用前5层）
        // - Gas Used: 792,438 (Gas Limit: 800,000 导致失败)
        //
        // 分析：batchActivateMachinesWithLP 对每个矿机执行以下操作：
        // 1. 验证循环（每台矿机）：约 12k-16k gas
        // 2. IDX转账（一次性，所有矿机共享）：约 60k-130k gas
        // 3. 更新循环（每台矿机）：约 60k-120k gas
        // 4. 激活奖励（最复杂情况 - 触发里程碑 + 5层推荐人）：
        //    - 实际消耗：792,438 gas（1台，最复杂场景）
        //    - 其中激活奖励占：~642,000 gas
        //    - 基础操作占：~150,000 gas
        //
        // 每台矿机的gas消耗（普通场景，不触发奖励）：
        //   - 验证(16k) + 更新(120k) = 约136k gas
        //
        // 基础开销（所有矿机共享，最复杂场景）：
        //   - 函数调用：21k gas
        //   - IDX转账：70k gas
        //   - 激活奖励（最复杂）：642k gas
        //   - 其他：59k gas
        //   - 总计：792k gas
        //
        // 安全余量（基于实际失败数据）：
        //   - 基础开销增加 39%：792k * 1.39 = 1,100k
        //   - 每台矿机增加 61%：93k * 1.61 = 150k
        //
        // 计算示例（含安全余量）：
        //   1台（最复杂）= 1,100k + 150k = 1,250k = 1.25M gas (安全余量 58%)
        //   10台（普通） = 1,100k + 1,500k = 2,600k = 2.6M gas (安全余量 148%)
        //   50台 = 1,100k + 7,500k = 8,600k = 8.6M gas
        //   100台 = 1,100k + 15,000k = 16,100k = 16.1M gas
        //   159台 = 1,100k + 23,850k = 24,950k = 24.95M gas（接近上限）
        const baseGas = 1100000n; // 基础开销（基于实际失败数据 792k + 39%安全余量）
        const perMachineGas = 150000n; // 每台矿机的gas（验证 + 更新状态 + 61%安全余量）
        const MAX_GAS_LIMIT = 25000000n; // 25M gas limit，留出5M的安全余量（BSC block gas limit = 140M）
        const calculatedGasLimit =
          baseGas + perMachineGas * BigInt(machineIds.length);

        // 检查是否超过最大gas limit
        if (calculatedGasLimit > MAX_GAS_LIMIT) {
          const maxMachines = Math.floor(
            Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
          );
          const errorMsg = `一次最多只能激活 ${maxMachines} 台矿机，当前选择了 ${machineIds.length} 台，请减少数量后重试`;
          console.error(`❌ ${errorMsg}`);
          return {
            success: false,
            error: errorMsg,
            functionName: "batchActivateMachinesWithLP",
          };
        }

        const gasLimit = calculatedGasLimit;
        console.log(
          `计算的 Gas Limit: ${gasLimit} (${machineIds.length} 台矿机)`,
        );

        // Anvil 环境使用 legacy 交易
        const isAnvilFork = chain.id === 1056;
        const txParams: any = {
          address: contractAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "batchActivateMachinesWithLP",
          args: [machineIds],
          chainId: chain.id,
          gas: gasLimit,
        };

        if (isAnvilFork) {
          txParams.gasPrice = parseGwei("5");
        }
        // 对于真实网络，不设置 gas price，让钱包自动估算

        txHash = await writeContractAsync(txParams);

        console.log(`批量激活交易已发送，哈希: ${txHash}`);
        console.log(`等待交易确认...`);

        // 使用重命名后的wagmiConfig，添加超时处理（增加到3分钟），并传递 chainId
        const receipt = await Promise.race([
          waitForTransactionReceipt(wagmiConfig, {
            hash: txHash,
            chainId: chain.id,
            confirmations: 1,
          }),
          new Promise<never>(
            (_, reject) =>
              setTimeout(() => reject(new Error("交易确认超时")), 180000), // 3分钟超时
          ),
        ]);

        console.log(`批量激活成功，区块号: ${receipt.blockNumber}`);
        return {
          success: true,
          txHash,
          receipt,
          functionName: "batchActivateMachinesWithLP",
        };
      } catch (error) {
        const isUserRejected =
          (error as any)?.name === "UserRejectedRequestError" ||
          (error as any)?.code === 4001 ||
          (error as any)?.message?.includes("User rejected") ||
          (error as any)?.message?.includes("用户拒绝");

        // 如果交易已发送但确认失败（如浏览器扩展通信错误），仍然返回成功
        if (txHash && !isUserRejected) {
          const errorMessage = (error as any)?.message || String(error);
          console.warn(`交易已发送但确认过程出错: ${errorMessage}`);
          console.log(`交易哈希: ${txHash}，请手动检查交易状态`);

          // 如果是浏览器扩展通信错误或超时，认为交易可能成功
          if (
            errorMessage.includes("message channel closed") ||
            errorMessage.includes("交易确认超时") ||
            errorMessage.includes("listener")
          ) {
            return {
              success: true,
              txHash,
              functionName: "batchActivateMachinesWithLP",
            };
          }
        }

        console.error(`批量激活失败: ${isUserRejected ? "用户已取消" : error}`);
        return {
          success: false,
          error: isUserRejected ? "用户取消操作" : error,
          functionName: "batchActivateMachinesWithLP",
          txHash,
        };
      }
    },
    [writeContractAsync, chain?.id],
  );

  const batchPayFuel = useCallback(
    async (
      contractAddress: `0x${string}`,
      machineIds: bigint[],
      monthCount: bigint,
    ): Promise<ExecutionResult> => {
      if (!chain?.id) {
        throw new Error("未连接区块链网络");
      }
      if (!machineIds.length) {
        throw new Error("请传入至少一个矿机ID");
      }
      if (machineIds.some((id) => id < 0n)) {
        throw new Error("矿机ID不能为负数");
      }
      if (monthCount <= 0n) {
        throw new Error("购买月数必须大于0");
      }

      let txHash: `0x${string}` | undefined;

      try {
        console.log(
          `开始批量添加燃料费，共 ${machineIds.length} 台矿机，购买月数: ${monthCount}，函数: batchPayFuel`,
        );
        console.log("当前链信息:", {
          chainId: chain.id,
          chainName: chain.name,
          rpcUrl: chain.rpcUrls?.default?.http?.[0],
        });

        // 根据矿机数量动态计算 gas limit（按最复杂情况计算）
        //
        // 分析：batchPayFuel 对每个矿机执行以下操作：
        // 1. payFuel 函数（循环内调用）：验证、IDX转账、存储更新、外部调用
        //    - 验证（修饰符）: ~11,000 gas
        //    - 验证子矿机: ~3,000 gas
        //    - 读取生命周期: ~800 gas
        //    - 计算燃料费用: ~12,000 gas
        //    - IDX转账（每台独立）: ~60,000 gas
        //    - 更新生命周期: ~25,000 gas
        //    - 记录历史: ~30,000 gas
        //    - addRewardForAddressByFuelFee（追溯15层推荐关系）:
        //      * 查询推荐链: ~31,500 gas
        //      * 遍历前5层: 5 × 40,000 = 200,000 gas
        //      小计: ~231,500 gas
        //    总计每台约 373,400 gas
        //
        // 基础开销: 函数调用、循环初始化等，约 100k
        // 安全余量: 每台 373k × 1.34 = 500k (34% 安全余量)
        //
        // 计算示例：
        //   1台 = 100k + 500k = 600k (安全余量 61%)
        //   10台 = 100k + 5M = 5.1M (安全余量 30%)
        //   49台 = 100k + 24.5M = 24.6M (接近上限)
        const baseGas = 100000n; // 基础 gas（函数调用 + 循环开销）
        const perMachineGas = 500000n; // 每台矿机的gas（包含IDX转账 + 存储更新 + 推荐人奖励 + 34%安全余量）
        // 计算示例：
        //   1台 = 650k gas
        //   10台 = 4.7M gas
        //   55台 = 24.95M gas（接近上限）
        //
        // 注意：BSC block gas limit = 140M，为了安全起见，设置上限为 25M
        const MAX_GAS_LIMIT = 25000000n; // 25M gas limit，留出5M的安全余量
        const calculatedGasLimit =
          baseGas + perMachineGas * BigInt(machineIds.length);

        // 检查是否超过最大gas limit
        if (calculatedGasLimit > MAX_GAS_LIMIT) {
          const maxMachines = Math.floor(
            Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
          );
          const errorMsg = `一次最多只能为 ${maxMachines} 台矿机加注燃料，当前选择了 ${machineIds.length} 台，请减少数量后重试`;
          console.error(`❌ ${errorMsg}`);
          return {
            success: false,
            error: errorMsg,
            functionName: "batchPayFuel",
          };
        }

        const gasLimit = calculatedGasLimit;

        console.log(
          `计算的 Gas Limit: ${gasLimit.toString()} (${machineIds.length} 台矿机，计算值: ${calculatedGasLimit.toString()})`,
        );

        // Anvil 环境使用 legacy 交易
        const isAnvilFork = chain.id === 1056;
        const txParams: any = {
          address: contractAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "batchPayFuel",
          args: [machineIds, monthCount],
          chainId: chain.id,
          gas: gasLimit,
        };

        if (isAnvilFork) {
          txParams.gasPrice = parseGwei("5");
          console.log(`🔧 Anvil 环境: 使用固定 Gas Price = 5 gwei`);
        } else {
          console.log(`🔧 真实网络: 使用钱包自动估算的 Gas Price`);
        }
        // 对于真实网络，不设置 gas price，让钱包自动估算

        txHash = await writeContractAsync(txParams);

        console.log(`批量添加燃料费交易已发送，哈希: ${txHash}`);
        console.log(`等待交易确认...`);

        // 使用重命名后的wagmiConfig，添加超时处理（增加到3分钟），并传递 chainId
        const receipt = await Promise.race([
          waitForTransactionReceipt(wagmiConfig, {
            hash: txHash,
            chainId: chain.id,
            confirmations: 1,
          }),
          new Promise<never>(
            (_, reject) =>
              setTimeout(() => reject(new Error("交易确认超时")), 180000), // 3分钟超时
          ),
        ]);

        console.log(`批量添加燃料费成功，区块号: ${receipt.blockNumber}`);
        return {
          success: true,
          txHash,
          receipt,
          functionName: "batchPayFuel",
        };
      } catch (error) {
        const isUserRejected =
          (error as any)?.name === "UserRejectedRequestError" ||
          (error as any)?.code === 4001 ||
          (error as any)?.message?.includes("User rejected") ||
          (error as any)?.message?.includes("用户拒绝");

        // 如果交易已发送但确认失败（如浏览器扩展通信错误），仍然返回成功
        if (txHash && !isUserRejected) {
          const errorMessage = (error as any)?.message || String(error);
          console.warn(`交易已发送但确认过程出错: ${errorMessage}`);
          console.log(`交易哈希: ${txHash}，请手动检查交易状态`);

          // 如果是浏览器扩展通信错误或超时，认为交易可能成功
          if (
            errorMessage.includes("message channel closed") ||
            errorMessage.includes("交易确认超时") ||
            errorMessage.includes("listener")
          ) {
            return {
              success: true,
              txHash,
              functionName: "batchPayFuel",
            };
          }
        }

        // 增强错误处理
        let errorMessage = isUserRejected ? "用户取消操作" : String(error);
        const errorStr = errorMessage.toLowerCase();

        // 检测 Gas 不足
        if (
          !isUserRejected &&
          (errorStr.includes("out of gas") ||
            errorStr.includes("gas required exceeds allowance") ||
            errorStr.includes("intrinsic gas too low"))
        ) {
          errorMessage = `Gas 不足。当前尝试为 ${machineIds.length} 台矿机加注燃料，建议减少数量分批操作（每批建议不超过 40 台）`;
        }

        console.error(
          `批量添加燃料费失败: ${isUserRejected ? "用户已取消" : errorMessage}`,
        );
        return {
          success: false,
          error: errorMessage,
          functionName: "batchPayFuel",
          txHash,
        };
      }
    },
    [writeContractAsync, chain?.id],
  );

  return {
    executeSequentialCalls,
    batchActivateMachinesWithLP,
    batchPayFuel,
  };
}
