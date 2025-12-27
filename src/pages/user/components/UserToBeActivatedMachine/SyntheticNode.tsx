import { bottomPatternSvg, infoSvg, selectedSvg, smNodeSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import {
  MiningMachineNodeSystemABI,
  MiningMachineProductionLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useAccount, useChainId } from "wagmi";
import { MachineInfo } from "@/constants/types";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { Button, Checkbox, Divider, Modal, Skeleton, Toast } from "antd-mobile";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import SyntheticNodeCheckableItem from "./SyntheticNodeCheckableItem";
import "./SyntheticNode.module.css";
import config from "@/proviers/config";
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
  multicall,
} from "@wagmi/core";
import { formatEther } from "viem";
import EmptyComp from "@/components/EmptyComp";

const SyntheticNode = () => {
  const [machineList, setMachineList] = useState([]);
  const chainConfig = useChainConfig();
  const chainId = useChainId();
  const [allStatus, setAllStatus] = useState(false);
  const [mixPointsToBeClaimed, setMixPointsToBeClaimed] = useState(0);
  const { address: userAddress } = useAccount();
  const [userNodes, setUserNodes] = useState(0);
  const [SyntheticNodeNeedMachineCount, setSyntheticNodeNeedMachineCount] =
    useState(0);

  const MiningMachineNodeSystemAddress =
    chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;

  const [isLoading, setIsLoading] = useState(false);
  const [isClaimingMIX, setIsClaimingMIX] = useState(false);
  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [wreckageList, setWreckageList] = useState<MachineInfo[]>([]);

  useEffect(() => {
    if (allStatus) {
      setWreckageList(machineList);
    }
  }, [allStatus, machineList]);

  useEffect(() => {
    if (machineList.length === wreckageList.length && wreckageList.length > 0) {
      setAllStatus(true);
    }
  }, [machineList, wreckageList]);

  const handleCloseModal = () => {
    Modal.clear();
  };

  const handleClaimMix = async () => {
    try {
      setIsClaimingMIX(true);

      const hash = await writeContract(config, {
        address: MiningMachineNodeSystemAddress as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "claimMixReward",
        args: [],
        gas: 350000n, // 领取 MIX 奖励（300000n → 350000n）⚠️ 已提高
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId,
      });

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
                你已成功提取MIX收益：
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={mixPointsToBeClaimed}
                  decimalSubLen={2}
                  className="font-bold text-[15px]"
                />
                ，已存入你的钱包中。
              </div>
              <button
                className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                onClick={handleCloseModal}
              >
                确认
              </button>
            </div>
          </div>
        ),
      });
      handleQuery();
    } catch (error) {
      Toast.show({
        content: "提取失败，请稍后再试",
        position: "center",
      });
      console.error(error);
    } finally {
      setIsClaimingMIX(false);
    }
  };

  const handleQuery = useCallback(async () => {
    try {
      setIsLoading(true);
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
          destroyed: e.result.destroyed,
          mtype: e.result.mtype,
          checked: false,
          id: bignumToNumber[i],
          // activatedAt: Number(e.result.activatedAt),
          // createTime: Number(e.result.createTime),
          // expiredAt: Number(e.result.expiredAt),
          // isActivatedStakedLP: e.result.isActivatedStakedLP,
          // isFuelPaid: e.result.isFuelPaid,
          // isProducing: e.result.isProducing,
          // lastProduceTime: Number(e.result.lastProduceTime),
          // producedChildCount: Number(e.result.producedChildCount),
          // producedHours: Number(e.result.producedHours),
          // fuelRemainingMinutes: Number(e.result.fuelRemainingMinutes)
        };
      });

      const nodesAmount = await readContract(config, {
        address: MiningMachineNodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "destroyedMachineCount",
        args: [userAddress],
      });

      let list = result.filter((item) => item.destroyed);
      list = list.slice(0, Number(nodesAmount));

      setMachineList(list);
      console.log("filter nodesAmount * list", list, Number(nodesAmount));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  const getSyntheticNodeNeedMachineCount = async () => {
    try {
      const data = await readContract(config, {
        address: MiningMachineNodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "nodesAmount",
        args: [],
      });
      setSyntheticNodeNeedMachineCount(Number(data));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getSyntheticNodeNeedMachineCount();
  }, []);

  const getUserNodesCount = async () => {
    try {
      const data = await readContract(config, {
        address: MiningMachineNodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "getUserNodeCount",
        args: [userAddress],
      });
      setUserNodes(Number(data));
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getUserNodesCount();
    getUserCurrentAvailableMix();
  }, []);

  const getUserCurrentAvailableMix = async () => {
    try {
      const data = await readContract(config, {
        address: MiningMachineNodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "getUserCurrentAvailableMix",
        args: [userAddress],
      });

      setMixPointsToBeClaimed(+(data ? formatEther(data) : "0"));
    } catch (error) {
      console.error(error);
    }
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

  const handleLeftClick = useCallback(
    (item: MachineInfo) => {
      setMachineList((prevItems) => {
        const newItems = prevItems.map((e) => {
          return e.id === item.id ? { ...e, checked: !e.checked } : e;
        });

        const isItemChecked = !item.checked;
        if (isItemChecked) {
          if (!allStatus) {
            setWreckageList([...wreckageList, item]);
          } else {
            setWreckageList(machineList);
          }
        } else {
          const list = wreckageList.filter((e) => e.id !== item.id);
          setWreckageList(list);
          setAllStatus(false);
        }

        return newItems;
      });
    },
    [allStatus, machineList, wreckageList],
  );

  const getChekeIcon = (checked: boolean): React.ReactNode =>
    checked ? (
      <img src={selectedSvg} alt="" width={16} height={16} />
    ) : (
      <div className="border border-[#a5a4a4] w-[1rem] h-[1rem] rounded-[50%]" />
    );

  const toggleSelectAll = () => {
    setMachineList((prevList) => {
      const newList = prevList.map((item) => {
        return {
          ...item,
          checked: !allStatus,
        };
      });

      if (!allStatus) {
        setWreckageList(newList);
      } else {
        setWreckageList([]);
      }

      return newList;
    });
    setAllStatus(!allStatus);
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
          <SyntheticNodeCheckableItem
            item={item}
            onLeftClick={handleLeftClick}
          />
        </div>
      );
    },
  );

  const handleSynthetic = async () => {
    if (wreckageList.length < SyntheticNodeNeedMachineCount) {
      Toast.show({
        content: `所选残骸数量不足${SyntheticNodeNeedMachineCount}个，无法执行操作`,
        position: "bottom",
        duration: 2000,
      });
      return;
    }

    try {
      setIsClaimingMIX(true);

      const hash = await writeContract(config, {
        address: MiningMachineNodeSystemAddress as `0x${string}`,
        abi: MiningMachineNodeSystemABI,
        functionName: "createNode",
        args: [],
        gas: 450000n, // 创建节点（400000n → 450000n）⚠️ 已提高
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId,
      });

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
                恭喜你“合成小节点”执行成功，您将获得该节点5%平均分红权，以后每天享受分红！
              </div>
              <button
                className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                onClick={handleCloseModal}
              >
                确认
              </button>
            </div>
          </div>
        ),
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        content: "合成失败，请稍后再试",
        position: "center",
      });
    } finally {
      setIsClaimingMIX(false);
    }
  };

  const handleInfoClick = () => {
    Modal.show({
      bodyStyle: {
        color: "#ffffff",
        width: "80vw",
        padding: "10px",
        borderRadius: "20px",
        height: "220px",
      },
      content: (
        <>
          <div className="font-bold text-[15px] mt-1">节点权益说明</div>

          <Divider />

          <div className="font-bold text-[15px] mb-4">合成NFT小节点</div>

          <div className="flex mb-4 gap-1 w-full">
            <div className="bg-[#8665E0] rounded-[5px] px-1 text-white w-[40px] h-[20px] text-[12px] text-center">
              条件
            </div>
            <div className="text-[12px]">
              需
              <span className="text-[#8665E0] font-bold text-[14px]">100</span>
              台矿机残骸合成1个小节点
            </div>
          </div>

          <div className="flex gap-1 w-full">
            <div className="bg-[#8665E0] rounded-[5px] px-1 text-white w-[40px] h-[20px] text-[12px] text-center">
              权益
            </div>
            <div className="text-[12px] flex-1">
              享受全网燃料费总和
              <span className="text-[#8665E0] font-bold text-[14px]">x5%</span>
              的平均分红权。每天分红，每天领取，即刻到账。
            </div>
          </div>
        </>
      ),
      closeOnMaskClick: true,
      showCloseButton: true,
    });
  };

  const tempData = new Array(10).fill({
    checked: false,
    id: 111,
    mtype: 1,
  });

  return (
    <div className="pt-4  flex flex-col justify-between h-full">
      <div className="px-[21px] ">
        <div
          style={{
            background: `#000 url(${bottomPatternSvg}) no-repeat center`,
            width: "100%",
            padding: "21px",
            gap: "5px",
            borderRadius: "25px",
          }}
        >
          <div className="text-white flex justify-between">
            昨日节点分红
            <div className="bg-[#59368C] text-[10px] rounded-2xl text-white flex justify-center items-center px-2 gap-1">
              小节点 x <div>{userNodes}</div>
            </div>
          </div>

          <div className="flex   text-white items-center pt-4 justify-center">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={mixPointsToBeClaimed}
              decimalSubLen={2}
              className="ml-2 mr-1.5  font-bold text-[22px]"
            />
            <div className="text-[11px] pt-[8px] ">MIX</div>
          </div>

          <div className="w-full flex justify-center">
            <Button
              disabled={mixPointsToBeClaimed === 0}
              loading={isClaimingMIX}
              onClick={handleClaimMix}
              className="w-[70%]  !bg-[#7334FE] !rounded-2xl !h-[36px] !mb-2  !items-center  !p-0 !text-white !border-none !text-[14px]"
            >
              提取分红
            </Button>
          </div>

          <div className="flex justify-center">
            <div className="text-[#625A77] text-[11px] w-[80%] text-center">
              分红每日00:00:00结算，请在次日24小时内领取，次日未领取，前日分红自动清零。
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
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
          <div
            className="flex text-[#505050] gap-2 text-[14px]"
            onClick={handleInfoClick}
          >
            节点权益说明
            <img src={infoSvg} alt="" />
          </div>
        </div>

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar  rounded-2xl  mb-[4.5rem]"
        >
          {!isLoading ? (
            machineList.length > 0 ? (
              <List
                height={listHeight}
                width="100%"
                itemCount={machineList.length}
                itemSize={80}
                itemData={machineList}
              >
                {Row}
              </List>
            ) : (
              <EmptyComp />
            )
          ) : (
            <Skeleton.Paragraph animated className={`customSkeleton`} />
          )}
          {/* <List
            height={listHeight}
            width="100%"
            itemCount={tempData.length}
            itemSize={80}
            itemData={tempData}
          >
            {Row}
          </List> */}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 w-full bg-white py-[.4rem] flex items-center px-[21px]">
        {wreckageList.length > 0 && (
          <div className="bg-[#F1F1F3] rounded-[50%] w-[32px] h-[32px] flex justify-center items-center text-[#895FFE] font-bold">
            {wreckageList.length}
          </div>
        )}

        <Button
          disabled={machineList.length === 0}
          onClick={handleSynthetic}
          className="!mx-auto !border-none"
        >
          <div className="!flex !flex-col !items-center !justify-center">
            <img src={smNodeSvg} alt="" width={18} />
            <div className="text-[13px] mt-1">合成小节点</div>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default SyntheticNode;
