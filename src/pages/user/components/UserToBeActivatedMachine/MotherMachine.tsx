import { rocketSvg, selectedSvg } from "@/assets";
import { MachineInfo } from "@/constants/types";
import { Button, Checkbox, Divider, Skeleton, Toast } from "antd-mobile";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List } from "react-window";
import MotherCheckableItem from "./MotherCheckableItem";
import usePopup from "@/components/usePopup";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { multicall, readContract } from "@wagmi/core";
import {
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { erc20Abi, formatEther, parseEther, parseGwei } from "viem";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import config from "@/proviers/config";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { useNavigate } from "react-router-dom";
import { usePaymentCheck } from "@/hooks/usePaymentCheck";
import EmptyComp from "@/components/EmptyComp";

const MotherMachine = () => {
  const [machineList, setMachineList] = useState<MachineInfo[]>([]);
  const chainConfig = useChainConfig();
  const { address: userAddress } = useAccount();
  const navigate = useNavigate();
  const { writeContractAsync } = useWriteContract();

  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;

  const [allStatus, setAllStatus] = useState(false);

  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [fuelList, setFuelList] = useState<MachineInfo[]>([]);
  const [needToPayIdxAmount, setneedToPayIdxAmount] = useState("");
  const [idxBalance, setidxBalance] = useState("");
  const isReadyToActivateListLength = useMemo(() => {
    return machineList.filter((item) => !item.isActivatedStakedLP).length || 0;
  }, [machineList]);

  useEffect(() => {
    if (
      isReadyToActivateListLength === fuelList.length &&
      isReadyToActivateListLength > 0
    ) {
      setAllStatus(true);
    } else {
      setAllStatus(false);
    }
  }, [isReadyToActivateListLength, fuelList]);

  // 关键修改：使用批量激活专用方法
  const { batchActivateMachinesWithLP } = useSequentialContractWrite();

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
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: "getMachineLifecycle",
          args: [e],
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
          checked: false,
          id: bignumToNumber[i],
          lastProduceTime: Number(e.result.lastProduceTime),
          producedChildCount: Number(e.result.producedChildCount),
          producedHours: Number(e.result.producedHours),
          mtype: e.result.mtype,
          fuelRemainingMinutes: Number(e.result.fuelRemainingMinutes),
        };
      });

      const motherList = result.filter((item) => item.mtype === 1);

      // 获取母矿机是否在售卖中 如果是则不能进行 激活
      const canbeActivateContract = motherList.map((item) => {
        return {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: "_isOnSale",
          args: [item.id],
        };
      });

      const data3 = await multicall(config, {
        contracts: canbeActivateContract,
      });

      const result3 = motherList.map((item, i) => {
        return {
          ...item,
          isOnSale: data3[i].result as boolean,
        };
      });

      // 获取母矿机生命剩余
      const remainingContract = result3.map((item) => {
        return {
          address: MiningMachineProductionLogicAddress,
          abi: MiningMachineProductionLogicABI,
          functionName: "viewMachineProduction",
          args: [item.id],
        };
      });

      const data4 = await multicall(config, {
        contracts: remainingContract,
      });

      const result4 = result3.map((item, i) => ({
        ...item,
        unclaimedChildCount: Number(data4[i].result[2]),
      }));

      setMachineList(
        result4
          .sort((a, b) => a.activatedAt - b.activatedAt)
          .filter((e) => !e.destroyed),
      );
      console.log("mother machine list", result4);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  useEffect(() => {
    if (allStatus) {
      setFuelList(
        machineList.filter(
          (item) => !item.isActivatedStakedLP && !item.isOnSale,
        ),
      );
    }
  }, [allStatus, machineList]);

  const toggleSelectAll = () => {
    setMachineList((prevList) => {
      const newList = prevList.map((item) => {
        if (!item.isActivatedStakedLP) {
          return {
            ...item,
            checked: !allStatus,
          };
        }
        return item;
      });

      if (!allStatus) {
        setFuelList(newList.filter((item) => !item.isActivatedStakedLP));
      } else {
        setFuelList([]);
      }

      return newList;
    });
    setAllStatus(!allStatus);
  };

  const getChekeIcon = (checked: boolean): React.ReactNode =>
    checked ? (
      <img src={selectedSvg} alt="" width={16} height={16} />
    ) : (
      <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
    );

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = 230;
      const newHeight = windowHeight - topSectionHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const handleLeftClick = useCallback(
    (item: MachineInfo) => {
      setMachineList((prevItems) => {
        const newItems = prevItems.map((e) => {
          if (!e.isActivatedStakedLP) {
            return e.id === item.id ? { ...e, checked: !e.checked } : e;
          }
          // 已经激活的机器不可以再次激活 也不可选中
          return e;
        });

        const clickItem = newItems.find((e) => e.id === item.id);

        if (!clickItem!.isActivatedStakedLP) {
          const isItemChecked = !item.checked;
          if (isItemChecked) {
            if (!allStatus) {
              setFuelList([...fuelList, item]);
            } else {
              setFuelList(machineList);
            }
          } else {
            const list = fuelList.filter((e) => e.id !== item.id);
            setFuelList(list);
            setAllStatus(false);
          }
        }

        return newItems;
      });
    },
    [allStatus, machineList, fuelList],
  );

  const handleRightClick = (item: MachineInfo) => {
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
          }}
        >
          <MotherCheckableItem
            item={item}
            onLeftClick={handleLeftClick}
            onRightClick={handleRightClick}
          />
        </div>
      );
    },
  );

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
      setidxBalance(idxData ? formatEther(idxData) : "0");
    }
  }, [idxBalanceLoading, idxData]);

  useEffect(() => {
    if (!idxPriceLoading) {
      setneedToPayIdxAmount(idxPrice ? formatEther(idxPrice) : "0");
    }
  }, [idxPriceLoading, idxPrice]);

  const [isPaying, setIsPaying] = useState(false);
  const handleActivate = async () => {
    if (fuelList.length === 0) {
      Toast.show({
        content: "请选择要激活的矿机",
        position: "center",
        duration: 2000,
      });
      return;
    }
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

      setIsPaying(true);
      // 1. 检查并处理智能授权
      if (!isAllowanceSufficient) {
        // 计算实际需要的金额
        const actualAmount = parseEther(
          String(Math.ceil(+needToPayIdxAmount * fuelList.length)),
        );
        const smartAllowance = actualAmount * 30n; // 调整为30倍授权

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

        // 检查当前allowance是否已经足够（超过2倍实际需要）
        if (currentAllowance >= smartAllowance) {
          console.log("当前allowance已足够，无需重新授权");
        } else {
          console.log("当前allowance不足，执行智能授权");

          // 使用显式 gas 配置
          console.log("执行 IDX 授权...");
          await writeContractAsync({
            address: IDX_CONTRACTS_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [MiningMachineSystemLogicAddress, smartAllowance],
            gas: 350000n, // 授权操作
            // 移除硬编码的 gas price，让钱包自动估算
          });
          console.log("IDX智能授权交易已发送");
        }
      }

      // 2. 转换矿机ID为bigint数组（匹配合约uint256[]类型）
      const machineIds = fuelList.map((item) => BigInt(item.id));

      // 3. 调用批量激活接口（关键修改）
      const result = await batchActivateMachinesWithLP(
        MiningMachineSystemLogicAddress as `0x${string}`,
        machineIds,
      );

      // 4. 处理激活结果
      if (result.success) {
        Toast.show({
          content: "激活成功!",
          position: "center",
        });
        handleQuery(); // 刷新矿机列表
        setFuelList([]); // 清空选中列表
        setAllStatus(false);
      } else {
        Toast.show({
          content: `激活失败: ${result.error instanceof Error ? result.error.message : "未知错误"}`,
          position: "center",
        });
      }
    } catch (error) {
      console.error("激活过程异常:", error);
      Toast.show({
        content: "激活失败，请重试",
        position: "center",
      });
    } finally {
      setOpen(false);
      setIsPaying(false);
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

        <div>
          <div className="flex justify-between">
            <div className="font-bold text-[14px]">待支付IDX</div>
            <div className="text-[#FF5050] font-bold text-[16px]">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={+needToPayIdxAmount * fuelList.length}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end text-[12px]">
            <div className="text-[#686D6D]">钱包余额：</div>
            <div className="font-bold">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
            </div>
          </div>
        </div>

        <Divider />

        <Button
          onClick={handlePay}
          className="!bg-black !rounded-3xl !text-white flex justify-center !py-2 w-full !text-[16px]"
          loading={isPaying}
          disabled={+idxBalance < +needToPayIdxAmount * fuelList.length}
        >
          {+idxBalance > +needToPayIdxAmount * fuelList.length
            ? "支付费用"
            : "余额不足"}
        </Button>
      </div>
    ),
  });

  return (
    <div className="pt-4 flex flex-col justify-between h-full">
      {component}
      <div className="px-[21px]">
        <div className="flex justify-between items-center">
          <Checkbox
            className="mr-6 h-[32px] "
            checked={allStatus}
            icon={(isChecked) => getChekeIcon(isChecked)}
            onClick={toggleSelectAll}
            style={{
              "--font-size": "14px",
              "--gap": "6px",
            }}
          >
            全选
          </Checkbox>
          <div className="flex text-[#505050] text-[14px]">
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
          {!isLoading ? (
            machineList.length > 0 ? (
              <List
                height={listHeight}
                width="100%"
                itemCount={machineList.length}
                itemSize={85}
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
        className="w-full bg-white h-[4rem] flex justify-around items-center px-[30px] text-[12px]"
        onClick={handleActivate}
      >
        <div className=" flex flex-col justify-center items-center">
          <img src={rocketSvg} alt="" width={15} />
          <div>激活</div>
        </div>
      </div>
    </div>
  );
};

export default MotherMachine;
