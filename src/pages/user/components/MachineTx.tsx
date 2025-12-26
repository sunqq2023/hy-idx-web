import { nextArrowSvg, userMachineSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import {
  MiningMachineHistoryABI,
  MiningMachineSystemLogicABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import config from "@/proviers/config";
import { formatTime, shortenAddress } from "@/utils/helper";
import { Button, Divider, Input, Toast } from "antd-mobile";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList } from "react-window";
import { useAccount, useChainId } from "wagmi";
import { multicall, readContract } from "@wagmi/core";
import { erc20Abi, formatEther } from "viem";
import orderStore from "@/stores/orderStore";
import classNames from "classnames";
import EmptyComp from "@/components/EmptyComp";

interface IMachineTx {
  orderId: number;
  machineId: number;
  seller: `0x${string}`;
  // 以 IDX 为单位的价格
  priceInIdx: number;
  listedAt: number;
  // 订单状态（0 = 有效，1 = 已成交，2 = 已取消，3 = 已售给平台）
  status: number;
  NO: number;
}

export const MachineTx = ({ isShow }: { isShow: boolean }) => {
  const [count, setCount] = useState("");
  const chainConfig = useChainConfig();
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const [machineList, setMachineList] = useState<IMachineTx[]>([]);
  const navigate = useNavigate();

  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;

  const awaitingPaymentItemsLength = orderStore.getUnPaidLength();

  const handleChangeCount = (val: string) => {
    setCount(val);
  };

  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [idxBalance, setIdxBalance] = useState(0);
  const [machinePrice, setMachinePrice] = useState(0);
  const [usdtToIdxRate, setUsdtToIdxRate] = useState(0);

  const handleQueryIdxBalance = useCallback(async () => {
    try {
      const res = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress!],
      });

      setIdxBalance(+formatEther(res));
    } catch (error) {
      console.error(error);
    }
  }, [userAddress]);

  const handleQueryChildMachinePrice = useCallback(async () => {
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "CHILD_MACHINE_PRICE",
        args: [],
      });
      setMachinePrice(Number(res));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (isShow) handleQueryChildMachinePrice();
  }, [handleQueryChildMachinePrice, isShow]);

  useEffect(() => {
    if (isShow) {
      handleQueryIdxBalance();
    }
  }, [handleQueryIdxBalance, isShow]);

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

  const handlePay = () => {
    if (+count === 0) {
      Toast.show({
        content: "请输入购买数量",
        position: "center",
      });
      return;
    }
    navigate("/user/myOrders", {
      state: machineList.filter((_, index) => index < +count),
    });
  };

  const Row = ({
    index,
    style,
    data,
  }: {
    data: IMachineTx[];
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = data[index];
    const handleMyPublishClick = () => {
      if (item.seller === userAddress) {
        navigate("/user/myPublishMachineTx", { state: item });
      } else {
        return;
      }
    };
    return (
      <div
        style={{
          ...style,
          height: "70px",
        }}
      >
        <div
          className={classNames(
            [item.seller !== userAddress ? "px-[.9375rem]" : "pl-[.9375rem]"],
            " py-[.9375rem] bg-white rounded-3xl flex mt-2 gap-2",
          )}
          onClick={handleMyPublishClick}
        >
          <img src={userMachineSvg} alt="" className="w-[3.625rem]" />

          <div className="flex text-[.625rem]">
            <div className="w-[70px] flex flex-col gap-1 text-[#5B5B5B]">
              <div>出售中</div>
              <div>矿机卖家:</div>
              <div>上架时间:</div>
            </div>
            <div className="ml-auto w-[73%] font-bold flex flex-col gap-1">
              <div>...</div>
              <div>{shortenAddress(item.seller, 4, 4)}</div>
              <div>{formatTime(item.listedAt)}</div>
            </div>
          </div>

          {item.seller !== userAddress ? (
            <div className="ml-auto mt-auto font-bold text-[.75rem]">
              NO.{item.NO}
            </div>
          ) : (
            <div className="flex">
              <div className="flex flex-col justify-between items-center">
                <div className="bg-[#895EFF] rounded-2xl px-2 text-white text-[.625rem]">
                  我发布的
                </div>
                <div className="text-[#895EFF] text-[.75rem]">NO.{item.NO}</div>
              </div>
              <img src={nextArrowSvg} alt="" width={20} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleQuery = useCallback(async () => {
    try {
      const orderCount = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "activeListedOrderCount",
        args: [],
      });
      // console.log('orderCount', orderCount)

      const allListedOrderIdsContract = new Array(Number(orderCount))
        .fill(1)
        .map((_, i) => ({
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "allListedOrderIds",
          args: [i],
        }));

      const orderIds = await multicall(config, {
        contracts: allListedOrderIdsContract,
      });

      // console.log('orderIds', orderIds)

      const bignumToNumber = orderIds.map((e) => Number(e.result));

      const contracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "listedOrders",
          args: [id],
        };
      });
      const data2 = await multicall(config, {
        contracts,
      });

      const itemList = data2.map((item) => {
        return {
          orderId: Number(item.result[0]),
          machineId: Number(item.result[1]),
          seller: item.result[2],
          priceInIdx: +formatEther(item.result[3]),
          listedAt: Number(item.result[4]),
          status: Number(item.result[5]),
        };
      });

      const allListedOrdersWithBuyerContract = itemList.map((item) => ({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "internalOrders",
        args: [item.orderId],
      }));

      const ordersWithBuyer = await multicall(config, {
        contracts: allListedOrdersWithBuyerContract,
      });

      const itemListWithBuyer = itemList.map((item, index) => {
        return {
          ...item,
          buyer: ordersWithBuyer[index].result[1],
        };
      });

      let list = itemListWithBuyer.filter((item) => {
        return (
          item.status === 0 &&
          item.seller !== "0x0000000000000000000000000000000000000000"
        );
      });
      console.log("itemListWithBuyer", list);
      orderStore.updateAllListedOrders(list);

      list = list
        .sort((a, b) => a.listedAt - b.listedAt)
        .map((item, i) => ({
          ...item,
          NO: i + 1,
        }));

      setMachineList(list);
      console.log("user machine tx list", list);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  const getUsdtToIdxRate = async () => {
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "getIDXAmount",
        args: [1],
      });

      setUsdtToIdxRate(Number(res ? formatEther(res) : "0"));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getUsdtToIdxRate();
  }, []);

  const getPayButtonText = () => {
    if (+count > machineList.length) {
      return "库存不足";
    }
    return idxBalance < +count * machinePrice ? "余额不足" : "去支付";
  };

  const handleTxRecordsClick = () => {
    navigate("/user/history");
  };

  return (
    <div className="mt-2">
      <div className="px-[21px]">
        <div className="bg-white rounded-2xl p-[15px]">
          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              <img src={userMachineSvg} alt="" className="w-[2.5625rem]" />

              <div className="text-[.6875rem]">
                <div>类型： 矿机</div>
                <div>
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={machinePrice * usdtToIdxRate}
                    decimalSubLen={2}
                    className="font-bold text-[1.25rem] mr-2"
                  />
                  IDX/台 ≈ {machinePrice}USDT/台
                </div>
              </div>
            </div>

            <div className="flex h-[40px]" onClick={handleTxRecordsClick}>
              <div className="pt-[.3125rem] text-[14px] font-bold">
                交易记录
              </div>
              {awaitingPaymentItemsLength > 0 && (
                <div
                  className={
                    "bg-[red]  p-1 rounded-3xl h-[15px] flex items-center justify-center text-white text-[.6rem] leading-[.6rem]"
                  }
                >
                  {awaitingPaymentItemsLength}
                </div>
              )}
            </div>
          </div>

          <Divider className="!my-3" />

          <h1 className="font-bold text-[.875rem] mb-2">矿机权益</h1>

          <div className="text-[.75rem] ">
            <div className="pl-[2.5rem] relative">
              <div>每台矿机每日产出4个MIX积分，每日00:00:00-01:00:00到账;</div>
              <div className="absolute left-[25px] top-[5px] bg-black w-[7px] h-[7px] rounded-[50%]"></div>
            </div>

            <div className="pl-[2.5rem] flex gap-2 text-[.75rem] relative">
              <div>
                每80个MIX积分合成1台矿机，合成出来的矿机，可转让或保留用于挖取积分；
              </div>
              <div className="absolute left-[25px] top-[5px] bg-black w-[7px] h-[7px] rounded-[50%]"></div>
            </div>
          </div>

          <Divider />

          <div className="flex items-center">
            <div className="w-[100px] text-[.875rem]  font-bold">购买数量</div>
            <div className="relative flex-1">
              <Input
                placeholder="输入整数"
                style={{
                  "--font-size": ".875rem",
                }}
                className="!bg-[#f3f3f3] rounded-3xl px-4 py-1 "
                value={count}
                type="number"
                onChange={handleChangeCount}
              />
              <span className="absolute right-[20px] top-[.3125rem] text-[.875rem]">
                台
              </span>
            </div>
          </div>

          <div className="flex justify-end mt-1 gap-1 text-[.625rem] items-end">
            钱包余额：
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={idxBalance}
              decimalSubLen={2}
              className="font-bold text-[.6875rem]"
            />
            IDX
          </div>
        </div>

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar mb-[4rem]"
        >
          {machineList.length > 0 ? (
            <FixedSizeList
              height={listHeight}
              width="100%"
              itemCount={machineList.length}
              itemSize={95}
              itemData={machineList}
            >
              {Row}
            </FixedSizeList>
          ) : (
            <EmptyComp />
          )}
        </div>
      </div>

      <div className="w-full bg-white h-[4rem] flex items-center absolute bottom-0 px-[1.875rem]">
        <div>
          <div>待支付 IDX</div>
          <div className="text-[#FF6D6D] text-[20px] font-bold">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={+count * machinePrice * usdtToIdxRate}
              decimalSubLen={2}
              className="mr-1.5  font-bold"
            />
          </div>
        </div>

        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto   !h-[40px] !w-[100px]"
          style={{
            fontSize: "15px",
          }}
          onClick={handlePay}
          disabled={
            idxBalance < +count * machinePrice * usdtToIdxRate ||
            +count > machineList.length
          }
        >
          {getPayButtonText()}
        </Button>
      </div>
    </div>
  );
};
