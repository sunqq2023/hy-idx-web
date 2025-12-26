import {
  chainsSvgs,
  idxBackgroundSvg,
  robotSvg,
  selectedSvg,
  transferSvg,
  usdtSvg,
} from "@/assets";
import { Checkbox, Skeleton, Toast } from "antd-mobile";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import config from "@/proviers/config";
import { readContract, multicall, getBalance } from "@wagmi/core";
import { FixedSizeList as List } from "react-window";
import CheckableItem from "@/components/CheckableItem";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { MachineInfo } from "@/constants/types";
import { useAccount, useChainId } from "wagmi";
import { erc20Abi, formatEther, formatUnits } from "viem";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import {
  MiningMachineHistoryABI,
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";

const SalePersonPage = () => {
  const { address: userAddress } = useAccount();
  const chainConfig = useChainConfig();
  const chainId = useChainId();

  // 使用动态地址
  const MiningMachineHistoryAddress =
    chainConfig.HISTORY_ADDRESS as `0x${string}`;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;
  const USDT_CONTRACTS_ADDRESS = chainConfig.USDT_TOKEN as `0x${string}`;

  const [machineList, setMachineList] = useState<MachineInfo[]>([]);

  const [allStatus, setAllStatus] = useState(false);

  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [transferList, setTransferList] = useState<MachineInfo[]>([]);

  const navigate = useNavigate();

  const [bnbBalance, setBnbBalance] = useState("");
  const [idxBalance, setIdxBalance] = useState("");
  const [usdtBalance, setUsdtBalance] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [motherHold, setMotherHold] = useState("0");
  const [motherTransferred, setMotherTransferred] = useState("0");
  const [isUnPayListLength, setIsUnPayListLength] = useState(0);

  const handleQueryTransferRecords = useCallback(async () => {
    try {
      const orderIds = await readContract(config, {
        address: MiningMachineHistoryAddress,
        abi: MiningMachineHistoryABI,
        functionName: "getSellerOrderIds",
        args: [userAddress, 0, 100],
      });

      console.log("orderIds", orderIds);

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

      const isUnPayList = itemList.filter((item) => item.status === 0);
      setIsUnPayListLength(isUnPayList.length);
      console.log("sale person transfer history detail", itemList);
    } catch (error) {
      console.error(error);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQueryTransferRecords();
  }, [handleQueryTransferRecords]);

  useEffect(() => {
    if (allStatus) {
      setTransferList(machineList);
    }
  }, [allStatus, machineList]);

  useEffect(() => {
    if (transferList.length === machineList.length && transferList.length > 0) {
      setAllStatus(true);
    }
  }, [transferList.length, machineList.length]);

  const toggleSelectAll = () => {
    setMachineList((prevList) => {
      const newList = prevList.map((item) => {
        return {
          ...item,
          checked: !allStatus,
        };
      });

      if (!allStatus) {
        setTransferList(newList);
      } else {
        setTransferList([]);
      }

      return newList;
    });

    setAllStatus(!allStatus);
  };

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
          lastProduceTime: Number(e.result.lastProduceTime),
          mtype: e.result.mtype,
          producedChildCount: Number(e.result.producedChildCount),
          producedHours: Number(e.result.producedHours),
          id: bignumToNumber[i],
          checked: false,
          status: e.status,
        };
      });

      // 获取母矿机生命剩余
      const remainingContract = result.map((item) => {
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

      const list = result.map((item, i) => ({
        ...item,
        unclaimedChildCount: Number(data4[i].result[2]),
      }));

      const isOnSaleContract = list.map((item) => {
        return {
          address: MiningMachineSystemStorageAddress,
          abi: MiningMachineSystemStorageABI,
          functionName: "_isOnSale",
          args: [item.id],
        };
      });

      const result2 = await multicall(config, {
        contracts: isOnSaleContract,
      });

      let finallyList = list.map((item, i) => {
        return {
          ...item,
          isOnSale: result2[i].result,
        };
      });

      finallyList = finallyList.filter((item) => !item.isOnSale);
      setMachineList(finallyList);
      console.log("sale person machine list", finallyList);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  useEffect(() => {
    const handleQueryUserBalance = async () => {
      try {
        const data = await getBalance(config, {
          address: userAddress!,
          chainId,
        });
        const bnbBalance = formatUnits(data.value, data.decimals);
        setBnbBalance(bnbBalance);

        const contracts = [
          {
            address: IDX_CONTRACTS_ADDRESS, // idx address
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [userAddress],
          },

          {
            address: USDT_CONTRACTS_ADDRESS, // usdt address
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [userAddress],
          },
          {
            address: MiningMachineHistoryAddress,
            abi: MiningMachineHistoryABI,
            functionName: "getAddressStats",
            args: [userAddress],
          },
        ];

        const result = await multicall(config, {
          contracts,
        });

        setIdxBalance(result[0].result ? formatEther(result[0].result) : "0");
        setUsdtBalance(result[1].result ? formatEther(result[1].result) : "0");

        const motherMachineStatus = result[2].result as bigint[];

        console.log("motherMachineStatus", motherMachineStatus);
        setMotherHold(String(motherMachineStatus[0]));
        setMotherTransferred(String(motherMachineStatus[2]));
      } catch (error) {
        console.error(error);
      }
    };
    handleQueryUserBalance();
  }, [userAddress]);

  const handleLeftClick = useCallback(
    (item: MachineInfo) => {
      setMachineList((prevItems) => {
        const newItems = prevItems.map((e) =>
          e.id === item.id ? { ...e, checked: !e.checked } : e,
        );

        const isItemChecked = !item.checked;
        if (isItemChecked) {
          if (!allStatus) {
            setTransferList([...transferList, item]);
          } else {
            setTransferList(machineList);
          }
        } else {
          const list = transferList.filter((e) => e.id !== item.id);
          setTransferList(list);
          setAllStatus(false);
        }

        return newItems;
      });
    },
    [allStatus, machineList, transferList],
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
          <CheckableItem
            item={item}
            onLeftClick={handleLeftClick}
            onRightClick={handleRightClick}
          />
        </div>
      );
    },
  );

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  const handleTransfer = () => {
    if (transferList.length === 0) {
      Toast.show({
        content: "请选择要转让的矿机",
        position: "center",
        duration: 2000,
      });
      return;
    }
    navigate("/transfer-machine", { state: transferList });
  };

  const getChekeIcon = (checked: boolean): React.ReactNode =>
    checked ? (
      <img src={selectedSvg} alt="" width={16} height={16} />
    ) : (
      <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
    );

  const handleQueryHistory = () => {
    navigate("/sale-person/history");
  };

  return (
    <div className="pt-4 flex flex-col justify-between h-full overflow-scroll">
      <div className="px-[21px]">
        <div className="bg-[#09090a] rounded-2xl text-white p-5 text-[1rem] relative">
          <div className="text-[#c6c6c6] text-[11px] font-[400]">
            我的钱包余额
          </div>

          <div className="flex items-center mt-5 mb-2">
            <div className="bg-[#895eff] rounded-[50%] w-[19px] h-[19px]  "></div>
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
              <span className="text-[#c6c6c6] text-[12px] font-[400]">IDX</span>
            </div>
          </div>

          <div className="flex mb-2">
            <img src={usdtSvg} alt="" width={19} height={19} />
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={usdtBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
              <span className="text-[#c6c6c6] text-[12px] font-[400]">
                USDT
              </span>
            </div>
          </div>

          <div className=" flex">
            <img src={chainsSvgs.bscSvg} alt="" width={19} height={19} />
            <div>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={bnbBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5"
              />
              <span className="text-[#c6c6c6] text-[12px] font-[400]">BNB</span>
            </div>
          </div>

          <img
            src={idxBackgroundSvg}
            alt=""
            width={180}
            height={87}
            className="absolute bottom-[20px] right-[20px]"
          />
        </div>

        <div className="bg-[#09090a] rounded-t-2xl text-white  p-5 text-[1.125rem] mt-4">
          <div className="text-white text-[.75rem] ">我的母矿机总数</div>

          <div className="flex items-center py-1">
            <img src={robotSvg} alt="" width={26} height={26} />
            <div>
              <span className="text-[1.5rem] font-[400] mx-2">
                {motherHold}
              </span>
              <span className="text-[.875rem] font-[400]">台</span>
            </div>
          </div>
        </div>

        <div className="bg-white text-[#636262] rounded-b-2xl p-3 text-[.875rem] flex justify-between">
          <div>
            累计转出:
            <span className="font-bold text-[1rem] mx-2">
              {motherTransferred}
            </span>
            台
          </div>
          <div className="flex gap-2 items-center" onClick={handleQueryHistory}>
            矿机转让记录
            <div
              className={classNames(
                [isUnPayListLength === 0 ? "bg-[#E3E3E3]" : "bg-[#ff5353]"],
                [isUnPayListLength === 0 ? "text-black" : "text-white"],
                "rounded-[50%]  w-[20px] h-[20[px]  flex justify-center items-center",
              )}
            >
              {isUnPayListLength === 0 ? <>i</> : isUnPayListLength}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Checkbox
            className="mr-6"
            checked={allStatus}
            icon={(isChecked) => getChekeIcon(isChecked)}
            onClick={toggleSelectAll}
            style={{
              "--font-size": "13px",
              "--gap": "6px",
            }}
          >
            全选
          </Checkbox>
        </div>

        {/* 列表 */}

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar mb-[4rem]"
        >
          {!isLoading ? (
            <List
              height={listHeight}
              width="100%"
              itemCount={machineList.length}
              itemSize={105}
              itemData={machineList}
            >
              {Row}
            </List>
          ) : (
            <Skeleton.Paragraph animated className={`customSkeleton`} />
          )}
        </div>
      </div>

      <div
        className="fixed bottom-0  w-full bg-white h-[4rem] flex items-center mt-auto px-[21px]"
        onClick={handleTransfer}
      >
        {transferList.length > 0 && (
          <div className="bg-[#F1F1F3] rounded-[50%] w-[32px] h-[32px] flex justify-center items-center text-[#895FFE] font-bold">
            {transferList.length}
          </div>
        )}
        <div className="flex flex-col items-center justify-center mx-auto">
          <img src={transferSvg} alt="" width={18} />
          <span className="text-[14px] mt-1">转让矿机</span>
        </div>
      </div>
    </div>
  );
};

export default SalePersonPage;
