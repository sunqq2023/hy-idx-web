import { useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TransactionReceipt } from 'viem';
// 将导入的config重命名为wagmiConfig以避免冲突
import { default as wagmiConfig } from '@/proviers/config';
import MiningMachineSystemLogicABI from '../constants/MiningMachineSystemLogic';

interface ContractCall {
  address: `0x${string}`;
  abi: any[];
  functionName: string;
  args?: any[];
  value?: bigint;
  onConfirmed?: (
    receipt: TransactionReceipt,
    callIndex: number
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

  const executeSequentialCalls = useCallback(
    async (calls: ContractCall[]): Promise<ExecutionResult[]> => {
      if (!chain?.id) {
        throw new Error('No connected chain');
      }

      const results: ExecutionResult[] = [];

      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        const resultBase = {
          functionName: call.functionName,
          callIndex: i
        };

        try {
          console.log(
            `Executing call ${i + 1}/${calls.length} to ${call.functionName}...`
          );

          const txHash = await writeContractAsync({
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args || [],
            value: call.value || BigInt(0),
            chainId: chain.id
          });

          console.log(
            `Waiting for confirmation of call ${i + 1} (${call.functionName})...`
          );
          // 使用重命名后的wagmiConfig
          const receipt = await waitForTransactionReceipt(wagmiConfig, {
            hash: txHash
          });

          if (call.onConfirmed) {
            try {
              await call.onConfirmed(receipt, i);
            } catch (callbackError) {
              console.error(
                `onConfirmed callback failed for call ${i + 1}:`,
                callbackError
              );
            }
          }

          results.push({
            ...resultBase,
            success: true,
            txHash,
            receipt
          });

          console.log(
            `Call ${i + 1} (${call.functionName}) confirmed with txHash: ${txHash}`
          );
        } catch (error) {
          const isUserRejected =
            (error as any)?.name === 'UserRejectedRequestError' ||
            (error as any)?.code === 4001 ||
            (error as any)?.message?.includes('User rejected') ||
            (error as any)?.message?.includes('用户拒绝');

          if (isUserRejected && call.onCancel) {
            try {
              await call.onCancel(i, error);
            } catch (callbackError) {
              console.error(
                `第 ${i + 1} 个调用的 onCancel 回调失败:`,
                callbackError
              );
            }
          }

          results.push({
            ...resultBase,
            success: false,
            error
          });
        }
      }

      return results;
    },
    [writeContractAsync, chain?.id]
  );

  const batchActivateMachinesWithLP = useCallback(
    async (
      contractAddress: `0x${string}`,
      machineIds: bigint[]
    ): Promise<ExecutionResult> => {
      if (!chain?.id) {
        throw new Error('未连接区块链网络');
      }
      if (!machineIds.length) {
        throw new Error('请传入至少一个矿机ID');
      }
      if (machineIds.some(id => id < 0n)) {
        throw new Error('矿机ID不能为负数');
      }

      try {
        console.log(`开始批量激活矿机，共 ${machineIds.length} 台，函数: batchActivateMachinesWithLP`);

        const txHash = await writeContractAsync({
          address: contractAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'batchActivateMachinesWithLP',
          args: [machineIds],
          chainId: chain.id
        });

        console.log(`等待批量激活交易确认，哈希: ${txHash}`);
        // 使用重命名后的wagmiConfig
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: txHash
        });

        console.log(`批量激活成功，区块号: ${receipt.blockNumber}`);
        return {
          success: true,
          txHash,
          receipt,
          functionName: 'batchActivateMachinesWithLP'
        };
      } catch (error) {
        const isUserRejected =
          (error as any)?.name === 'UserRejectedRequestError' ||
          (error as any)?.code === 4001 ||
          (error as any)?.message?.includes('User rejected') ||
          (error as any)?.message?.includes('用户拒绝');

        console.error(`批量激活失败: ${isUserRejected ? '用户已取消' : error}`);
        return {
          success: false,
          error: isUserRejected ? '用户取消操作' : error,
          functionName: 'batchActivateMachinesWithLP'
        };
      }
    },
    [writeContractAsync, chain?.id]
  );

  const batchPayFuel = useCallback(
    async (
      contractAddress: `0x${string}`,
      machineIds: bigint[],
      monthCount: bigint
    ): Promise<ExecutionResult> => {
      if (!chain?.id) {
        throw new Error('未连接区块链网络');
      }
      if (!machineIds.length) {
        throw new Error('请传入至少一个矿机ID');
      }
      if (machineIds.some(id => id < 0n)) {
        throw new Error('矿机ID不能为负数');
      }
      if (monthCount <= 0n) {
        throw new Error('购买月数必须大于0');
      }

      try {
        console.log(`开始批量添加燃料费，共 ${machineIds.length} 台矿机，购买月数: ${monthCount}，函数: batchPayFuel`);

        const txHash = await writeContractAsync({
          address: contractAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: 'batchPayFuel',
          args: [machineIds, monthCount],
          chainId: chain.id
        });

        console.log(`等待批量添加燃料费交易确认，哈希: ${txHash}`);
        // 使用重命名后的wagmiConfig
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: txHash
        });

        console.log(`批量添加燃料费成功，区块号: ${receipt.blockNumber}`);
        return {
          success: true,
          txHash,
          receipt,
          functionName: 'batchPayFuel'
        };
      } catch (error) {
        const isUserRejected =
          (error as any)?.name === 'UserRejectedRequestError' ||
          (error as any)?.code === 4001 ||
          (error as any)?.message?.includes('User rejected') ||
          (error as any)?.message?.includes('用户拒绝');

        console.error(`批量添加燃料费失败: ${isUserRejected ? '用户已取消' : error}`);
        return {
          success: false,
          error: isUserRejected ? '用户取消操作' : error,
          functionName: 'batchPayFuel'
        };
      }
    },
    [writeContractAsync, chain?.id]
  );

  return {
    executeSequentialCalls,
    batchActivateMachinesWithLP,
    batchPayFuel
  };
}
    