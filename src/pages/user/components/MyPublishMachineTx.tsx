import { arrowSvg, userMachineSvg } from "@/assets";
import {
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useAccount, useReadContract, useChainId } from "wagmi";
import { MachineInfo } from "@/constants/types";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { Button, Toast } from "antd-mobile";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import dayjs from "dayjs";
import { erc20Abi, formatEther, parseGwei } from "viem";
import { formatTime, shortenAddress } from "@/utils/helper";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import config from "@/proviers/config";
import orderStore from "@/stores/orderStore";

interface IMachineTx {
  orderId: number;
  machineId: number;
  seller: `0x${string}`;
  buyer?: `0x${string}`;
  // 以 IDX 为单位的价格
  priceInIdx: number;
  listedAt: number;
  // 订单状态（0 = 有效，1 = 已成交，2 = 已取消，3 = 已售给平台）
  status: number;
  NO: number;
}

const MyPublishMachineTx = () => {
  const location = useLocation();
  const chainConfig = useChainConfig();
  const chainId = useChainId();

  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;

  const pageData = location.state;

  const diffDays =
    15 - dayjs(new Date().getTime() / 1000).diff(pageData.listedAt, "day");

  // 转换为毫秒（假设原始时间戳是秒级的）
  const timestampInMilliseconds = pageData.listedAt * 1000;
  // 计算15天后的时间
  const fifteenDaysLater = dayjs(timestampInMilliseconds).add(15, "day");
  // 获取当前时间
  const now = dayjs();
  // 判断是否已过15天
  const isExpired = now.isAfter(fifteenDaysLater);

  const { address: userAddress } = useAccount();

  const machineList = orderStore
    .getOrders()
    .filter(
      (item: any) =>
        item.seller === userAddress &&
        item.status === 1 &&
        item.orderType === 3,
    );

  const navigate = useNavigate();
  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [isDowning, setIsDowning] = useState(false);

  const handlBack = () => {
    navigate("/user");
  };

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = 354;
      const newHeight = windowHeight - topSectionHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const handleTakenOffShelves = async () => {
    try {
      setIsDowning(true);
      const hash = await writeContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "cancelListedChildMachine",
        args: [pageData.orderId],
        gas: 200000n, // 固定 gas limit
      });

      await waitForTransactionReceipt(config, { hash, chainId });
      Toast.show({ content: "下架成功", position: "center" });
      navigate("/user");
    } catch (error: any) {
      console.error("取消订单失败:", error);
      // 提取合约返回的具体错误信息
      const errorMsg = error.data?.message || "取消失败，请稍后重试";
      Toast.show({ content: errorMsg, position: "center" });
    } finally {
      setIsDowning(false);
    }
  };

  const handleSellToPlatform = () => {
    navigate("/user/sellToPlatform", { state: pageData });
  };

  return (
    <div className="px-[21px]">
      <div className="flex pt-4 mb-4">
        <Button
          onClick={handlBack}
          className="!p-[0] !rounded-2xl"
          loading={isDowning}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">我的挂售</span>
      </div>

      <div className="p-[15px] bg-white rounded-3xl">
        <div className=" flex gap-2">
          <img src={userMachineSvg} alt="" width={50} />

          <div className="flex text-[11px] flex-1">
            <div className="w-[60px] flex flex-col gap-1 text-[#5B5B5B]">
              <div>出售中</div>
              <div>矿机卖家:</div>
              <div>上架时间:</div>
            </div>
            <div className="ml-auto w-[73%] font-bold flex flex-col gap-1">
              <div>...</div>
              <div>{shortenAddress(pageData.seller, 4, 4)}</div>
              <div className="text-[11px]">{formatTime(pageData.listedAt)}</div>
            </div>
          </div>

          <div className="flex text-[12px]">
            <div className="flex flex-col justify-between items-center">
              <div className="bg-[#895EFF] rounded-2xl px-2 text-white ">
                我发布的
              </div>
              <div className="text-[#895EFF]">NO.{pageData.NO}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 relative">
          <div className="flex gap-2 mb-2 ">
            <Button
              loading={isDowning}
              onClick={handleTakenOffShelves}
              className="flex-1 !rounded-3xl !border-2 !border-dashed !border-[#e1e1e1]"
              style={{
                fontSize: "14px",
                padding: "5px",
              }}
            >
              下架
            </Button>
            <Button
              disabled={!isExpired}
              onClick={handleSellToPlatform}
              className="flex-1 !rounded-3xl !border-2 !border-dashed !border-[#e1e1e1] "
            >
              卖给平台
              {!isExpired && (
                <div className="absolute top-[-20px] right-0 bg-[#3D3B42] rounded-[5px] text-white text-[12px] px-2 py-0.5">
                  {diffDays}日后可售卖
                </div>
              )}
            </Button>
          </div>
          <div className="text-[#6D6D6D] text-[12px] text-center ">
            15天未售出，平台支持16U/台等值IDX进行回收
          </div>
        </div>
      </div>

      {machineList.length > 0 && (
        <div className="py-2 pl-4 text-[15px] text-[#595C5C]">交易历史</div>
      )}
      <div
        ref={listContainerRef}
        style={{ height: `${listHeight}px` }}
        className="no-scrollbar rounded-2xl "
      >
        <List
          height={listHeight}
          width="100%"
          itemCount={machineList.length}
          itemSize={152}
          itemData={machineList}
        >
          {Row}
        </List>
      </div>
    </div>
  );
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
  return (
    <div
      style={{
        ...style,
        height: "110px",
      }}
    >
      <div className="p-[15px] bg-white rounded-3xl flex flex-col gap-1 text-[#777777] relative">
        <div className="bg-[#9b93af] rounded-3xl text-white px-4 py-0.5 absolute right-[20px] top-[15px] text-[12px]">
          已完成
        </div>

        <div className="flex">
          交易类型：
          <div className="text-black font-bold">矿机挂售</div>
        </div>
        <div className="flex">
          收益单价：
          <div className="text-black font-bold">{item.priceInIdx} IDX/台</div>
        </div>
        <div className="flex">
          订单数量：
          <div className="text-black font-bold">1台</div>
        </div>
        <div className="flex">
          交易时间：
          <div className="text-black font-bold">
            {formatTime(item.listedAt)}
          </div>
        </div>
        <div className="flex">
          购买方钱包地址：
          <div className="font-bold text-black">
            {shortenAddress(item.buyer, 4, 4)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPublishMachineTx;
