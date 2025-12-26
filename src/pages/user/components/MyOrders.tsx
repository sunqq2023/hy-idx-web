import { arrowSvg, userMachineSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import {
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { Button, Toast } from "antd-mobile";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { erc20Abi, formatEther, parseEther, parseGwei } from "viem";
import { generateCode } from "@/utils/helper";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useChainId,
} from "wagmi";
import { multicall, readContract } from "@wagmi/core";
import config from "@/proviers/config";
import { usePaymentCheck } from "@/hooks/usePaymentCheck";
import {
  writeContractWithGasFallback,
  getGasConfigByFunctionName,
} from "@/utils/contractUtils";

const MyOrders = () => {
  const location = useLocation();
  const machineList = location.state;
  const chainConfig = useChainConfig();
  const chainId = useChainId();

  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;

  const [producedWithHoursList, setProducedWithHoursList] = useState([]);

  const { address: userAddress } = useAccount();
  const { executeSequentialCalls } = useSequentialContractWrite();
  const [isPaying, setIsPaying] = useState(false);
  const navigate = useNavigate();
  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [idxBalance, setIdxBalance] = useState(0);
  const [usdtToIdxRate, setUsdtToIdxRate] = useState(0);
  const { writeContractAsync } = useWriteContract();

  const getUsdtToIdxRate = async () => {
    try {
      const data = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "getIDXAmount",
        args: [1],
      });

      const rate = data ? formatEther(data) : "0";
      setUsdtToIdxRate(+rate);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getUsdtToIdxRate();
  }, []);

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
      setIdxBalance(Number(idxData ? formatEther(idxData) : "0"));
    }
  }, [idxBalanceLoading, idxData]);

  const handleQuery = useCallback(async () => {
    const contracts = machineList.map((e) => {
      return {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "getMachineLifecycle",
        args: [e.machineId],
      };
    });

    const data = await multicall(config, {
      contracts,
    });

    const result = machineList.map((e, i) => {
      return {
        ...e,
        producedHours: Number(data[i].result.producedHours),
        // activatedAt: Number(e.result.activatedAt),
        // createTime: Number(e.result.createTime),
        // expiredAt: Number(e.result.expiredAt),
        // destroyed: e.result.destroyed,
        // isActivatedStakedLP: e.result.isActivatedStakedLP,
        // isFuelPaid: e.result.isFuelPaid,
        // isProducing: e.result.isProducing,
        // lastProduceTime: Number(e.result.lastProduceTime),
        // mtype: e.result.mtype,
        // producedChildCount: Number(e.result.producedChildCount),
        // id: bignumToNumber[i],
        // checked: false,
        // status: e.status
      };
    });

    setProducedWithHoursList(result);
  }, [machineList]);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  const getMachineProfit = (producedHours: number) => {
    const totalUSD = 150 * (1 - producedHours / 360);
    let totalIDX = totalUSD * usdtToIdxRate;
    if (totalIDX < 0) {
      totalIDX = 0;
    }
    return totalIDX;
  };

  const needToPayIdx = producedWithHoursList.reduce((acc, cur) => {
    return acc + getMachineProfit(cur.producedHours);
  }, 0);

  const handlBack = () => {
    navigate("/user");
  };

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

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const { isLoading: isPaymentCheckLoading, isAllowanceSufficient } =
    usePaymentCheck(parseEther(String(needToPayIdx)));

  const handlePay = async () => {
    if (isPaymentCheckLoading) return;

    try {
      if (producedWithHoursList.length === 0) return;

      setIsPaying(true);
      if (!isAllowanceSufficient) {
        // 计算实际需要的金额
        const actualAmount = parseEther(String(needToPayIdx));
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

          await writeContractWithGasFallback(
            {
              address: IDX_CONTRACTS_ADDRESS,
              abi: erc20Abi,
              functionName: "approve",
              args: [MiningMachineSystemLogicAddress, smartAllowance],
            },
            getGasConfigByFunctionName("approve"),
          );
        }
      }

      const multiContractsCalls = producedWithHoursList.map((item) => ({
        address: MiningMachineSystemLogicAddress as `0x${string}`,
        abi: MiningMachineSystemLogicABI,
        functionName: "buyListedChildMachine",
        args: [item.orderId],
      }));

      const res = await executeSequentialCalls(multiContractsCalls);
      const isAtLeastOneSuccess = res.find((item) => item.success);
      if (isAtLeastOneSuccess) {
        Toast.show({
          content: "支付成功",
          position: "center",
        });
        navigate("/user");
      }
      setIsPaying(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPaying(false);
    }
  };

  const Row = ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = data[index];
    const getMachineType = (producedHours: number) => {
      const result = 150 * (1 - producedHours / 360) - 30;
      return result === 120 ? "新矿机" : "二手矿机";
    };

    const getDiscountNum = (producedHours: number) => {
      return ((360 - producedHours) / 360).toFixed(1);
    };

    const getRemainingLife = (producedMix) => {
      return Math.floor((360 * (1440 - getFormattedMix(producedMix))) / 1440);
    };

    const getFormattedMix = () => {
      if (item.producedMix !== undefined && item.producedMix > 0) {
        const val = formatEther(BigInt(item.producedMix));
        return +val;
      }
      return 0;
    };

    return (
      <div
        style={{
          ...style,
          height: "70px",
        }}
      >
        <div className="px-3 py-2 bg-white rounded-3xl flex gap-3">
          <img src={userMachineSvg} alt="" />

          <div className="flex-1 h-[58px] flex flex-col gap-1 justify-center">
            <div
              style={{
                background:
                  "linear-gradient(90deg, rgba(165, 115, 71, 0) 0%, rgba(187, 112, 84, 1) 100%)",
              }}
              className={"w-[100px] flex rounded-3xl  text-[10px]"}
            >
              #{generateCode(15)}
              <div className="text-white ml-3">矿机</div>
            </div>
            <div className="flex text-[12px]">
              类型：
              <div>{getMachineType(item.producedHours)}</div>
            </div>
            <div className="flex text-[12px]">
              矿机生命剩余：
              <div className="flex">
                <div>{360 - item.producedHours}天</div>
                {/* <div>{getRemainingLife(item.producedMix)}</div> */}
                {getDiscountNum(item.producedHours) !== "1.0" && (
                  <div className="text-[red]">
                    ({getDiscountNum(item.producedHours)}折)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className=" font-bold text-[12px]">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={getMachineProfit(item.producedHours)}
              decimalSubLen={2}
              className="text-[#895EFF]  mr-1"
            />
            IDX/台
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="px-[21px]">
        <div className="flex pt-4 mb-4">
          <Button
            onClick={handlBack}
            className="!p-[0] !rounded-2xl"
            loading={isPaying}
          >
            <img src={arrowSvg} alt="" />
          </Button>
          <span className="m-auto text-[19px] font-bold">我的订单</span>
        </div>

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar rounded-2xl mb-[4rem] "
        >
          <List
            height={listHeight}
            width="100%"
            itemCount={producedWithHoursList.length}
            itemSize={80}
            itemData={producedWithHoursList}
          >
            {Row}
          </List>
        </div>
      </div>

      <div className="w-full bg-white h-[64px] flex items-center absolute bottom-0 px-[30px]">
        <div>
          <div>待支付 IDX</div>
          <div className="text-[#FF6D6D] text-[20px] font-bold">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={needToPayIdx}
              decimalSubLen={2}
              className="mr-1.5  font-bold"
            />
          </div>
        </div>

        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto   !h-[40px] !w-[100px]"
          loading={isPaying}
          onClick={handlePay}
          disabled={idxBalance < needToPayIdx}
          style={{
            fontSize: "14px",
          }}
        >
          {idxBalance > needToPayIdx ? "支付" : "余额不足"}
        </Button>
      </div>
    </div>
  );
};

export default MyOrders;
