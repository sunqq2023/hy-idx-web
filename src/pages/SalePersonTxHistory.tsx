import { arrowSvg, nextArrowSvg } from "@/assets";
import { formatTime, shortenAddress } from "@/utils/helper";
import { Dialog, Divider, Skeleton, Toast } from "antd-mobile";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VariableSizeList } from "react-window";
import {
  readContract,
  multicall,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import config from "@/proviers/config";
import {
  MiningMachineHistoryABI,
  MiningMachineSystemLogicABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useChainId, useAccount } from "wagmi";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { formatEther, parseGwei } from "viem";

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

const SalePersonTxHistory = () => {
  const { address: userAddress } = useAccount();
  const chainConfig = useChainConfig();
  const chainId = useChainId();

  // 使用动态地址
  const MiningMachineHistoryAddress =
    chainConfig.HISTORY_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;

  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);

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

  const handlBack = () => {
    navigate("/sale-person");
  };

  const handleQuery = useCallback(async () => {
    try {
      setIsQuerying(true);
      const orderIds = await readContract(config, {
        address: MiningMachineHistoryAddress,
        abi: MiningMachineHistoryABI,
        functionName: "getSellerOrderIds",
        args: [userAddress, 0, 100],
      });

      const bignumToNumber = (orderIds as bigint[]).map((e) => Number(e));

      const contracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineHistoryAddress,
          abi: MiningMachineHistoryABI,
          functionName: "allOrders",
          args: [id],
        };
      });
      const data2 = await multicall(config, {
        contracts,
      });
      const itemList = data2.map((item) => {
        return {
          orderId: Number(item.result[0]),
          seller: item.result[1],
          buyer: item.result[2],
          createTime: String(item.result[3]),
          status: item.result[4],
          orderType: item.result[5],
        };
      });

      const priceAndMachineIdsContracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "internalOrders",
          args: [id],
        };
      });

      const data3 = await multicall(config, {
        contracts: priceAndMachineIdsContracts,
      });

      const resultList = itemList.map((item, index) => {
        return {
          ...item,
          price: Number(data3[index].result[2]),
        };
      });

      const machineIdsContracts = bignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "getInternalOrderMachineIds",
          args: [id],
        };
      });

      const data4 = await multicall(config, {
        contracts: machineIdsContracts,
      });

      let resultListWithMachineIds = resultList.map((item, index) => {
        const formatIdToNumber = data4[index].result.map((id: bigint) =>
          Number(id),
        );
        return {
          ...item,
          machineIds: formatIdToNumber,
        };
      });

      setOrders(resultListWithMachineIds.sort((a, b) => a.status - b.status));
      console.log(
        "sale person transfer history detail",
        resultListWithMachineIds,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsQuerying(false);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

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
  const ListItem = forwardRef(({ index, style, data, onHeightChange }, ref) => {
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

    const getTypeName = (type: number) => {
      return type === 1 ? "母矿机" : "子矿机";
    };

    const getTxStatus = () => {
      const map = [
        [() => item.status === 0, () => "等待对方支付"],
        [() => item.status === 1, () => "已支付"],
        [() => item.status === 2, () => "已撤回"],
      ];
      const target = map.find((item) => item[0]());
      return target ? target[1]() : "未知状态";
    };

    const isPaid = () => {
      return item.status !== 0;
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
              // 移除硬编码的 gas price，让钱包自动估算
            });

            await waitForTransactionReceipt(config, {
              hash,
              chainId,
            });
            handleQuery();
            Toast.show({
              content: "撤回成功",
              position: "center",
            });
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
        <div>
          <div className="p-[20px] bg-white rounded-2xl text-[14px] flex flex-col gap-1 relative text-[#777777]">
            <div className="flex gap-2 items-center">
              <div>交易类型:</div>
              <div className="text-black ">{getTypeName(item.orderType)}</div>
              <div
                className={` ${
                  isPaid() ? "bg-[#6e638b]" : "bg-[#ff4949]"
                } ml-auto text-white px-3 py-0.5 rounded-3xl text-[12px]`}
              >
                {/* {isPaid() ? '已完成' : '等待对方支付'} */}
                {getTxStatus()}
              </div>
            </div>

            <div className="flex gap-2">
              <div>交易单价:</div>
              <div className="text-black ">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={(item.price * usdtToIdxRate) / item.machineIds.length}
                  decimalSubLen={2}
                  className="font-bold mr-1"
                />
                IDX / 台
              </div>
            </div>

            <div className="flex gap-2">
              <div>订单数量:</div>
              <div className="text-black ">{item.machineIds.length}</div>
            </div>

            <div className="flex gap-2">
              <div>发起时间:</div>
              <div className="text-black ">{formatTime(+item.createTime)}</div>
            </div>

            <div className="flex gap-2">
              <div>接收方钱包地址:</div>
              <div className="text-black ">
                {shortenAddress(item.buyer, 4, 4)}
              </div>
            </div>

            <Divider className="!my-2" />

            <div className="flex items-end gap-2 py-1">
              <div className="text-[14px]">
                {isPaid() ? "支付合计" : "待支付合计"}
              </div>
              <div className="text-[22px]  flex items-end text-black font-bold">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={item.price * usdtToIdxRate}
                  decimalSubLen={2}
                />
              </div>
              <div>IDX</div>
            </div>

            {!isPaid() && (
              <button
                className="rounded-3xl border border-dashed border-[#e1e1e1] text-[18px] text-center py-2"
                onClick={handleCancelOrder}
              >
                撤回
              </button>
            )}
          </div>
        </div>
      </div>
    );
  });

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
          {(props) => (
            <ListItem {...props} onHeightChange={handleHeightChange} />
          )}
        </VariableSizeList>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden px-[21px]">
      <div className="flex pt-4">
        <img src={arrowSvg} alt="" onClick={handlBack} />
        <span className="m-auto text-[17px] ">我发起的交易</span>
      </div>
      <DynamicHeightList items={orders} />;
    </div>
  );
};

export default SalePersonTxHistory;
