import { houseSvg, rocketSvg, selectedSvg, transferSvg } from "@/assets";
import { MachineInfo } from "@/constants/types";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Mask,
  Modal,
  Skeleton,
  Toast,
} from "antd-mobile";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List } from "react-window";
import CheckableItem from "./CheckableItem";
import usePopup from "@/components/usePopup";
import {
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
  MiningMachineSystemLogicExtendABI,
  MiningMachineSystemStorageABI,
  SelluserManagerABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useChainId,
} from "wagmi";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  getTransactionReceipt,
  multicall,
} from "@wagmi/core";
import config from "@/proviers/config";
import {
  erc20Abi,
  formatEther,
  parseEther,
  TransactionReceipt,
  parseGwei,
} from "viem";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { useNavigate } from "react-router-dom";
import { usePaymentCheck } from "@/hooks/usePaymentCheck";
import EmptyComp from "@/components/EmptyComp";
import { useVisibleMachineQuery } from "@/hooks/useVisibleMachineQuery";
import { useMachineDataCache } from "@/hooks/useMachineDataCache";
import MachineRefreshButton from "@/components/MachineRefreshButton";
import { generateCode } from "@/utils/helper";

const Machine = ({
  isShow,
  onRefresh,
}: {
  isShow: boolean;
  onRefresh?: () => void;
}) => {
  const { address: userAddress } = useAccount();
  const [machineList, setMachineList] = useState<MachineInfo[]>([]);
  const [allMachines, setAllMachines] = useState<MachineInfo[]>([]);
  const [activateCount, setActivateCount] = useState<string>("");
  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [fuelList, setFuelList] = useState<MachineInfo[]>([]);
  const [needToPayIdxAmount, setneedToPayIdxAmount] = useState("");
  const [idxBalance, setidxBalance] = useState("");
  const { writeContractAsync } = useWriteContract();
  const { executeSequentialCalls } = useSequentialContractWrite();
  const [claimChildrenCount, setclaimChildrenCount] = useState(0);
  const [mmIds, setMMIds] = useState<number[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedMMIds, setSelectedMMIds] = useState<number[]>([]); // 选中的母矿机ID
  const navigate = useNavigate();
  const [maskVisible, setMaskVisible] = useState(false);
  const [maskCount, setMaskCount] = useState(0);

  const chainConfig = useChainConfig();
  const chainId = useChainId();
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`; // 使用 LOGIC_ADDRESS 进行激活操作
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;
  const MiningMachineSelluserManagerAddress =
    chainConfig.SELLUSER_MANAGER_ADDRESS as `0x${string}`;

  // 新增状态：矿机ID列表和查询状态
  const [allMachineIds, setAllMachineIds] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false); // 添加查询状态检查
  const queryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 防抖定时器
  const hasTriggeredVisibleUpdate = useRef(false); // 防止重复触发可见区域更新
  const recentlyActivatedMachineIds = useRef<number[]>([]); // 保存最近激活的矿机ID，用于刷新时跳过

  // 矿机查询hook
  const {
    querySingleMachine,
    queryMachines,
    initializeQuery,
    isQuerying: isVisibleQuerying,
    isInitialized: queryInitialized,
  } = useVisibleMachineQuery(allMachineIds, {
    debounceDelay: 1000,
  });

  // 缓存管理
  const { clearMachineCache } = useMachineDataCache();

  const isReadyToActivateListLength = useMemo(() => {
    return machineList.filter((item) => !item.isActivatedStakedLP).length || 0;
  }, [machineList]);

  // 切换母矿机ID选中状态
  const toggleMMIdSelection = useCallback((id: number) => {
    setSelectedMMIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id) // 取消选中
          : [...prev, id], // 选中
    );
  }, []);

  // 新的按需查询函数
  const handleQuery = useCallback(async () => {
    // 防止重复查询
    if (isQuerying) {
      console.log("正在查询中，跳过重复查询");
      return;
    }

    try {
      setIsQuerying(true);
      setIsQueryLoading(true);
      console.log("开始查询矿机ID列表...");

      // 1. 获取当前用户的所有矿机ID
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "getOwnerToMachineIds",
        args: [userAddress],
      });

      // 转换为数字类型的ID列表
      const machineIds = (res as bigint[]).map((id) => Number(id));
      console.log("=== 矿机ID分析 ===");
      console.log("获取到矿机ID列表:", machineIds);
      console.log("矿机总数:", machineIds.length);

      if (machineIds.length === 0) {
        console.log("当前用户没有任何矿机");
        setMachineList([]);
        setAllMachines([]);
        setMMIds([]);
        setclaimChildrenCount(0);
        setSelectedMMIds([]);
        setAllMachineIds([]);
        return;
      }

      // 设置矿机ID列表
      setAllMachineIds(machineIds);

      // 注意：initializeQuery 将在 allMachineIds 更新后通过 useEffect 自动调用
    } catch (error) {
      console.error("查询矿机ID列表失败:", error);
      setMachineList([]);
      setAllMachines([]);
      setMMIds([]);
      setclaimChildrenCount(0);
      setSelectedMMIds([]);
      setAllMachineIds([]);
    } finally {
      setIsQueryLoading(false);
      setIsQuerying(false);
    }
  }, [userAddress, initializeQuery]); // 移除isQuerying依赖避免循环

  // 处理可见区域数据更新
  const handleVisibleDataUpdate = useCallback(
    async (skipMachineIds: number[] = []) => {
      console.log(
        "handleVisibleDataUpdate 被调用, allMachineIds.length:",
        allMachineIds.length,
        "skipMachineIds:",
        skipMachineIds,
      );
      if (allMachineIds.length === 0) return;

      try {
        // 查询所有矿机，而不仅仅是可见区域的
        console.log("查询所有矿机数据:", allMachineIds);
        const machineDataMap = await queryMachines(allMachineIds);

        // 如果查询失败，不更新状态
        if (!machineDataMap || machineDataMap.size === 0) {
          console.warn("查询矿机数据失败，跳过状态更新");
          return;
        }

        // 更新矿机列表
        const updatedMachines = Array.from(machineDataMap.values());
        console.log("=== 矿机数据详细分析 ===");
        console.log("查询到的矿机数据:", updatedMachines);
        console.log(
          "矿机详细状态:",
          updatedMachines.map((m) => ({
            id: m.id,
            mtype: m.mtype,
            isOnSale: m.isOnSale,
            isActivatedStakedLP: m.isActivatedStakedLP,
            activatedAt: m.activatedAt,
            createTime: m.createTime,
            expiredAt: m.expiredAt,
            destroyed: m.destroyed,
          })),
        );

        // 分析矿机类型分布
        const motherMachines = updatedMachines.filter((m) => m.mtype === 1);
        const childMachines = updatedMachines.filter((m) => m.mtype === 2);
        console.log(
          "母矿机数量:",
          motherMachines.length,
          "ID:",
          motherMachines.map((m) => m.id),
        );
        console.log(
          "子矿机数量:",
          childMachines.length,
          "ID:",
          childMachines.map((m) => m.id),
        );

        // 分析子矿机状态
        const activatedChildren = childMachines.filter(
          (m) => m.isActivatedStakedLP,
        );
        const unactivatedChildren = childMachines.filter(
          (m) => !m.isActivatedStakedLP,
        );
        const onSaleChildren = childMachines.filter((m) => m.isOnSale);
        const notOnSaleChildren = childMachines.filter((m) => !m.isOnSale);

        console.log(
          "已激活子矿机:",
          activatedChildren.length,
          "ID:",
          activatedChildren.map((m) => m.id),
        );
        console.log(
          "未激活子矿机:",
          unactivatedChildren.length,
          "ID:",
          unactivatedChildren.map((m) => m.id),
        );
        console.log(
          "在售子矿机:",
          onSaleChildren.length,
          "ID:",
          onSaleChildren.map((m) => m.id),
        );
        console.log(
          "未在售子矿机:",
          notOnSaleChildren.length,
          "ID:",
          notOnSaleChildren.map((m) => m.id),
        );

        // 更新 allMachines：优先使用查询到的最新数据
        // 注意：如果某个矿机在 updatedMachines 中，说明它被重新查询了，应该使用最新数据
        // 如果不在 updatedMachines 中，说明它没有被查询（可能因为缓存有效），保留旧数据
        setAllMachines((prev) => {
          const newMachines = new Map<number, any>();

          // 先添加查询到的最新数据（这些数据是最新的，优先使用）
          updatedMachines.forEach((machine) => {
            // 如果这个矿机在 skipMachineIds 中，强制标记为已激活
            if (skipMachineIds.includes(machine.id)) {
              console.log(
                `在 allMachines 更新时强制标记矿机 ${machine.id} 为已激活`,
              );
              newMachines.set(machine.id, {
                ...machine,
                isActivatedStakedLP: true,
              });
            } else {
              newMachines.set(machine.id, machine);
            }
          });

          // 对于 allMachineIds 中存在但 updatedMachines 中没有的矿机，保留旧数据
          // 这样可以避免丢失数据，但已激活的矿机应该已经被查询到了（因为缓存已清除）
          allMachineIds.forEach((id) => {
            if (!newMachines.has(id)) {
              const oldMachine = prev.find((m) => m.id === id);
              if (oldMachine) {
                // 如果这个矿机在 skipMachineIds 中，强制标记为已激活
                if (skipMachineIds.includes(id)) {
                  console.log(
                    `在 allMachines 更新时强制标记旧矿机 ${id} 为已激活`,
                  );
                  newMachines.set(id, {
                    ...oldMachine,
                    isActivatedStakedLP: true,
                  });
                } else {
                  newMachines.set(id, oldMachine);
                }
              }
            }
          });

          return Array.from(newMachines.values());
        });

        // 筛选子矿机用于显示
        console.log("筛选出的子矿机:", childMachines);

        // 如果有 skipMachineIds，强制将这些矿机标记为已激活（即使区块链数据还没更新）
        const childMachinesWithSkip = childMachines.map((m) => {
          if (skipMachineIds.includes(m.id)) {
            console.log(`强制跳过矿机 ${m.id}（刚激活，区块链数据可能未更新）`);
            return { ...m, isActivatedStakedLP: true };
          }
          return m;
        });

        const finalChildList = childMachinesWithSkip
          .filter((m) => {
            const isNotOnSale = !m.isOnSale;
            const isNotActivated = !m.isActivatedStakedLP;
            console.log(
              `矿机 ${m.id} 筛选条件: isOnSale=${m.isOnSale}(${isNotOnSale}), isActivatedStakedLP=${m.isActivatedStakedLP}(${isNotActivated})`,
            );
            return isNotOnSale && isNotActivated;
          })
          .sort((a, b) => a.activatedAt - b.activatedAt);

        console.log("=== 最终显示逻辑分析 ===");
        console.log("筛选条件: !isOnSale && !isActivatedStakedLP");
        console.log("符合条件的子矿机:", finalChildList);
        console.log("最终显示数量:", finalChildList.length);
        console.log(
          "应该显示的矿机ID:",
          finalChildList.map((m) => m.id),
        );
        setMachineList(finalChildList);

        // 更新母矿机ID列表
        const activatedMotherMachines = updatedMachines.filter(
          (m) => m.mtype === 1 && m.isActivatedStakedLP,
        );
        const claimableMotherMachines = activatedMotherMachines.filter(
          (m) => (m.claimableChildren || 0) > 0,
        );
        const mmIds = claimableMotherMachines.map((m) => m.id);
        setMMIds(mmIds);

        // 计算可领取子矿机总数
        const totalClaimable = claimableMotherMachines.reduce(
          (sum, m) => sum + (m.claimableChildren || 0),
          0,
        );
        setclaimChildrenCount(totalClaimable);
      } catch (error) {
        console.error("更新可见区域数据失败:", error);
      }
    },
    [allMachineIds, queryMachines, clearMachineCache],
  );

  // 监听 allMachineIds 变化，自动初始化查询
  useEffect(() => {
    if (allMachineIds.length > 0 && !queryInitialized) {
      console.log("allMachineIds 已更新，调用 initializeQuery");
      initializeQuery();
    }
  }, [allMachineIds, queryInitialized, initializeQuery]);

  // 监听查询初始化完成，触发数据更新
  useEffect(() => {
    if (queryInitialized && !isQuerying && !hasTriggeredVisibleUpdate.current) {
      hasTriggeredVisibleUpdate.current = true;
      // 使用 recentlyActivatedMachineIds 来跳过最近激活的矿机
      handleVisibleDataUpdate(recentlyActivatedMachineIds.current);
    }
  }, [queryInitialized, isQuerying, handleVisibleDataUpdate]);

  // 单台矿机刷新处理
  const handleSingleMachineRefresh = useCallback(
    async (machineId: number, newData: any) => {
      try {
        // 更新矿机数据
        setAllMachines((prev) => {
          const newMachines = [...prev];
          const index = newMachines.findIndex((m) => m.id === machineId);
          if (index >= 0) {
            newMachines[index] = { ...newMachines[index], ...newData };
          } else {
            newMachines.push(newData);
          }
          return newMachines;
        });

        // 如果是子矿机，更新显示列表
        if (newData.mtype === 2) {
          setMachineList((prev) => {
            const newList = [...prev];
            const index = newList.findIndex((m) => m.id === machineId);
            if (index >= 0) {
              newList[index] = { ...newList[index], ...newData };
            } else if (!newData.isOnSale && !newData.isActivatedStakedLP) {
              newList.push(newData);
              newList.sort((a, b) => a.activatedAt - b.activatedAt);
            }
            return newList;
          });
        }

        // 如果是母矿机，更新母矿机ID列表
        if (newData.mtype === 1 && newData.isActivatedStakedLP) {
          setMMIds((prev) => {
            if (newData.claimableChildren > 0 && !prev.includes(machineId)) {
              return [...prev, machineId];
            } else if (
              newData.claimableChildren === 0 &&
              prev.includes(machineId)
            ) {
              return prev.filter((id) => id !== machineId);
            }
            return prev;
          });

          // 更新可领取子矿机总数
          setclaimChildrenCount((prev) => {
            const oldData = allMachines.find((m) => m.id === machineId);
            const oldClaimable = oldData?.claimableChildren || 0;
            const newClaimable = newData.claimableChildren || 0;
            return prev - oldClaimable + newClaimable;
          });
        }
      } catch (error) {
        console.error("更新单台矿机数据失败:", error);
      }
    },
    [allMachines],
  );

  // 全量刷新处理
  const handleFullRefresh = useCallback(async () => {
    try {
      setIsQueryLoading(true);
      console.log("开始全量刷新矿机数据...");

      // 清除所有缓存
      const { clearCache } = useMachineDataCache();
      clearCache();

      // 重新查询所有数据
      await handleQuery();

      Toast.show({
        content: "刷新成功",
        position: "center",
        duration: 2000,
      });
    } catch (error) {
      console.error("全量刷新失败:", error);
      Toast.show({
        content: "刷新失败，请重试",
        position: "center",
        duration: 2000,
      });
    } finally {
      setIsQueryLoading(false);
    }
  }, [handleQuery]);

  // 同步mmIds的useEffect（仅保留基础校验，实际筛选逻辑在handleQuery中完成）
  useEffect(() => {
    if (allMachines.length === 0 || isQuerying) return;

    // 此处仅做基础同步，核心筛选逻辑在handleQuery中通过实时接口数据完成
    const syncedMmIds = allMachines
      .filter((machine) => machine.mtype === 1 && machine.isActivatedStakedLP)
      .map((machine) => machine.id);

    // 仅当mmIds与实际有效母矿机ID完全不一致时才更新（避免无效触发）
    if (syncedMmIds.join(",") !== mmIds.join(",") && mmIds.length === 0) {
      console.log("初始化同步母矿机ID列表:", syncedMmIds);
      setMMIds(syncedMmIds);
      setSelectedMMIds([]);
    }
  }, [allMachines, mmIds]); // 保持当前依赖，通过条件检查避免在查询时执行

  const handleClaimChildren = useCallback(async () => {
    try {
      setIsClaiming(true);
      console.log("开始批量领取子矿机，选中的母矿机ID列表:", selectedMMIds);

      if (selectedMMIds.length === 0) {
        console.log("没有选择任何母矿机");
        Toast.show({ content: "请先选择要领取的母矿机", position: "center" });
        return;
      }

      // 如果选择超过 10 个，给出警告
      if (selectedMMIds.length > 10) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.show({
            bodyStyle: {
              background: "#ffffff",
              borderRadius: "20px",
              padding: "20px",
            },
            closeOnMaskClick: false,
            content: (
              <div className="text-center">
                <div className="text-[18px] font-bold mb-4 text-[#333]">
                  ⚠️ 温馨提示
                </div>
                <div className="text-[14px] text-[#666] mb-3 text-left">
                  <p className="mb-2">
                    您选择了{" "}
                    <span className="font-bold text-[#ff6b6b]">
                      {selectedMMIds.length}
                    </span>{" "}
                    个母矿机
                  </p>
                  <p className="mb-2 text-[#ff6b6b]">
                    ⚠️ 建议每次不超过 10 个，以避免 Gas 不足
                  </p>
                  <p className="text-[12px] text-[#999] mt-3">
                    如果继续，可能会因为 Gas 不足导致交易失败
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 bg-[#f0f0f0] text-[#666] rounded-3xl py-2 text-[14px]"
                    onClick={() => {
                      Modal.clear();
                      resolve(false);
                    }}
                  >
                    重新选择
                  </button>
                  <button
                    className="flex-1 bg-[#ff6b6b] text-white rounded-3xl py-2 text-[14px]"
                    onClick={() => {
                      Modal.clear();
                      resolve(true);
                    }}
                  >
                    继续领取
                  </button>
                </div>
              </div>
            ),
          });
        });

        if (!confirmed) {
          setIsClaiming(false);
          return;
        }
      }

      const validationResult = {
        validIds: [] as number[],
        invalidIds: [] as string[],
      };

      selectedMMIds.forEach((id) => {
        const machine = allMachines.find((m) => m.id === id);

        if (!machine) {
          validationResult.invalidIds.push(`ID=${id}（不在所有矿机列表中）`);
          return;
        }

        if (machine.mtype !== 1) {
          validationResult.invalidIds.push(
            `ID=${id}（非母矿机，mtype=${machine.mtype}）`,
          );
        } else if (!machine.isActivatedStakedLP) {
          validationResult.invalidIds.push(`ID=${id}（母矿机未激活）`);
        } else {
          validationResult.validIds.push(id);
        }
      });

      if (validationResult.invalidIds.length > 0) {
        console.error(
          `发现${validationResult.invalidIds.length}个无效矿机: ${validationResult.invalidIds.join("; ")}`,
        );
        Toast.show({
          content: `存在无效矿机，请刷新后重试（共${validationResult.invalidIds.length}个）`,
          position: "center",
        });
        handleQuery();
        return;
      }

      console.log("校验通过的母矿机ID:", validationResult.validIds);

      // 动态计算 Gas Limit（批量领取子矿机）
      // 分析：claimChildrenByMachineIds 对每个母矿机执行以下操作：
      //
      // 合约常量：
      //   - MOTHER_PRODUCE_INTERVAL = 1 (分钟) - 每1分钟可以生产1台子矿机
      //   - MOTHER_LIFETIME = 9 (分钟) - 总生命周期9分钟
      //   - 最大子矿机数 = 9 / 1 = 9台
      //
      // 每台母矿机的gas消耗（最坏情况：产生9台子矿机）：
      // 1. 验证：约10k-14k gas
      // 2. 计算可产子矿机数量：约5k gas
      // 3. _createChildMachines（创建9台子矿机）：
      //    - 每台子矿机：setMachine(20k) + pushOwnerToMachineId(20k) + setMachineLifecycle(50k-100k) + recordMachineMint(30k)
      //    - 9台子矿机：9 * 150k = 1.35M gas（最坏情况）
      // 4. store.setMachineLifecycle()：约50k-100k gas
      // 5. history.recordEarning()：约30k-50k gas
      // 6. emit ChildMachinesClaimed()：约1k gas
      //
      // 总计每台母矿机（最坏情况）：1.35M + 200k = 1.55M gas
      // 考虑到实际可能不是每次都产生9台（可能是1-9台），取 1.5M gas 作为安全值
      //
      // 注意：原来的200k设置严重不足，无法覆盖实际需求
      const baseGas = 250000n; // 基础开销（函数调用 + 循环初始化 + 返回值准备）
      const perMachineGas = 1500000n; // 每台母矿机的gas（从200000n提高到1500000n，覆盖最坏情况9台子矿机）
      // 计算示例：
      //   1台母矿机 = 1.75M gas
      //   10台母矿机 = 15.25M gas
      //   15台母矿机 = 22.75M gas
      //   16台母矿机 = 24.25M gas（接近25M上限）
      //
      // 注意：BSC block gas limit = 30M，为了安全起见，设置上限为 25M
      const MAX_GAS_LIMIT = 25000000n; // 25M gas limit，留出5M的安全余量
      const calculatedGasLimit =
        baseGas + BigInt(validationResult.validIds.length) * perMachineGas;

      // 检查是否超过最大gas limit
      if (calculatedGasLimit > MAX_GAS_LIMIT) {
        const maxMachines = Math.floor(
          Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
        );
        const errorMsg = `一次最多只能领取 ${maxMachines} 台母矿机的子矿机，当前选择了 ${validationResult.validIds.length} 台，请减少数量后重试`;
        console.error(`❌ ${errorMsg}`);
        Toast.show({
          content: errorMsg,
          position: "center",
          duration: 5000,
        });
        setIsClaiming(false);
        return; // 提前返回，不发送交易
      }

      const gasLimit = calculatedGasLimit;

      console.log(
        `计算的 Gas Limit: ${gasLimit.toString()} (${validationResult.validIds.length} 台母矿机，计算值: ${calculatedGasLimit.toString()})`,
      );

      const hash = await writeContract(config, {
        address: MiningMachineProductionLogicAddress as `0x${string}`,
        abi: MiningMachineProductionLogicABI,
        functionName: "claimChildrenByMachineIds",
        args: [validationResult.validIds],
        gas: gasLimit, // 动态计算 gas limit
        chainId,
      });
      console.log("批量领取子矿机交易已发送，哈希:", hash);

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId,
      });
      console.log("批量领取子矿机交易已确认，区块号:", receipt.blockNumber);

      // 刷新数据
      setclaimChildrenCount(0);
      setSelectedMMIds([]); // 清空选中状态
      handleQuery();
      Toast.show({ content: "子矿机领取成功", position: "center" });
    } catch (error) {
      console.error("领取子矿机失败:", error);
      let errorMsg = "领取失败: 未知错误";
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // 检测 Gas 不足
        if (
          errorMessage.includes("out of gas") ||
          errorMessage.includes("gas required exceeds allowance") ||
          errorMessage.includes("intrinsic gas too low")
        ) {
          errorMsg = `Gas 不足。当前尝试领取 ${selectedMMIds.length} 台母矿机的子矿机，建议减少数量分批领取（每批建议不超过 100 台）`;
        }
        // 检测其他错误
        else if (error.message.includes("No machines specified")) {
          errorMsg = "领取失败: 未指定母矿机";
        } else if (error.message.includes("Machine not owned")) {
          errorMsg = "领取失败: 不是矿机所有者";
        } else if (error.message.includes("Not a mother machine")) {
          errorMsg = "领取失败: 包含非母矿机ID，请刷新列表";
          handleQuery();
        } else if (error.message.includes("Mother not active")) {
          errorMsg = "领取失败: 母矿机未激活";
        } else if (error.message.includes("No children to claim")) {
          errorMsg = "领取失败: 没有可领取的子矿机";
        } else {
          errorMsg = `领取失败: ${error.message}`;
        }
      }
      Toast.show({ content: errorMsg, position: "center", duration: 4000 });
    } finally {
      setIsClaiming(false);
    }
  }, [handleQuery, selectedMMIds, allMachines]);

  useEffect(() => {
    if (isShow) {
      // 重置触发标志
      hasTriggeredVisibleUpdate.current = false;

      // 清除之前的定时器
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }

      // 设置防抖查询，但只在没有正在查询时才执行
      queryTimeoutRef.current = setTimeout(() => {
        if (!isQuerying) {
          console.log("页面显示，开始查询矿机数据");
          handleQuery();
        }
      }, 500); // 500ms防抖延迟
    }
    if (!isShow) {
      console.log("页面临时隐藏，清空选中列表");
      setFuelList([]);
      setActivateCount("");
      setSelectedMMIds([]); // 清空选中的母矿机

      // 清除定时器
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
        queryTimeoutRef.current = null;
      }
    }
  }, [isShow]); // 只依赖isShow，通过setTimeout内部检查避免循环

  // 清理定时器
  useEffect(() => {
    return () => {
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectByCount = () => {
    const count = parseInt(activateCount, 10);

    if (isNaN(count) || count < 0) {
      Toast.show({
        content: "请输入有效的数量",
        position: "center",
      });
      return;
    }

    const activatableMachines = machineList.filter(
      (item) => !item.isActivatedStakedLP,
    );

    const actualCount = Math.min(count, activatableMachines.length);

    // 检查余额是否足够
    const totalCost = +needToPayIdxAmount * actualCount;
    const balance = +idxBalance;

    console.log(
      `根据数量选择矿机: ${actualCount} 台, 需要 ${totalCost} IDX, 余额 ${balance} IDX`,
    );

    if (balance < totalCost) {
      // 计算最多能选择多少台
      const maxAffordable = Math.floor(balance / +needToPayIdxAmount);

      Modal.show({
        bodyStyle: {
          background: "#ffffff",
          borderRadius: "20px",
          padding: "20px",
        },
        closeOnMaskClick: true,
        content: (
          <div className="text-center">
            <div className="text-[18px] font-bold mb-4 text-[#ff6b6b]">
              ⚠️ IDX 余额不足
            </div>
            <div className="text-[14px] text-[#666] mb-3 text-left">
              <p className="mb-2">
                想要选择:{" "}
                <span className="font-bold text-[#7334FE]">{actualCount}</span>{" "}
                台矿机
              </p>
              <p className="mb-2">
                需要费用:{" "}
                <span className="font-bold text-[#ff6b6b]">
                  {totalCost.toFixed(2)}
                </span>{" "}
                IDX
              </p>
              <p className="mb-2">
                当前余额:{" "}
                <span className="font-bold">{balance.toFixed(2)}</span> IDX
              </p>
              <p className="text-[#ff6b6b] font-bold mb-2">
                缺少: {(totalCost - balance).toFixed(2)} IDX
              </p>
              <div className="bg-[#f0f0f0] p-3 rounded-lg mt-3">
                <p className="text-[#7334FE] font-bold">
                  💡 您最多可以选择 {maxAffordable} 台矿机
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-[#f0f0f0] text-[#666] rounded-3xl py-2 text-[14px]"
                onClick={() => Modal.clear()}
              >
                取消
              </button>
              {maxAffordable > 0 && (
                <button
                  className="flex-1 bg-[#7334FE] text-white rounded-3xl py-2 text-[14px]"
                  onClick={() => {
                    Modal.clear();
                    setActivateCount(maxAffordable.toString());
                    // 自动选择最大可负担数量
                    setMachineList((prevList) => {
                      return prevList.map((item, index) => {
                        if (!item.isActivatedStakedLP) {
                          return {
                            ...item,
                            checked: index < maxAffordable,
                          };
                        }
                        return item;
                      });
                    });
                    setFuelList(activatableMachines.slice(0, maxAffordable));
                  }}
                >
                  选择 {maxAffordable} 台
                </button>
              )}
            </div>
          </div>
        ),
      });
      return;
    }

    setMachineList((prevList) => {
      return prevList.map((item, index) => {
        if (!item.isActivatedStakedLP) {
          return {
            ...item,
            checked: index < actualCount,
          };
        }
        return item;
      });
    });

    // 更新选中列表
    setFuelList(activatableMachines.slice(0, actualCount));
  };

  const getChekeIcon = (checked: boolean): React.ReactNode =>
    checked ? (
      <img src={selectedSvg} alt="" width={16} height={16} />
    ) : (
      <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
    );

  // 实时检查激活矿机的 gas limit
  useEffect(() => {
    if (fuelList.length === 0) return;

    const baseGas = 350000n;
    const perMachineGas = 400000n;
    const MAX_GAS_LIMIT = 25000000n;
    const calculatedGasLimit =
      baseGas + BigInt(fuelList.length) * perMachineGas;

    if (calculatedGasLimit > MAX_GAS_LIMIT) {
      const maxMachines = Math.floor(
        Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
      );
      Toast.show({
        content: `一次最多只能激活 ${maxMachines} 台矿机，当前选择了 ${fuelList.length} 台，请减少数量后重试`,
        position: "center",
        duration: 3000,
      });
    }
  }, [fuelList.length]);

  // 实时检查领取子矿机的 gas limit
  useEffect(() => {
    if (selectedMMIds.length === 0) return;

    const baseGas = 250000n;
    const perMachineGas = 1500000n;
    const MAX_GAS_LIMIT = 25000000n;
    const calculatedGasLimit =
      baseGas + BigInt(selectedMMIds.length) * perMachineGas;

    if (calculatedGasLimit > MAX_GAS_LIMIT) {
      const maxMachines = Math.floor(
        Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
      );
      Toast.show({
        content: `一次最多只能领取 ${maxMachines} 台母矿机的子矿机，当前选择了 ${selectedMMIds.length} 台，请减少数量后重试`,
        position: "center",
        duration: 3000,
      });
    }
  }, [selectedMMIds.length]);

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = claimChildrenCount > 0 ? 170 : 139;
      const newHeight = windowHeight - topSectionHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [claimChildrenCount]);

  const handleLeftClick = useCallback(
    (item: MachineInfo) => {
      console.log(`点击选择矿机，ID: ${item.id}，当前状态: ${item.checked}`);

      const isItemChecked = !item.checked;

      // 如果是选中操作，检查余额是否足够
      if (isItemChecked) {
        const newCount = fuelList.length + 1;
        const totalCost = +needToPayIdxAmount * newCount;
        const balance = +idxBalance;

        console.log(`余额检查: 需要 ${totalCost} IDX, 余额 ${balance} IDX`);

        if (balance < totalCost) {
          Modal.show({
            bodyStyle: {
              background: "#ffffff",
              borderRadius: "20px",
              padding: "20px",
            },
            closeOnMaskClick: true,
            content: (
              <div className="text-center">
                <div className="text-[18px] font-bold mb-4 text-[#ff6b6b]">
                  ⚠️ IDX 余额不足
                </div>
                <div className="text-[14px] text-[#666] mb-3 text-left">
                  <p className="mb-2">
                    已选择:{" "}
                    <span className="font-bold text-[#7334FE]">
                      {fuelList.length}
                    </span>{" "}
                    台矿机
                  </p>
                  <p className="mb-2">
                    {fuelList.length === 0 ? "激活" : "再选择"} 1 台需要:{" "}
                    <span className="font-bold text-[#ff6b6b]">
                      {(+needToPayIdxAmount).toFixed(2)}
                    </span>{" "}
                    IDX
                  </p>
                  <p className="mb-2">
                    总费用:{" "}
                    <span className="font-bold text-[#ff6b6b]">
                      {totalCost.toFixed(2)}
                    </span>{" "}
                    IDX
                  </p>
                  <p className="mb-2">
                    当前余额:{" "}
                    <span className="font-bold">{balance.toFixed(2)}</span> IDX
                  </p>
                  <p className="text-[#ff6b6b] font-bold">
                    缺少: {(totalCost - balance).toFixed(2)} IDX
                  </p>
                </div>
                <div className="text-[12px] text-[#999] mb-4">
                  请充值 IDX 或减少选择的矿机数量
                </div>
                <button
                  className="w-full bg-[#7334FE] text-white rounded-3xl py-2 text-[14px]"
                  onClick={() => Modal.clear()}
                >
                  知道了
                </button>
              </div>
            ),
          });
          return; // 阻止选中
        }
      }

      setMachineList((prevItems) => {
        const newItems = prevItems.map((e) => {
          if (!e.isActivatedStakedLP) {
            return e.id === item.id ? { ...e, checked: !e.checked } : e;
          }
          // 已经激活的机器不可以再次激活 也不可选中
          return e;
        });

        if (isItemChecked) {
          setFuelList([...fuelList, item]);
        } else {
          const list = fuelList.filter((e) => e.id !== item.id);
          setFuelList(list);
        }

        return newItems;
      });
    },
    [fuelList, needToPayIdxAmount, idxBalance],
  );

  const handleRightClick = (item: MachineInfo) => {
    console.log(`点击查看矿机详情，ID: ${item.id}`);
    navigate("/user/machineDetail", { state: item });
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
          }}
        >
          <div style={{ flex: 1 }}>
            <CheckableItem
              item={item}
              onLeftClick={handleLeftClick}
              onRightClick={handleRightClick}
            />
          </div>
          {/* 暂时隐藏刷新按钮 */}
          {/* <div style={{ marginLeft: '10px' }}>
            <MachineRefreshButton
              machineId={item.id}
              onRefresh={handleSingleMachineRefresh}
              size="mini"
            />
          </div> */}
        </div>
      );
    },
  );

  const [isPaying, setIsPaying] = useState(false);

  const {
    data: idxPrice,
    isLoading: idxPriceLoading,
    error: idxPriceError,
  } = useReadContract({
    address: MiningMachineSystemLogicAddress,
    abi: MiningMachineSystemLogicABI,
    functionName: "getIDXAmount",
    args: [30],
  });

  const {
    data: idxData,
    isLoading: idxBalanceLoading,
    error: idxBalanceError,
  } = useReadContract({
    address: IDX_CONTRACTS_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [userAddress!],
  });

  useEffect(() => {
    if (!idxBalanceLoading) {
      const balance = idxData ? formatEther(idxData) : "0";
      console.log(`更新IDX钱包余额: ${balance}`);
      setidxBalance(balance);
    }
  }, [idxBalanceLoading, idxData]);

  useEffect(() => {
    if (!idxPriceLoading) {
      const price = idxPrice ? formatEther(idxPrice) : "0";
      console.log(`更新单台矿机激活费用: ${price} IDX`);
      setneedToPayIdxAmount(price);
    }
  }, [idxPriceLoading, idxPrice]);

  const handleActivate = async () => {
    if (fuelList.length === 0) {
      Toast.show({
        content: "请选择要激活的矿机",
        position: "center",
        duration: 2000,
      });
      return;
    }

    console.log(
      `准备激活选中的矿机，共${fuelList.length}台，ID列表:`,
      fuelList.map((item) => item.id),
    );
    setOpen(true);
  };

  const { isLoading: isPaymentCheckLoading, isAllowanceSufficient } =
    usePaymentCheck({
      paymentAmount: parseEther(
        String(Math.ceil(+needToPayIdxAmount * fuelList.length)),
      ),
      tokenAddress: IDX_CONTRACTS_ADDRESS,
      spenderAddress: MiningMachineSystemLogicAddress,
    });

  const handlePay = async () => {
    try {
      if (isPaymentCheckLoading) return;

      setMaskCount(1);
      setMaskVisible(true);
      setIsPaying(true);

      console.log("=== 开始激活矿机流程 ===");
      console.log("选中的矿机数量:", fuelList.length);
      console.log(
        "选中的矿机ID:",
        fuelList.map((item) => item.id),
      );
      console.log("单台费用:", needToPayIdxAmount, "IDX");
      console.log("总费用:", +needToPayIdxAmount * fuelList.length, "IDX");
      console.log("当前授权状态:", isAllowanceSufficient ? "已授权" : "未授权");
      console.log("IDX 余额:", idxBalance, "IDX");

      // 1. 检查并处理智能授权
      if (!isAllowanceSufficient) {
        console.log("=== 开始授权流程 ===");
        console.log("授权地址:", MiningMachineSystemLogicAddress);

        // 计算实际需要的金额（使用实际的激活费用）
        const actualAmount = parseEther(
          String(+needToPayIdxAmount * fuelList.length),
        );
        const smartAllowance = actualAmount * 30n; // 授权30倍，避免频繁授权

        console.log("实际需要金额:", formatEther(actualAmount), "IDX");
        console.log("期望智能授权额度:", formatEther(smartAllowance), "IDX");

        // 先查询当前allowance值
        console.log("查询当前allowance值...");
        const currentAllowance = (await readContract(config, {
          address: IDX_CONTRACTS_ADDRESS,
          abi: erc20Abi,
          functionName: "allowance",
          args: [userAddress!, MiningMachineSystemLogicAddress],
        })) as bigint;

        console.log("当前allowance值:", formatEther(currentAllowance), "IDX");

        // 检查当前allowance是否已经足够
        if (currentAllowance >= actualAmount) {
          console.log("✅ 当前allowance已足够，无需重新授权");
        } else {
          console.log("❌ 当前allowance不足，执行授权");
          console.log(
            "缺少授权:",
            formatEther(actualAmount - currentAllowance),
            "IDX",
          );

          // 执行授权
          console.log("发送授权交易...");
          const approveHash = await writeContractAsync({
            address: IDX_CONTRACTS_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [MiningMachineSystemLogicAddress, smartAllowance],
            gas: 350000n,
          });
          console.log("✅ 授权交易已发送，哈希:", approveHash);

          // 等待授权交易确认
          console.log("等待授权交易确认...");
          const approveReceipt = await waitForTransactionReceipt(config, {
            hash: approveHash,
            chainId,
          });
          console.log("✅ 授权交易已确认，区块号:", approveReceipt.blockNumber);

          // 等待 1 秒确保授权生效
          console.log("等待授权生效...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } else {
        console.log("✅ 授权已充足，跳过授权步骤");
      }

      // 2. 提取所有选中矿机的ID组成数组
      const machineIds = fuelList.map((item) => item.id);
      console.log("=== 开始激活矿机 ===");
      console.log("准备激活的矿机ID列表:", machineIds);

      // 注意：这些矿机ID都是通过 getOwnerToMachineIds 查询得到的，
      // 已经确认属于当前用户，无需再次验证所有权

      // 2.5. 在激活前再次检查矿机状态（防止状态变化）
      console.log("=== 激活前状态检查 ===");
      for (const machineId of machineIds) {
        try {
          const lifecycle = await readContract(config, {
            address: MiningMachineSystemStorageAddress,
            abi: MiningMachineSystemStorageABI,
            functionName: "getMachineLifecycle",
            args: [BigInt(machineId)],
            chainId,
          });

          const isActivated =
            (lifecycle as any).isActivatedStakedLP ?? lifecycle[4];
          const isDestroyed = (lifecycle as any).destroyed ?? lifecycle[5];
          const isOnSale = await readContract(config, {
            address: MiningMachineSystemStorageAddress,
            abi: MiningMachineSystemStorageABI,
            functionName: "_isOnSale",
            args: [BigInt(machineId)],
            chainId,
          });

          if (isActivated) {
            throw new Error(
              `矿机 ${machineId} 已经激活，无需重复激活。请刷新页面查看最新状态。`,
            );
          }
          if (isDestroyed) {
            throw new Error(`矿机 ${machineId} 已销毁，无法激活`);
          }
          if (isOnSale) {
            throw new Error(`矿机 ${machineId} 正在出售中，无法激活`);
          }
          console.log(`✅ 矿机 ${machineId} 状态检查通过`);
        } catch (error) {
          if (error instanceof Error && error.message.includes("矿机")) {
            throw error;
          }
          console.warn(`检查矿机 ${machineId} 状态时出错:`, error);
        }
      }

      // 3. 执行批量激活合约调用
      // 动态计算 Gas Limit（按最复杂奖励过程计算）
      //
      // 基于实际失败交易数据优化（tx: 0x7836f22e...）：
      // - 场景：激活1台矿机，已激活30台（触发里程碑），11层推荐人（使用前5层）
      // - Gas Used: 792,438 (Gas Limit: 800,000 导致失败)
      //
      // 分析：batchActivateMachinesWithLP 对每个矿机执行以下操作：
      // 1. 验证循环（每台矿机）：
      //    - store.machines(machineId) - SLOAD读取，约2k gas
      //    - store.getMachineLifecycle(machineId) - 结构体读取，多个SLOAD，约8k-12k gas
      //    - store._isOnSale(machineId) - SLOAD读取，约2k gas
      //    总计每台验证约 12k-16k gas
      //
      // 2. IDX转账（一次性，所有矿机共享）：
      //    - getIDXAmount(lpUsd) - 可能涉及外部调用，约10k-30k gas
      //    - IERC20.transferFrom（IDX代理合约） - ERC20转账，约50k-100k gas
      //    总计约 60k-130k gas（所有矿机共享）
      //
      // 3. 更新循环（每台矿机）：
      //    - store.getMachineLifecycle(machineId) - SLOAD读取，约8k-12k gas
      //    - store.setMachineLifecycle(machineId, m) - 结构体写入，多个SSTORE，约50k-100k gas
      //    总计每台更新约 60k-120k gas
      //
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
      //
      // BSC block gas limit = 140M，为了安全起见，设置上限为 25M
      const baseGas = 1100000n; // 基础开销（基于实际失败数据 792k + 39%安全余量）
      const perMachineGas = 150000n; // 每台矿机的gas（验证 + 更新状态 + 61%安全余量）
      const MAX_GAS_LIMIT = 25000000n; // 25M gas limit，留出5M的安全余量
      const calculatedGasLimit =
        baseGas + BigInt(machineIds.length) * perMachineGas;

      // 检查是否超过最大gas limit
      if (calculatedGasLimit > MAX_GAS_LIMIT) {
        const maxMachines = Math.floor(
          Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas),
        );
        const errorMsg = `一次最多只能激活 ${maxMachines} 台矿机，当前选择了 ${machineIds.length} 台，请减少数量后重试`;
        console.error(`❌ ${errorMsg}`);
        Toast.show({
          content: errorMsg,
          position: "center",
          duration: 5000,
        });
        setIsPaying(false);
        setMaskVisible(false);
        return; // 提前返回，不发送交易
      }

      const gasLimit = calculatedGasLimit;

      console.log(
        `计算的 Gas Limit: ${gasLimit.toString()} (${machineIds.length} 台矿机，计算值: ${calculatedGasLimit.toString()})`,
      );
      console.log("发送激活交易...");

      // 3. 执行批量激活合约调用
      console.log("=== 发送激活交易 ===");
      console.log("合约地址:", MiningMachineSystemLogicAddress);
      console.log("函数名: batchActivateMachinesWithLP");
      console.log("矿机ID列表:", machineIds);
      console.log("Gas Limit:", gasLimit.toString());

      let hash: `0x${string}` | undefined;
      try {
        hash = await writeContract(config, {
          address: MiningMachineSystemLogicAddress as `0x${string}`,
          abi: MiningMachineSystemLogicABI,
          functionName: "batchActivateMachinesWithLP",
          args: [machineIds],
          gas: gasLimit,
          chainId,
        });
        console.log("✅ 激活交易已发送，哈希:", hash);
        console.log("可以在区块链浏览器查看: https://bscscan.com/tx/" + hash);

        // 4. 等待交易确认
        console.log("等待激活交易确认...");
        console.log("交易哈希:", hash);
        console.log(
          "可以在区块链浏览器查看交易状态:",
          `https://bscscan.com/tx/${hash}`,
        );

        let receipt;
        try {
          // 尝试使用 waitForTransactionReceipt 等待确认
          receipt = await waitForTransactionReceipt(config, {
            hash,
            chainId,
            confirmations: 1,
            timeout: 120000, // 2分钟超时
          });
        } catch (waitError: any) {
          // 检查是否是 RPC 调用失败（eth_call 模拟执行失败）
          const isRpcCallError =
            waitError?.message?.includes("RPC request failed") ||
            waitError?.message?.includes("execution reverted") ||
            waitError?.message?.includes("EthCall") ||
            waitError?.cause?.message?.includes("execution reverted");

          if (isRpcCallError) {
            // 如果是 RPC 调用失败，可能是 waitForTransactionReceipt 的模拟执行失败
            // 但实际交易可能已经成功，直接查询交易收据
            console.warn(
              "RPC 调用失败（可能是模拟执行失败），直接查询交易收据:",
              waitError,
            );
          } else {
            console.warn(
              "等待交易确认时出错，尝试直接查询交易状态:",
              waitError,
            );
          }

          // 给一些时间让交易被打包
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // 直接查询交易收据（不依赖 waitForTransactionReceipt 的模拟执行）
          let retryCount = 0;
          const maxRetries = 6; // 最多重试6次（30秒）

          while (retryCount < maxRetries) {
            try {
              receipt = await getTransactionReceipt(config, {
                hash,
                chainId,
              });
              console.log("✅ 查询到交易收据，状态:", receipt.status);
              break; // 成功查询到收据，退出循环
            } catch (directQueryError: any) {
              retryCount++;
              if (retryCount >= maxRetries) {
                // 如果多次重试都失败，说明交易可能还在待处理中或已失败
                console.error("多次查询交易收据失败:", directQueryError);
                throw new Error(
                  `交易已发送但确认失败。交易哈希: ${hash}，请在区块链浏览器查看交易状态: https://bscscan.com/tx/${hash}。如果交易已成功，请刷新页面。`,
                );
              }
              // 等待后重试
              console.log(
                `查询交易收据失败，${retryCount}/${maxRetries} 次重试，等待5秒后重试...`,
              );
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }
        }

        if (!receipt) {
          throw new Error(
            `无法获取交易收据。交易哈希: ${hash}，请在区块链浏览器查看交易状态: https://bscscan.com/tx/${hash}`,
          );
        }

        if (receipt.status === "reverted") {
          // 交易被回滚，提供详细的诊断信息
          console.error("=== 交易被回滚，开始诊断 ===");
          console.error("交易哈希:", hash);
          console.error("区块号:", receipt.blockNumber);
          console.error("Gas 使用量:", receipt.gasUsed?.toString());

          // 尝试诊断可能的原因
          let diagnosticInfo = "\n\n诊断信息：\n";

          // 检查 IDX 余额和授权
          try {
            const idxBalance = (await readContract(config, {
              address: IDX_CONTRACTS_ADDRESS,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [userAddress!],
              chainId,
            })) as bigint;

            const totalNeeded = parseEther(
              String(+needToPayIdxAmount * machineIds.length),
            );
            const allowance = (await readContract(config, {
              address: IDX_CONTRACTS_ADDRESS,
              abi: erc20Abi,
              functionName: "allowance",
              args: [userAddress!, MiningMachineSystemLogicAddress],
              chainId,
            })) as bigint;

            console.log("IDX 余额:", formatEther(idxBalance), "IDX");
            console.log("需要金额:", formatEther(totalNeeded), "IDX");
            console.log("授权额度:", formatEther(allowance), "IDX");

            if (idxBalance < totalNeeded) {
              diagnosticInfo += `❌ IDX 余额不足: 需要 ${formatEther(totalNeeded)} IDX，当前余额 ${formatEther(idxBalance)} IDX\n`;
            } else if (allowance < totalNeeded) {
              diagnosticInfo += `❌ IDX 授权不足: 需要授权 ${formatEther(totalNeeded)} IDX，当前授权 ${formatEther(allowance)} IDX\n`;
            } else {
              diagnosticInfo += `✅ IDX 余额和授权充足\n`;
            }
          } catch (diagError) {
            console.warn("诊断 IDX 余额时出错:", diagError);
            diagnosticInfo += `⚠️ 无法检查 IDX 余额和授权\n`;
          }

          // 检查矿机状态和所有权
          for (const machineId of machineIds) {
            try {
              // 检查所有权
              const machineInfo = (await readContract(config, {
                address: MiningMachineSystemStorageAddress,
                abi: MiningMachineSystemStorageABI,
                functionName: "machines",
                args: [BigInt(machineId)],
                chainId,
              })) as [string, bigint];

              const owner = machineInfo[0];
              console.log(`矿机 ${machineId} 所有者:`, owner);
              console.log(`当前用户:`, userAddress);

              if (owner.toLowerCase() !== userAddress?.toLowerCase()) {
                diagnosticInfo += `❌ 矿机 ${machineId} 所有权不匹配: 所有者 ${owner}，当前用户 ${userAddress}\n`;
              } else {
                diagnosticInfo += `✅ 矿机 ${machineId} 所有权正确\n`;
              }

              const lifecycle = await readContract(config, {
                address: MiningMachineSystemStorageAddress,
                abi: MiningMachineSystemStorageABI,
                functionName: "getMachineLifecycle",
                args: [BigInt(machineId)],
                chainId,
              });

              const isActivated =
                (lifecycle as any).isActivatedStakedLP ?? lifecycle[4];
              const isDestroyed = (lifecycle as any).destroyed ?? lifecycle[5];
              const isOnSale = await readContract(config, {
                address: MiningMachineSystemStorageAddress,
                abi: MiningMachineSystemStorageABI,
                functionName: "_isOnSale",
                args: [BigInt(machineId)],
                chainId,
              });

              if (isActivated) {
                diagnosticInfo += `❌ 矿机 ${machineId} 已激活\n`;
              }
              if (isDestroyed) {
                diagnosticInfo += `❌ 矿机 ${machineId} 已销毁\n`;
              }
              if (isOnSale) {
                diagnosticInfo += `❌ 矿机 ${machineId} 正在出售中\n`;
              }
              if (
                !isActivated &&
                !isDestroyed &&
                !isOnSale &&
                owner.toLowerCase() === userAddress?.toLowerCase()
              ) {
                diagnosticInfo += `✅ 矿机 ${machineId} 状态正常\n`;
              }
            } catch (diagError) {
              console.warn(`诊断矿机 ${machineId} 状态时出错:`, diagError);
              diagnosticInfo += `⚠️ 无法检查矿机 ${machineId} 状态\n`;
            }
          }

          // 检查激活奖励合约地址是否配置
          try {
            const extendLogicAddress = (await readContract(config, {
              address: MiningMachineSystemLogicAddress,
              abi: MiningMachineSystemLogicABI,
              functionName: "extendLogic",
              chainId,
            })) as string;

            console.log("Extend Logic 地址:", extendLogicAddress);
            if (
              !extendLogicAddress ||
              extendLogicAddress ===
                "0x0000000000000000000000000000000000000000"
            ) {
              diagnosticInfo += `❌ Extend Logic 合约地址未配置\n`;
            } else {
              diagnosticInfo += `✅ Extend Logic 合约地址已配置: ${extendLogicAddress}\n`;

              // 检查 Extend Logic 合约是否可调用
              try {
                // 尝试调用一个简单的 view 函数来验证合约是否可用
                await readContract(config, {
                  address: extendLogicAddress as `0x${string}`,
                  abi: MiningMachineSystemLogicExtendABI,
                  functionName: "calculateRewardRate",
                  args: [userAddress!],
                  chainId,
                });
                console.log("Extend Logic 合约可调用，测试调用成功");
                diagnosticInfo += `✅ Extend Logic 合约可调用\n`;
              } catch (extendError) {
                console.warn("Extend Logic 合约调用测试失败:", extendError);
                diagnosticInfo += `⚠️ Extend Logic 合约可能存在问题，无法调用\n`;
              }
            }
          } catch (diagError) {
            console.warn("检查 Extend Logic 地址时出错:", diagError);
            diagnosticInfo += `⚠️ 无法检查 Extend Logic 合约地址\n`;
          }

          // 检查交易实际调用的合约地址（从收据中获取）
          try {
            console.log("交易收据详情:");
            console.log("- To 地址:", receipt.to);
            console.log("- From 地址:", receipt.from);
            console.log(
              "- 实际调用的合约:",
              receipt.to === MiningMachineSystemLogicAddress
                ? "✅ Logic 合约"
                : "❌ 错误的合约地址",
            );

            if (
              receipt.to?.toLowerCase() !==
              MiningMachineSystemLogicAddress.toLowerCase()
            ) {
              diagnosticInfo += `❌ 交易调用了错误的合约地址: ${receipt.to}，期望: ${MiningMachineSystemLogicAddress}\n`;
            }
          } catch (diagError) {
            console.warn("检查交易收据时出错:", diagError);
          }

          console.error("=== 诊断完成 ===");

          // 如果所有基础检查都通过，但交易仍被回滚，可能是其他原因
          const hasAllChecksPassed =
            diagnosticInfo.includes("✅") &&
            !diagnosticInfo.includes("❌") &&
            !diagnosticInfo.includes("⚠️");

          let additionalSuggestions = "";
          if (hasAllChecksPassed) {
            additionalSuggestions =
              `\n注意：所有基础检查都通过，但交易仍被回滚。可能原因：\n` +
              `1. 在交易执行时，矿机状态发生了变化（可能是并发交易）\n` +
              `2. Extend Logic 合约的 activeMachineRewards 调用失败\n` +
              `3. 合约内部的其他检查失败\n` +
              `\n建议：\n` +
              `- 尝试只激活一台矿机，看看是否能成功\n` +
              `- 等待几秒后刷新页面，再次检查矿机状态\n` +
              `- 在区块链浏览器查看交易详情，查看具体的 revert reason\n`;
          } else {
            additionalSuggestions =
              `\n建议：\n` +
              `1. 根据上述诊断信息修复问题\n` +
              `2. 刷新页面后重试\n` +
              `3. 如果问题持续，请在区块链浏览器查看交易详情\n`;
          }

          throw new Error(
            `交易执行被回滚。\n` +
              `交易哈希: ${hash}\n` +
              `区块号: ${receipt.blockNumber}\n` +
              `Gas 使用量: ${receipt.gasUsed?.toString() || "未知"}\n` +
              `区块链浏览器: https://bscscan.com/tx/${hash}\n` +
              diagnosticInfo +
              additionalSuggestions,
          );
        }

        console.log("✅ 激活交易已确认，区块号:", receipt.blockNumber);
        console.log("交易状态:", receipt.status);
        console.log("=== 激活流程完成 ===");

        // 5. 交易成功处理
        Toast.show({
          content: "激活成功",
          position: "center",
        });
        console.log("刷新矿机列表");

        // 立即从 fuelList 中移除已激活的矿机，防止重复激活
        const activatedMachineIds = machineIds.map((id) => Number(id));
        console.log("从选中列表中移除已激活的矿机:", activatedMachineIds);

        // 保存到 ref，供后续刷新时使用
        recentlyActivatedMachineIds.current = activatedMachineIds;
        console.log(
          "已保存激活的矿机ID到 ref:",
          recentlyActivatedMachineIds.current,
        );

        setFuelList((prevList) =>
          prevList.filter((item) => !activatedMachineIds.includes(item.id)),
        );

        // 立即从 machineList 中移除已激活的矿机（因为它们不应该显示在待激活列表中）
        // 同时清除这些矿机的缓存，强制重新查询
        activatedMachineIds.forEach((machineId) => {
          clearMachineCache(machineId);
        });

        setMachineList((prevList) => {
          const filtered = prevList.filter(
            (item) => !activatedMachineIds.includes(item.id),
          );
          console.log(
            `从列表中移除 ${activatedMachineIds.length} 台已激活的矿机，剩余 ${filtered.length} 台`,
          );
          return filtered;
        });

        // 立即更新 allMachines，将已激活的矿机标记为已激活
        setAllMachines((prevList) =>
          prevList.map((item) => {
            if (activatedMachineIds.includes(item.id)) {
              console.log(`立即标记矿机 ${item.id} 为已激活`);
              return { ...item, isActivatedStakedLP: true, checked: false };
            }
            return item;
          }),
        );

        // 关闭弹窗和遮罩
        setActivateCount("");
        setOpen(false);
        setMaskVisible(false);

        // 等待 5 秒后刷新，确保区块链数据已更新（从2秒增加到5秒）
        setTimeout(async () => {
          console.log("延迟刷新子矿机列表");

          try {
            // 先清除所有已激活矿机的缓存，强制重新查询
            activatedMachineIds.forEach((machineId) => {
              clearMachineCache(machineId);
            });
            console.log(
              `已清除 ${activatedMachineIds.length} 台已激活矿机的缓存`,
            );

            // 使用 handleQuery 完整刷新矿机列表
            await handleQuery();
            console.log("✅ 矿机ID列表刷新完成");

            // 等待一下，确保 allMachineIds 已更新，并且 initializeQuery 完成
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 强制刷新可见区域数据，确保子矿机状态更新
            // 传递已激活矿机ID，让 handleVisibleDataUpdate 强制清除缓存并重新查询
            // handleVisibleDataUpdate 会自动更新 machineList，所以不需要再手动更新
            await handleVisibleDataUpdate(activatedMachineIds);
            console.log("✅ 子矿机数据刷新完成（machineList 已自动更新）");

            // 清除 ref，避免影响后续的正常刷新
            recentlyActivatedMachineIds.current = [];
            console.log("已清除 recentlyActivatedMachineIds ref");
          } catch (error) {
            console.error("刷新矿机列表失败:", error);
            // 如果 handleQuery 失败，尝试直接调用 handleVisibleDataUpdate
            try {
              // 清除已激活矿机的缓存
              activatedMachineIds.forEach((machineId) => {
                clearMachineCache(machineId);
              });
              await handleVisibleDataUpdate(activatedMachineIds);
              console.log("✅ 使用备用刷新方法完成");
            } catch (fallbackError) {
              console.error("备用刷新方法也失败:", fallbackError);
            }
          }

          // 通知父组件刷新
          if (onRefresh) {
            console.log("通知父组件刷新数据");
            onRefresh();
          }
        }, 5000);
      } catch (receiptError) {
        // 如果交易已发送但确认失败，抛出包含 hash 的错误
        if (hash) {
          (receiptError as any).hash = hash;
        }
        throw receiptError;
      }
    } catch (error) {
      // 错误处理：保留弹窗方便重试
      console.error("激活失败详情:", error);

      // 提取交易哈希（如果存在）
      const hash = (error as any)?.hash || (error as any)?.cause?.hash;

      let errorMsg = "激活失败: 未知错误";
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // 检测 BNB 余额不足
        if (
          errorMessage.includes("exceeds the balance of the account") ||
          errorMessage.includes("insufficient funds") ||
          errorMessage.includes("gas * gas fee")
        ) {
          errorMsg = "激活失败: BNB 余额不足，请充值 BNB 用于支付 Gas 费";
        }
        // 检测 IDX 余额不足或授权不足
        else if (
          errorMessage.includes("insufficient allowance") ||
          errorMessage.includes("transfer amount exceeds balance") ||
          errorMessage.includes("execution reverted") ||
          errorMessage.includes("revert")
        ) {
          // 检查是否是 IDX 相关错误
          if (
            errorMessage.includes("allowance") ||
            errorMessage.includes("balance")
          ) {
            errorMsg =
              "激活失败: IDX 余额不足或授权不足，请检查 IDX 余额和授权状态";
          } else if (
            errorMessage.includes("already activated") ||
            errorMessage.includes("m") ||
            errorMessage.includes("矿机状态异常") ||
            errorMessage.includes("已激活") ||
            errorMessage.includes("已销毁") ||
            errorMessage.includes("正在出售")
          ) {
            // 如果错误消息已经包含诊断信息，直接使用
            if (
              errorMessage.includes("诊断信息") ||
              errorMessage.includes("矿机")
            ) {
              errorMsg = error.message;
            } else {
              // 否则执行诊断并显示详细信息
              try {
                const machineIds = fuelList.map((item) => item.id);
                let diagnosticInfo = `激活失败: 矿机状态异常\n\n`;

                // 检查每台矿机的状态
                for (const machineId of machineIds) {
                  try {
                    const lifecycle = await readContract(config, {
                      address: MiningMachineSystemStorageAddress,
                      abi: MiningMachineSystemStorageABI,
                      functionName: "getMachineLifecycle",
                      args: [BigInt(machineId)],
                      chainId,
                    });

                    const isActivated =
                      (lifecycle as any).isActivatedStakedLP ?? lifecycle[4];
                    const isDestroyed =
                      (lifecycle as any).destroyed ?? lifecycle[5];
                    const isOnSale = await readContract(config, {
                      address: MiningMachineSystemStorageAddress,
                      abi: MiningMachineSystemStorageABI,
                      functionName: "_isOnSale",
                      args: [BigInt(machineId)],
                      chainId,
                    });

                    const statusList: string[] = [];
                    if (isActivated) statusList.push("已激活");
                    if (isDestroyed) statusList.push("已销毁");
                    if (isOnSale) statusList.push("正在出售");

                    // 使用 generateCode 格式化矿机ID，与UI显示一致
                    const machineCode = generateCode(machineId);

                    if (statusList.length > 0) {
                      diagnosticInfo += `矿机 #${machineCode}: ${statusList.join("、")}\n`;

                      // 如果是"已激活"状态，添加特别提示
                      if (isActivated) {
                        diagnosticInfo += `  → 该矿机已成功激活，无需重复操作\n`;
                      }
                    } else {
                      diagnosticInfo += `矿机 #${machineCode}: 状态正常\n`;
                    }
                  } catch (diagError) {
                    console.warn(
                      `检查矿机 ${machineId} 状态时出错:`,
                      diagError,
                    );
                    const machineCode = generateCode(machineId);
                    diagnosticInfo += `矿机 #${machineCode}: 无法检查状态\n`;
                  }
                }

                diagnosticInfo += `\n建议：请刷新页面查看最新状态`;
                errorMsg = diagnosticInfo;
              } catch (diagError) {
                console.warn("执行诊断时出错:", diagError);
                // 如果诊断失败，使用通用错误消息
                errorMsg =
                  "激活失败: 矿机状态异常（可能已激活、已销毁或正在出售）。如果矿机已成功激活，请刷新页面查看最新状态。";
              }
            }
          } else {
            const hashStr = hash
              ? `交易哈希: ${hash}`
              : "请查看控制台获取交易哈希";
            errorMsg = `激活失败: 合约执行被回滚。可能原因：1) IDX 余额不足或授权不足 2) 矿机已激活 3) 矿机已销毁 4) 矿机正在出售。${hashStr}`;
          }
        }
        // 用户拒绝签名
        else if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied")
        ) {
          errorMsg = "激活失败: 用户取消了交易";
        }
        // 钱包有待处理的请求
        else if (
          errorMessage.includes("pending request") ||
          errorMessage.includes("request after it resolved")
        ) {
          errorMsg =
            "激活失败: 钱包有待处理的交易，请先完成或取消钱包中的待处理交易，然后重试";
        }
        // Gas 不足
        else if (
          errorMessage.includes("out of gas") ||
          errorMessage.includes("gas required exceeds allowance") ||
          errorMessage.includes("intrinsic gas too low")
        ) {
          const machineCount = fuelList.length; // 使用fuelList.length，因为在错误处理时machineIds可能不在作用域
          errorMsg = `激活失败: Gas 不足。当前尝试激活 ${machineCount} 台矿机，建议减少数量分批激活（每批建议不超过 50 台）`;
        }
        // 其他错误
        else {
          errorMsg = `激活失败: ${error.message}`;
        }
      }

      // 如果错误消息包含诊断信息（多行），使用 Modal 显示
      if (errorMsg.includes("矿机 #") || errorMsg.includes("\n")) {
        Modal.show({
          bodyStyle: {
            background: "#ffffff",
            borderRadius: "20px",
            padding: "20px",
            maxHeight: "70vh",
            overflow: "auto",
          },
          showCloseButton: true,
          closeOnMaskClick: true,
          content: (
            <div className="text-[14px]">
              <div className="text-[18px] font-bold mb-4 text-[#333]">
                激活失败
              </div>
              <div className="text-[14px] text-[#666] whitespace-pre-line">
                {errorMsg}
              </div>
              <button
                className="w-full bg-[#7334FE] text-white rounded-3xl py-2 mt-4 text-[14px]"
                onClick={() => Modal.clear()}
              >
                确认
              </button>
            </div>
          ),
        });
      } else {
        Toast.show({
          content: errorMsg,
          position: "center",
          duration: 4000,
        });
      }
      // 错误时不关闭弹窗和mask
    } finally {
      setIsPaying(false);
    }
  };

  const handleCloseModal = () => {
    console.log("关闭弹窗");
    Modal.clear();
  };

  const handleLook = () => {
    console.log("前往查看挂售矿机");
    navigate("/user");
    Modal.clear();
  };

  const handleTransfer = () => {
    if (fuelList.length === 0) {
      Toast.show({
        content: "请选择要转让的矿机",
        position: "center",
      });
      return;
    }
    console.log(`准备转让选中的矿机，共${fuelList.length}台`);
    navigate("/user/transferMachine", { state: fuelList });
  };

  const handleSellOut = async () => {
    if (fuelList.length === 0) {
      Toast.show({
        content: "请选择要挂售的矿机",
        position: "center",
      });
      return;
    }

    try {
      console.log("检查当前地址是否有权限挂售...");
      const isAuthorized = await readContract(config, {
        address: MiningMachineSelluserManagerAddress as `0x${string}`,
        abi: SelluserManagerABI,
        functionName: "selluser",
        args: [userAddress!],
      });

      if (!isAuthorized) {
        console.log("当前地址无挂售权限");
        Modal.show({
          bodyStyle: {
            background: "#000000",
            color: "#ffffff",
            width: "75vw",
            padding: "15px",
            borderRadius: "20px",
          },
          showCloseButton: true,
          closeOnMaskClick: true,
          content: (
            <div className="pt-[15px] text-white text-[15px] flex flex-col items-center gap-4">
              <div className="text-[#B195FF]">提示:</div>
              <div>180天内未盈利即可挂售矿机</div>
              <button
                className="w-full bg-[#895EFF] rounded-3xl text-white py-2 mt-4"
                onClick={handleCloseModal}
              >
                确认
              </button>
            </div>
          ),
        });
        return; // 无权限时终止流程
      }
    } catch (error) {
      console.error("检查挂售权限失败:", error);
      Toast.show({
        content: "请稍后再试",
        position: "center",
      });
      return;
    }

    console.log(
      "准备挂售的矿机列表:",
      fuelList.map((item) => item.id),
    );

    try {
      let successCount = 0;
      const multiContractsCalls = fuelList.map((item, index) => ({
        address: MiningMachineSystemLogicAddress as `0x${string}`,
        abi: MiningMachineSystemLogicABI,
        functionName: "listChildMachine",
        args: [item.id],
        onConfirmed: (receipt: TransactionReceipt, callIndex: number) => {
          successCount++;
          console.log(
            `第${callIndex + 1}/${fuelList.length}个挂售调用已确认，区块号: ${receipt.blockNumber}`,
          );
        },
      }));

      console.log(
        `开始执行挂售批量调用，共${multiContractsCalls.length}个矿机`,
      );
      const res = await executeSequentialCalls(multiContractsCalls);
      console.log("挂售批量调用全部执行完成，结果:", res);

      const isAtLeastOneSuccess = res.find((item) => item.success);

      if (isAtLeastOneSuccess) {
        handleQuery();
        Modal.show({
          bodyStyle: {
            background: "#000000",
            color: "#ffffff",
            width: "75vw",
            padding: "15px",
            borderRadius: "20px",
          },
          showCloseButton: true,
          closeOnMaskClick: true,
          content: (
            <div className="pt-[15px] text-white text-[15px] flex flex-col gap-4">
              <div className="text-[#B195FF]">提示</div>

              <div>
                <div className="mb-4">
                  您已向交易市场上架了“{successCount}台矿机”
                  ，请耐心等待买家购买。
                </div>

                <div className="flex">
                  <button
                    className="w-full bg-black rounded-3xl text-white py-2 border border-[#666]"
                    onClick={handleCloseModal}
                  >
                    知道了
                  </button>
                  <button
                    className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                    onClick={handleLook}
                  >
                    去看看
                  </button>
                </div>
              </div>
            </div>
          ),
        });
      }
    } catch (error) {
      Toast.show({
        content: "挂售失败，请稍后再试",
        position: "center",
      });
      console.error("挂售流程错误:", error);
    }
  };

  const { setOpen, component } = usePopup({
    title: "",
    contentClassName: "",
    closeButtonClassName: "",
    content: (
      <div className="w-full">
        <div className="text-[#6433EC] font-bold text-[15px] pt-2 pb-4">
          激活矿机需支付打底池费用!
        </div>

        <div className="space-y-2">
          {/* 费用明细 */}
          <div className="bg-[#f5f5f5] p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#686D6D]">单台费用:</span>
              <span className="font-bold">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={+needToPayIdxAmount}
                  decimalSubLen={2}
                  className="mr-1"
                />
                IDX
              </span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#686D6D]">矿机数量:</span>
              <span className="font-bold text-[#7334FE]">
                {fuelList.length} 台
              </span>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <div className="flex justify-between">
              <div className="font-bold text-[14px]">总费用:</div>
              <div className="text-[#FF5050] font-bold text-[16px]">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={+needToPayIdxAmount * fuelList.length}
                  decimalSubLen={2}
                  className="ml-2 mr-1.5"
                />
              </div>
            </div>
          </div>

          {/* 余额信息 */}
          <div className="flex justify-between text-[12px] pt-2">
            <div className="text-[#686D6D]">钱包余额:</div>
            <div
              className={`font-bold ${+idxBalance < +needToPayIdxAmount * fuelList.length ? "text-[#ff6b6b]" : "text-[#7334FE]"}`}
            >
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>

          {/* 余额不足提示 */}
          {+idxBalance < +needToPayIdxAmount * fuelList.length && (
            <div className="bg-[#fff3f3] border border-[#ffccc7] p-2 rounded-lg text-[12px] text-[#ff6b6b]">
              ⚠️ 余额不足{" "}
              {(+needToPayIdxAmount * fuelList.length - +idxBalance).toFixed(2)}{" "}
              IDX
            </div>
          )}
        </div>

        <Divider />

        <Button
          onClick={handlePay}
          className="!bg-black !rounded-3xl !text-white flex justify-center !py-4 !px-6 w-full !text-[16px] !h-auto"
          loading={isPaying}
          disabled={
            isPaying || +idxBalance < +needToPayIdxAmount * fuelList.length
          }
        >
          {isPaying
            ? "激活中..."
            : +idxBalance >= +needToPayIdxAmount * fuelList.length
              ? "支付费用"
              : "余额不足"}
        </Button>
      </div>
    ),
  });

  return (
    <div className="pt-2 flex flex-col justify-between h-full">
      {component}
      <Mask visible={maskVisible} onMaskClick={() => setMaskVisible(false)}>
        <div className="bg-[#1d1c25] rounded-xl text-white">
          你有
          <span className="text-[#895eff] text-[1rem] font-bold">
            {maskCount}
          </span>
          笔交易待处理
        </div>
      </Mask>

      <div className="px-[21px]">
        {claimChildrenCount > 0 && mmIds.length > 0 && (
          <div className="w-full bg-black border border-gray-600 rounded-3xl px-4 py-5">
            {/* 标题 + 快速选择按钮 */}
            <div className="flex items-center justify-between text-[15px] text-white mb-3">
              <span>
                <span className="text-red text-[16px] font-bold">
                  {claimChildrenCount}
                </span>
                个子矿机待领取
              </span>

              <div className="flex gap-2">
                {/* 快速选择按钮 */}
                {mmIds.length > 10 && (
                  <button
                    className="text-xs px-2 py-1 bg-gray-700 text-white rounded-full"
                    onClick={() => {
                      const first10 = mmIds.slice(0, 10);
                      setSelectedMMIds(first10);
                      Toast.show({
                        content: "已选择前 10 个母矿机",
                        position: "center",
                        duration: 1500,
                      });
                    }}
                  >
                    选前10个
                  </button>
                )}

                {/* 全选按钮 */}
                <button
                  className={`text-xs px-3 py-1 transition-colors rounded-full
                    ${
                      selectedMMIds.length === mmIds.length
                        ? "bg-[#895EFF] text-white"
                        : "bg-white text-black"
                    }`}
                  style={{
                    borderRadius: "9999px",
                    transition:
                      "transform 300ms cubic-bezier(.17,.67,.48,1.64)",
                  }}
                  onClick={(e) => {
                    setSelectedMMIds(
                      selectedMMIds.length === mmIds.length ? [] : [...mmIds],
                    );

                    const el = e.currentTarget;
                    el.style.transform = "scale(1.25)";
                    setTimeout(() => {
                      el.style.transform = "scale(1)";
                    }, 300);
                  }}
                >
                  {selectedMMIds.length === mmIds.length ? "取消全选" : "全选"}
                </button>
              </div>
            </div>

            {/* 灰色背景滚动容器：紧贴按钮 */}
            <div
              className="scroll-hide"
              style={{
                maxHeight: "120px",
                overflowY: "auto",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                padding: "8px 8px 4px",
                borderRadius: "12px",
                backgroundColor: "#2a2a2a",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {mmIds.map((id) => (
                <div
                  key={id}
                  className={`shrink-0 cursor-pointer select-none text-xs
                    flex items-center justify-center
                    ${
                      selectedMMIds.includes(id)
                        ? "bg-[#895EFF] text-white"
                        : "bg-white text-black"
                    }`}
                  style={{
                    height: "28px",
                    minWidth: "90px",
                    borderRadius: "14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    transition:
                      "transform 300ms cubic-bezier(.17,.67,.48,1.64)",
                  }}
                  onClick={(e) => {
                    toggleMMIdSelection(id);
                    const el = e.currentTarget;
                    el.style.transform = "scale(1.25)";
                    setTimeout(() => (el.style.transform = "scale(1)"), 300);
                  }}
                >
                  母矿机ID:{id}
                </div>
              ))}
            </div>

            {/* 紧贴灰色容器，无额外上边距 */}
            <div className="flex justify-end">
              <Button
                className="!bg-white !text-black !rounded-3xl flex justify-center px-6 h-10 min-h-[40px] !py-0"
                style={{
                  transition: "transform 300ms cubic-bezier(.17,.67,.48,1.64)",
                }}
                onClick={(e) => {
                  // 原有领取逻辑
                  handleClaimChildren();

                  // 放大→缩小动效
                  const el = e.currentTarget;
                  el.style.transform = "scale(1.08)";
                  setTimeout(() => {
                    el.style.transform = "scale(1)";
                  }, 300);
                }}
                disabled={isClaiming || selectedMMIds.length === 0}
              >
                <div className="text-[14px] font-medium flex items-center h-full">
                  确定领取
                </div>
              </Button>
            </div>

            <style>{`
              .scroll-hide::-webkit-scrollbar {
                display: none;
              }
              .scroll-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        )}

        {claimChildrenCount > 0 && mmIds.length > 0 && (
          <div style={{ height: "16px" }} />
        )}

        <div className="flex justify-between items-center">
          {/* 将全选Checkbox替换为数量输入框和确认按钮 */}

          <div className="flex items-center">
            {/* 新增父容器用于强化CSS优先级 */}
            <div className="activation-input-wrapper">
              <Input
                type="number"
                value={activateCount}
                onChange={(value) => setActivateCount(value)}
                placeholder="选择数量"
                className="activation-input"
                style={{
                  width: "60px", // 缩小宽度
                  marginRight: "10px", // 减小与按钮间距
                  fontSize: "10px", // 输入文字大小
                  border: "1px solid #ffffff", // 白色边框
                  backgroundColor: "#ffffff", // 白色背景
                  color: "#000000", // 输入文字黑色
                  borderRadius: "8px", // 小圆角
                  padding: "3px 6px", // 减小内边距
                  boxSizing: "border-box",
                  height: "28px", // 固定高度
                }}
                min={0}
                max={isReadyToActivateListLength}
              />
            </div>

            {/* 新增样式块，强制修改占位文字 */}
            <style>
              {`
      .activation-input-wrapper input {
        font-size: 10px !important;
        color: #000000 !important;
      }
      .activation-input-wrapper input::placeholder {
        font-size: 11px !important; /* 占位文字大小 */
        color: #000000 !important;  /* 占位文字黑色 */
        white-space: nowrap !important;
        opacity: 1 !important;
      }
    `}
            </style>

            {/* 按钮样式修改 */}
            <Button
              onClick={handleSelectByCount}
              className="!bg-[#895EFF] !text-white !rounded-3xl !py-1 !px-4 !text-sm !border-none"
              style={{
                backgroundColor: "#010101ff",
                border: "none",
                minWidth: "50px", // 按钮最小宽度
                height: "28px", // 与输入框同高
                fontSize: "10px", // 按钮文字大小
              }}
            >
              确认
            </Button>
          </div>

          <div className="flex text-[#505050] text-[.875rem]">
            待激活矿机，共计:
            <div className="text-black font-bold mx-1">
              {isReadyToActivateListLength}
            </div>
            台
          </div>
        </div>

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar"
        >
          {!isQueryLoading ? (
            machineList.length > 0 ? (
              <List
                height={listHeight}
                width="100%"
                itemCount={machineList.length}
                itemSize={80}
                itemData={machineList}
                onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
                  // 滚动事件处理已移除，因为现在查询所有矿机
                }}
              >
                {Row}
              </List>
            ) : (
              <EmptyComp />
            )
          ) : (
            <Skeleton.Paragraph animated className={`customSkeleton`} />
          )}
        </div>
      </div>

      <div className="w-full bg-white h-[64px] flex justify-around items-center px-[30px] text-[12px]">
        <div
          className=" flex flex-col justify-center items-center"
          onClick={handleActivate}
        >
          <img src={rocketSvg} alt="" width={15} />
          <div>激活矿机</div>
        </div>
        <div
          className="flex flex-col justify-center items-center "
          onClick={handleTransfer}
        >
          <img src={transferSvg} alt="" width={18} />
          <div>转让</div>
        </div>
        <div
          className="flex flex-col justify-center items-center "
          onClick={handleSellOut}
        >
          <img src={houseSvg} alt="" width={20} />
          <div>挂售</div>
        </div>
      </div>
    </div>
  );
};

export default Machine;
