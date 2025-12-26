import { arrowSvg, nextArrowSvg } from "@/assets";
import { formatTime, shortenAddress } from "@/utils/helper";
import { Dialog, Divider, Skeleton, Toast } from "antd-mobile";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { VariableSizeList } from "react-window";
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
} from "@wagmi/core";
import config from "@/proviers/config";
import { MiningMachineSystemLogicABI } from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useAccount, useChainId } from "wagmi";
import { formatEther, parseGwei } from "viem";
import orderStore from "@/stores/orderStore";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";

interface Item {
  orderId: number;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  createTime: string;
  status: number;
  orderType: number;
  price: number;
  machineIds: number[];
}

const UserTxHistory = () => {
  const navigate = useNavigate();
  const chainConfig = useChainConfig();
  const chainId = useChainId();
  const { address: userAddress } = useAccount();

  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;

  const orders = orderStore.getOrders();
  const myOrders = orders.filter(
    (item) =>
      (item.listedAt && item.status === 1 && item.seller === userAddress) ||
      (item.seller === userAddress && !item.listedAt) ||
      (item.buyer === userAddress && !item.listedAt),
  );

  const handlBack = () => {
    navigate("/user");
  };

  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [usdtToIdxRate, setUsdtToIdxRate] = useState(0);

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

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = 120;
      const newHeight = windowHeight - topSectionHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  // 创建高度缓存
  const createHeightCache = () => {
    const cache = {};

    return {
      get: (index) => cache[index] || null,
      set: (index, height) => {
        cache[index] = height;
        return cache[index];
      },
      clear: () => {
        for (const key in cache) {
          delete cache[key];
        }
      },
      reset: (index) => {
        delete cache[index];
      },
      has: (index) => cache[index] !== undefined,
    };
  };

  // 列表项组件（带高度测量）
  const Row = forwardRef(
    (
      {
        index,
        style,
        data,
        onHeightChange,
      }: {
        data: { items: Item[] };
        index: number;
        style: React.CSSProperties;
      },
      ref,
    ) => {
      const itemRef = useRef(null);
      const [itemHeight, setItemHeight] = useState(0);

      // 测量并更新高度
      useEffect(() => {
        const element = itemRef.current;
        if (!element) return;

        const updateHeight = () => {
          const height = element.getBoundingClientRect().height;
          if (height !== itemHeight) {
            setItemHeight(height);
            onHeightChange(index, height);
          }
        };

        // 初始测量
        updateHeight();

        // 监听尺寸变化
        const observer = new ResizeObserver(updateHeight);
        observer.observe(element);

        return () => observer.disconnect();
      }, [index, onHeightChange, itemHeight]);

      const item = data.items[index];

      const navigate = useNavigate();

      const isUnPaid = () => {
        return item.status === 0;
      };

      const handleClick = () => {
        if (item.orderType === 1) {
          if (item.status === 0) {
            navigate("/user/payForBuyMachine", { state: item });
          }
        } else if (item.orderType === 2) {
          if (item.status === 0 && item.seller !== userAddress) {
            navigate("/user/userToUserPay", { state: item });
          }
        }
      };

      const getType = () => {
        if (item.orderType === 1) {
          return "买入母矿机";
        } else if (item.orderType === 2 && item.seller === userAddress) {
          return "卖出矿机";
        } else if (item.orderType === 2 && item.buyer === userAddress) {
          return "买入矿机";
        }
        return "矿机挂售卖出";
      };

      const getTagText = () => {
        if (item.status === 1) {
          return "已完成";
        }
        if (item.status === 0 && item.orderType === 1) {
          return "待支付";
        } else if (item.status === 2 && item.orderType === 1) {
          return "已撤销";
        } else if (
          item.status === 0 &&
          item.orderType === 2 &&
          item.buyer !== userAddress
        ) {
          return "等待对方支付";
        } else if (
          item.status === 0 &&
          item.orderType === 2 &&
          item.buyer === userAddress
        ) {
          return "待支付";
        } else if (item.status === 2 && item.orderType === 2) {
          return "已取消";
        }

        if (item.orderType === 3 && item.status === 0) {
          return "售卖中";
        } else if (item.orderType === 3 && item.status === 2) {
          return "已取消";
        } else if (item.orderType === 3 && item.status === 3) {
          return "已售给平台";
        }
      };

      const getPaymentText = () => {
        if (
          item.orderType === 1 &&
          item.status === 0 &&
          item.buyer !== userAddress
        ) {
          return "待对方支付合计";
        } else if (
          item.orderType === 1 &&
          item.status === 0 &&
          item.buyer === userAddress
        ) {
          return "待支付合计";
        } else if (
          item.orderType === 1 &&
          item.status === 1 &&
          item.buyer === userAddress
        ) {
          return "已支付合计";
        } else if (
          item.orderType === 1 &&
          item.status === 1 &&
          item.buyer !== userAddress
        ) {
          return "已支付合计";
        } else if (
          item.orderType === 2 &&
          item.status === 0 &&
          item.buyer !== userAddress
        ) {
          return "待对方支付合计";
        } else if (
          item.orderType === 2 &&
          item.status === 0 &&
          item.buyer === userAddress
        ) {
          return "待支付合计";
        } else if (
          item.orderType === 2 &&
          item.status === 1 &&
          item.buyer !== userAddress
        ) {
          return "对方已支付合计";
        } else if (
          item.orderType === 2 &&
          item.status === 1 &&
          item.buyer === userAddress
        ) {
          return "已支付合计";
        }
      };

      const handleCancelOrder = () => {
        Dialog.confirm({
          content: "是否撤回交易",
          onConfirm: async () => {
            try {
              const hash = await writeContract(config, {
                address: MiningMachineSystemLogicAddress,
                abi: MiningMachineSystemLogicABI,
                functionName: "cancelInternalMachineOrder",
                args: [item.orderId],
                gas: 200000n, // 固定 gas limit
                maxFeePerGas: parseGwei("10"),
                maxPriorityFeePerGas: parseGwei("2"),
              });

              await waitForTransactionReceipt(config, {
                hash,
                chainId,
              });

              Toast.show({
                content: "撤回成功",
                position: "center",
              });
              navigate("/user");
            } catch (error) {
              Toast.show({
                content: "撤回失败",
                position: "center",
              });
              console.error(error);
            }
          },
        });
      };
      return (
        <div
          ref={itemRef}
          style={{
            ...style,
          }}
        >
          <div className="h-[10px]"></div>
          <div
            className="transfer-container text-[12px] flex flex-col gap-1 relative text-[#777777]"
            onClick={handleClick}
          >
            <div className="flex gap-2 items-center">
              <div>交易类型:</div>
              <div className="text-black ">{getType()}</div>
              <div
                className={` ${
                  !isUnPaid() ? "bg-[#6e638b]" : "bg-[#ff4949]"
                } ml-auto text-white px-3 py-0.5 rounded-3xl text-[.6875rem]`}
              >
                {getTagText()}
              </div>
            </div>

            {[1, 2].includes(item.orderType) ? (
              <>
                <div className="flex gap-2">
                  <div>交易单价:</div>
                  <div className="text-black ">
                    <AdaptiveNumber
                      type={NumberType.BALANCE}
                      value={
                        (item.price * usdtToIdxRate) / item.machineIds.length
                      }
                      decimalSubLen={2}
                      className="mr-1.5"
                    />
                    IDX / 台
                  </div>
                </div>

                <div className="flex gap-2">
                  <div>订单数量:</div>
                  <div className="text-black ">{item.machineIds.length} 台</div>
                </div>

                <div className="flex gap-2">
                  <div>发起时间:</div>
                  <div className="text-black ">
                    {formatTime(+item.createTime)}
                  </div>
                </div>

                {isUnPaid() && item.orderType === 1 && (
                  <div>
                    <img
                      src={nextArrowSvg}
                      alt=""
                      className="absolute right-[30px] top-[95px]"
                      width={30}
                      height={30}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <div>接收方钱包地址:</div>
                  <div className="text-black ">
                    {shortenAddress(item.buyer, 4, 4)}
                  </div>
                </div>

                <Divider className="!my-1" />

                <div className="flex items-end gap-2 py-1">
                  <div className="text-[14px]">{getPaymentText()}</div>
                  <div className="text-[16px]  flex items-end text-black font-bold">
                    <AdaptiveNumber
                      type={NumberType.BALANCE}
                      value={item.price * usdtToIdxRate}
                      decimalSubLen={2}
                      className=""
                    />
                  </div>
                  <div>IDX</div>
                </div>

                {isUnPaid() &&
                  item.orderType === 2 &&
                  item.seller === userAddress &&
                  item.buyer !==
                    "0x0000000000000000000000000000000000000000" && (
                    <button
                      className="rounded-3xl border border-dashed border-[#e1e1e1] text-[16px] text-center py-1"
                      onClick={handleCancelOrder}
                    >
                      撤回
                    </button>
                  )}
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <div>收益单价:</div>
                  <div className="text-black ">{item.priceInIdx} IDX / 台</div>
                </div>

                <div className="flex gap-2">
                  <div>订单数量:</div>
                  <div className="text-black ">1 台</div>
                </div>

                <div className="flex gap-2">
                  <div>交易时间:</div>
                  <div className="text-black ">
                    {item.status === 1 ? formatTime(item.listedAt) : ""}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div>购买方钱包地址:</div>
                  <div className="text-black ">
                    {item.buyer !== "0x0000000000000000000000000000000000000000"
                      ? shortenAddress(item.buyer, 4, 4)
                      : ""}
                  </div>
                </div>

                <Divider className="!my-2" />
              </>
            )}
          </div>
        </div>
      );
    },
  );

  // 主列表组件
  const DynamicHeightList = ({ items }: { items: Item[] }) => {
    const listRef = useRef(null);
    const heightCache = useRef(createHeightCache()).current;

    // 当高度变化时更新缓存
    const handleHeightChange = useCallback(
      (index, height) => {
        const prevHeight = heightCache.get(index);
        if (prevHeight !== height) {
          heightCache.set(index, height);
          listRef.current?.resetAfterIndex(index);
        }
      },
      [heightCache],
    );

    // 获取项目高度（使用缓存或预估高度）
    const getItemSize = useCallback(
      (index) => {
        const itemHeight = heightCache.get(index); // 预估高度
        return itemHeight;
      },
      [heightCache],
    );

    return (
      <div
        ref={listContainerRef}
        style={{ height: `${listHeight}px`, marginTop: "10px" }}
        className="no-scrollbar"
      >
        <VariableSizeList
          ref={listRef}
          height={listHeight} // 列表可视高度
          width="100%" // 列表宽度
          itemCount={items.length}
          itemSize={getItemSize}
          itemData={{
            items,
            heightCache,
          }}
        >
          {(props) => <Row {...props} onHeightChange={handleHeightChange} />}
        </VariableSizeList>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden px-[21px]">
      <div className="flex pt-4">
        <img src={arrowSvg} alt="" onClick={handlBack} />
        <span className="m-auto text-[17px] font-bold">交易记录</span>
      </div>
      <DynamicHeightList items={myOrders} />;
    </div>
  );
};

export default UserTxHistory;
