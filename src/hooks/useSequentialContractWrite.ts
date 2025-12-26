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

          const txHash = await writeContractAsync({
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args || [],
            value: call.value || BigInt(0),
            chainId: chain.id,
            gas: 500000n, // 通用操作的 gas limit
            maxFeePerGas: parseGwei("10"),
            maxPriorityFeePerGas: parseGwei("2"),
          });

          console.log(
            `Waiting for confirmation of call ${i + 1} (${call.functionName})...`,
          );
          // 使用重命名后的wagmiConfig，并传递 chainId
          const receipt = await waitForTransactionReceipt(wagmiConfig, {
            hash: txHash,
            chainId: chain.id,
          });

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

        // 根据矿机数量动态计算 gas limit
        const baseGas = 200000n; // 基础 gas（激活需要更多 gas）
        const perMachineGas = 150000n; // 每台矿机额外的 gas
        const gasLimit = baseGas + perMachineGas * BigInt(machineIds.length);

        console.log(`计算的 Gas Limit: ${gasLimit}`);

        txHash = await writeContractAsync({
          address: contractAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "batchActivateMachinesWithLP",
          args: [machineIds],
          chainId: chain.id,
          gas: gasLimit,
          maxFeePerGas: parseGwei("10"),
          maxPriorityFeePerGas: parseGwei("2"),
        });

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

        // 根据矿机数量动态计算 gas limit
        // IDX 代币的 transferFrom 会触发多次分红转账，需要更多 gas
        // History 合约的 recordFuelFee 也需要较多 gas
        // addRewardForAddressByFuelFee 会追溯15层推荐关系，消耗大量 gas
        const baseGas = 800000n; // 增加基础 gas（从 500000 提高到 800000）
        const perMachineGas = 300000n; // 增加每台矿机的 gas（从 200000 提高到 300000）
        const gasLimit = baseGas + perMachineGas * BigInt(machineIds.length);

        console.log(`计算的 Gas Limit: ${gasLimit}`);
        console.log(
          `🔧 使用 Gas Price: maxFeePerGas=10 gwei, maxPriorityFeePerGas=2 gwei`,
        );

        txHash = await writeContractAsync({
          address: contractAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "batchPayFuel",
          args: [machineIds, monthCount],
          chainId: chain.id,
          gas: gasLimit,
          // 使用合理的 Gas Price（BSC 推荐 3-5 Gwei，这里设置 10 以确保成功）
          maxFeePerGas: parseGwei("10"),
          maxPriorityFeePerGas: parseGwei("2"),
        });

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

        console.error(
          `批量添加燃料费失败: ${isUserRejected ? "用户已取消" : error}`,
        );
        return {
          success: false,
          error: isUserRejected ? "用户取消操作" : error,
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
