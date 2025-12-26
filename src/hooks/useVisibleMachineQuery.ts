import { useState, useCallback, useRef, useEffect } from "react";
import { readContract, multicall } from "@wagmi/core";
import { useConfig } from "wagmi";
import {
  MiningMachineSystemStorageABI,
  MiningMachineProductionLogicABI,
} from "@/constants";
import { useContractAddresses } from "./useChainConfig";
import { useMachineDataCache, MachineData } from "./useMachineDataCache";

// 查询配置
interface QueryConfig {
  debounceDelay: number; // 防抖延迟
}

// 默认配置
const DEFAULT_CONFIG: QueryConfig = {
  debounceDelay: 1000,
};

export const useVisibleMachineQuery = (
  allMachineIds: number[],
  config: Partial<QueryConfig> = {},
) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const wagmiConfig = useConfig();

  // 使用动态合约地址
  const { STORAGE_ADDRESS, PRODUCTION_LOGIC_ADDRESS } = useContractAddresses();

  // 类型转换为 0x${string}
  const storageAddress = STORAGE_ADDRESS as `0x${string}`;
  const productionLogicAddress = PRODUCTION_LOGIC_ADDRESS as `0x${string}`;

  const {
    getCachedData,
    setCachedData,
    setCachedDataBatch,
    getMissingIds,
    isQuerying,
    setQuerying,
    canQuery,
  } = useMachineDataCache();

  const [queryTimeout, setQueryTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 查询单台矿机数据
  const querySingleMachine = useCallback(
    async (machineId: number): Promise<MachineData | null> => {
      try {
        // 检查缓存
        const cached = getCachedData(machineId);
        if (cached) {
          return cached;
        }

        // 检查是否可以查询
        if (!canQuery(machineId)) {
          return null;
        }

        setQuerying([machineId], true);

        // 查询生命周期数据
        const lifecycleData = await readContract(wagmiConfig, {
          address: storageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: "getMachineLifecycle",
          args: [machineId],
        });

        const lifecycle = lifecycleData as any;
        const machineData: MachineData = {
          id: machineId,
          activatedAt: Number(lifecycle.activatedAt),
          createTime: Number(lifecycle.createTime),
          expiredAt: Number(lifecycle.expiredAt),
          destroyed: lifecycle.destroyed,
          isActivatedStakedLP: lifecycle.isActivatedStakedLP,
          isFuelPaid: lifecycle.isFuelPaid,
          isProducing: lifecycle.isProducing,
          lastProduceTime: Number(lifecycle.lastProduceTime),
          producedChildCount: Number(lifecycle.producedChildCount),
          producedHours: Number(lifecycle.producedHours),
          mtype: lifecycle.mtype,
          fuelRemainingMinutes: Number(lifecycle.fuelRemainingMinutes),
          checked: false,
        };

        // 如果是母矿机，查询生产数据
        if (machineData.mtype === 1 && machineData.isActivatedStakedLP) {
          try {
            const productionData = await readContract(wagmiConfig, {
              address: productionLogicAddress,
              abi: MiningMachineProductionLogicABI,
              functionName: "viewMachineProduction",
              args: [machineId],
            });
            machineData.claimableChildren = Number((productionData as any)[2]);
          } catch (error) {
            console.warn(`查询母矿机${machineId}生产数据失败:`, error);
          }
        }

        // 如果是子矿机，查询在售状态
        if (machineData.mtype === 2) {
          try {
            const onSaleData = await readContract(wagmiConfig, {
              address: storageAddress,
              abi: MiningMachineSystemStorageABI,
              functionName: "_isOnSale",
              args: [machineId],
            });
            machineData.isOnSale = onSaleData as boolean;
          } catch (error) {
            console.warn(`查询子矿机${machineId}在售状态失败:`, error);
          }
        }

        // 缓存数据
        setCachedData(machineId, machineData);
        return machineData;
      } catch (error) {
        console.error(`查询矿机${machineId}数据失败:`, error);
        return null;
      } finally {
        setQuerying([machineId], false);
      }
    },
    [getCachedData, setCachedData, canQuery, setQuerying],
  );

  // 批量查询矿机数据
  const queryMachines = useCallback(
    async (machineIds: number[]): Promise<Map<number, MachineData>> => {
      const result = new Map<number, MachineData>();

      // 过滤出需要查询的矿机
      const missingIds = getMissingIds(machineIds);
      if (missingIds.length === 0) {
        // 所有数据都在缓存中
        machineIds.forEach((id) => {
          const cached = getCachedData(id);
          if (cached) result.set(id, cached);
        });
        return result;
      }

      // 检查是否可以查询
      const queryableIds = missingIds.filter((id) => {
        const canQueryResult = canQuery(id);
        console.log(`矿机 ${id} 是否可以查询:`, canQueryResult);
        return canQueryResult;
      });
      console.log("可查询的矿机ID列表:", queryableIds);
      if (queryableIds.length === 0) {
        console.log("没有可查询的矿机，返回空结果");
        return result;
      }

      setQuerying(queryableIds, true);

      try {
        console.log("开始批量查询矿机数据, queryableIds:", queryableIds);

        // 查询生命周期数据
        const lifecycleContracts = queryableIds.map((id) => ({
          address: storageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: "getMachineLifecycle",
          args: [id],
        }));

        console.log("调用multicall查询生命周期数据...");
        const lifecycleResults = await multicall(wagmiConfig, {
          contracts: lifecycleContracts,
        });
        console.log("生命周期查询结果:", lifecycleResults);

        // 处理生命周期数据
        const machineDataMap = new Map<number, MachineData>();
        queryableIds.forEach((id, index) => {
          const lifecycleResult = lifecycleResults[index];

          // 检查查询是否成功
          if (lifecycleResult.status !== "success" || !lifecycleResult.result) {
            console.warn(
              `矿机 ${id} 生命周期数据查询失败:`,
              lifecycleResult.error || "result is undefined",
            );
            return; // 跳过这个矿机
          }

          const lifecycle = lifecycleResult.result;

          // 额外检查：确保 lifecycle 对象有必需的属性
          if (!lifecycle || typeof lifecycle !== "object") {
            console.warn(`矿机 ${id} 生命周期数据格式错误:`, lifecycle);
            return; // 跳过这个矿机
          }

          // 支持数组和对象两种格式
          const lifecycleAny = lifecycle as any;
          const createTime = lifecycleAny.createTime ?? lifecycleAny[0];
          const activatedAt = lifecycleAny.activatedAt ?? lifecycleAny[1];
          const expiredAt = lifecycleAny.expiredAt ?? lifecycleAny[2];
          const mtype = lifecycleAny.mtype ?? lifecycleAny[3];
          const isActivatedStakedLP =
            lifecycleAny.isActivatedStakedLP ?? lifecycleAny[4];
          const isFuelPaid = lifecycleAny.isFuelPaid ?? lifecycleAny[5];
          const isProducing = lifecycleAny.isProducing ?? lifecycleAny[6];
          const destroyed = lifecycleAny.destroyed ?? lifecycleAny[7];
          const producedHours = lifecycleAny.producedHours ?? lifecycleAny[8];
          const lastProduceTime =
            lifecycleAny.lastProduceTime ?? lifecycleAny[9];
          const producedChildCount =
            lifecycleAny.producedChildCount ?? lifecycleAny[10];
          const fuelRemainingMinutes =
            lifecycleAny.fuelRemainingMinutes ?? lifecycleAny[11];

          const machineData: MachineData = {
            id,
            activatedAt: Number(activatedAt),
            createTime: Number(createTime),
            expiredAt: Number(expiredAt),
            destroyed: destroyed,
            isActivatedStakedLP: isActivatedStakedLP,
            isFuelPaid: isFuelPaid,
            isProducing: isProducing,
            lastProduceTime: Number(lastProduceTime),
            producedChildCount: Number(producedChildCount),
            producedHours: Number(producedHours),
            mtype: mtype,
            fuelRemainingMinutes: Number(fuelRemainingMinutes),
            checked: false,
          };
          machineDataMap.set(id, machineData);
        });

        // 查询母矿机生产数据
        const motherMachines = queryableIds.filter((id) => {
          const data = machineDataMap.get(id);
          return data && data.mtype === 1 && data.isActivatedStakedLP;
        });

        if (motherMachines.length > 0) {
          try {
            const productionContracts = motherMachines.map((id) => ({
              address: productionLogicAddress,
              abi: MiningMachineProductionLogicABI,
              functionName: "viewMachineProduction",
              args: [id],
            }));

            const productionResults = await multicall(wagmiConfig, {
              contracts: productionContracts,
            });
            motherMachines.forEach((id, index) => {
              const productionResult = productionResults[index];
              if (
                productionResult.status === "success" &&
                productionResult.result
              ) {
                const data = machineDataMap.get(id);
                if (data) {
                  data.claimableChildren = Number(
                    (productionResult.result as any)[2],
                  );
                }
              } else {
                console.warn(
                  `矿机 ${id} 生产数据查询失败:`,
                  productionResult.error,
                );
              }
            });
          } catch (error) {
            console.warn("查询母矿机生产数据失败:", error);
          }
        }

        // 查询子矿机在售状态
        const childMachines = queryableIds.filter((id) => {
          const data = machineDataMap.get(id);
          return data && data.mtype === 2;
        });

        if (childMachines.length > 0) {
          try {
            const onSaleContracts = childMachines.map((id) => ({
              address: storageAddress,
              abi: MiningMachineSystemStorageABI,
              functionName: "_isOnSale",
              args: [id],
            }));

            const onSaleResults = await multicall(wagmiConfig, {
              contracts: onSaleContracts,
            });
            childMachines.forEach((id, index) => {
              const onSaleResult = onSaleResults[index];
              if (
                onSaleResult.status === "success" &&
                onSaleResult.result !== undefined
              ) {
                const data = machineDataMap.get(id);
                if (data) {
                  data.isOnSale = onSaleResult.result as boolean;
                }
              } else {
                console.warn(
                  `矿机 ${id} 在售状态查询失败:`,
                  onSaleResult.error,
                );
              }
            });
          } catch (error) {
            console.warn("查询子矿机在售状态失败:", error);
          }
        }

        // 缓存所有数据
        setCachedDataBatch(machineDataMap);

        // 返回所有可见矿机的数据（包括缓存的）
        machineIds.forEach((id) => {
          const data = machineDataMap.get(id) || getCachedData(id);
          if (data) result.set(id, data);
        });

        return result;
      } catch (error) {
        console.error("批量查询矿机数据失败:", error);
        console.error("错误详情:", {
          message: (error as any).message,
          stack: (error as any).stack,
          queryableIds,
          wagmiConfig: !!wagmiConfig,
        });
        return result;
      } finally {
        setQuerying(queryableIds, false);
      }
    },
    [
      getMissingIds,
      getCachedData,
      setCachedData,
      setCachedDataBatch,
      canQuery,
      setQuerying,
    ],
  );

  // 初始化查询
  const initializeQuery = useCallback(async () => {
    if (isInitialized || allMachineIds.length === 0) return;

    setIsInitialized(true);
    // 注意：不在这里查询数据，让 handleVisibleDataUpdate 处理可见区域查询
    console.log(
      "initializeQuery 完成，等待 handleVisibleDataUpdate 处理数据查询",
    );
  }, [isInitialized, allMachineIds.length]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (queryTimeout) {
        clearTimeout(queryTimeout);
      }
    };
  }, [queryTimeout]);

  return {
    querySingleMachine,
    queryMachines,
    initializeQuery,
    isQuerying: isQuerying(),
    isInitialized,
  };
};
