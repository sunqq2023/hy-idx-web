import { Swiper, SwiperRef, Tabs } from "antd-mobile";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SwiperTabs.module.css";
import classNames from "classnames";
import orderStore from "@/stores/orderStore";
import { useAccount } from "wagmi";
import { readContract, multicall } from "@wagmi/core";
import config from "@/proviers/config";
import {
  MiningMachineHistoryABI,
  MiningMachineSystemLogicABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";

interface ITab {
  title: string;
  children: JSX.Element;
}

const SwiperTabs = ({
  tabs,
  customClassName,
  getTabKey,
  defaultKey,
  titleFontSize,
}: {
  tabs: ITab[];
  customClassName?: string;
  getTabKey?: (val: number) => void;
  defaultKey?: number;
  titleFontSize?: string;
}) => {
  const ref = useRef<SwiperRef>(null);
  const [tabKey, setTabKey] = useState("1");
  const [defaultIndex, setDefaultIndex] = useState(1);
  const chainConfig = useChainConfig();

  const MiningMachineHistoryAddress =
    chainConfig.HISTORY_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;

  const { address: userAddress } = useAccount();
  const awaitingPaymentItemsLength = orderStore.getUnPaidLength();

  useEffect(() => {
    if (getTabKey) {
      getTabKey(+tabKey);
    }
  }, [tabKey, getTabKey]);

  useEffect(() => {
    if (defaultKey !== undefined) {
      setDefaultIndex(defaultKey);
      handleTabChange(`${defaultKey}`);
    }
  }, [defaultKey]);

  const handleTabChange = (key: string) => {
    setTabKey(key);
    ref?.current?.swipeTo(Number(key));
  };

  const handleQueryAllListedOrders = useCallback(async () => {
    try {
      const buyerOrderIds = await readContract(config, {
        address: MiningMachineHistoryAddress,
        abi: MiningMachineHistoryABI,
        functionName: "getBuyerOrderIds",
        args: [userAddress, 0, 100],
      });

      const bignumToNumber = (buyerOrderIds as bigint[]).map((e) => Number(e));

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

      const resultListWithMachineIds = resultList.map((item, index) => {
        const formatIdToNumber = data4[index].result.map((id: bigint) =>
          Number(id),
        );
        return {
          ...item,
          machineIds: formatIdToNumber,
        };
      });

      console.log("buyer list", resultListWithMachineIds);

      // seller orderids

      const sellerOrderIds = await readContract(config, {
        address: MiningMachineHistoryAddress,
        abi: MiningMachineHistoryABI,
        functionName: "getSellerOrderIds",
        args: [userAddress, 0, 100],
      });

      const sellerBignumToNumber = (sellerOrderIds as bigint[]).map((e) =>
        Number(e),
      );

      const sellercontracts = sellerBignumToNumber.map((id) => {
        return {
          address: MiningMachineHistoryAddress,
          abi: MiningMachineHistoryABI,
          functionName: "allOrders",
          args: [id],
        };
      });
      const sellerdata2 = await multicall(config, {
        contracts: sellercontracts,
      });
      const selleritemList = sellerdata2.map((item) => {
        return {
          orderId: Number(item.result[0]),
          seller: item.result[1],
          buyer: item.result[2],
          createTime: String(item.result[3]),
          status: item.result[4],
          orderType: 2,
        };
      });

      const sellerpriceAndMachineIdsContracts = sellerBignumToNumber.map(
        (id) => {
          return {
            address: MiningMachineSystemLogicAddress,
            abi: MiningMachineSystemLogicABI,
            functionName: "internalOrders",
            args: [id],
          };
        },
      );

      const sellerdata3 = await multicall(config, {
        contracts: sellerpriceAndMachineIdsContracts,
      });

      const sellerresultList = selleritemList.map((item, index) => {
        return {
          ...item,
          price: Number(sellerdata3[index].result[2]),
        };
      });

      const sellermachineIdsContracts = sellerBignumToNumber.map((id) => {
        return {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "getInternalOrderMachineIds",
          args: [id],
        };
      });

      const sellerdata4 = await multicall(config, {
        contracts: sellermachineIdsContracts,
      });

      const sellerresultListWithMachineIds = sellerresultList.map(
        (item, index) => {
          const formatIdToNumber = sellerdata4[index].result.map((id: bigint) =>
            Number(id),
          );
          return {
            ...item,
            machineIds: formatIdToNumber,
          };
        },
      );

      console.log("seller list", sellerresultListWithMachineIds);

      let list = [
        ...resultListWithMachineIds,
        ...sellerresultListWithMachineIds,
      ];

      const sellList = orderStore.getallListedOrders().map((e) => ({
        ...e,
        orderType: 3,
      }));

      list = list
        .filter(
          (item) =>
            item.machineIds.length !== 0 &&
            (item.seller === userAddress || item.buyer === userAddress),
        )
        .concat(sellList)
        .sort((a, b) => a.status - b.status);

      // 用户交易历史
      const unPaidLength = list.filter(
        (item) =>
          item.status === 0 &&
          (item.seller === userAddress || item.buyer === userAddress) &&
          !item.listedAt,
      ).length;
      orderStore.updateData(list, unPaidLength);

      // 用户交易历史中未处理订单数量
    } catch (error) {
      console.error(error);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQueryAllListedOrders();
  }, [handleQueryAllListedOrders]);

  return (
    <div className="h-full relative">
      <Tabs
        activeKey={tabKey}
        onChange={handleTabChange}
        stretch={false}
        className={classNames(
          customClassName,
          [styles["adm-tabs"]],
          ` ml-[15px] mr-[120px]
            h-[48px] !shrink-0  [&_.adm-tabs-tab-wrapper]:flex-none [&_.adm-tabs-tab-wrapper]:px-0 [&_.adm-tabs-tab-wrapper]:mr-1
            [&_.adm-tabs-tab.adm-tabs-tab-active]:font-medium [&_.adm-tabs-tab.adm-tabs-tab-active]:opacity-100 
            [&_.adm-tabs-tab]:pb-[11px] [&_.adm-tabs-tab]:pt-[14px] [&_.adm-tabs-tab]:text-[15px] 
            [&_.adm-tabs-tab]:opacity-40 [&_.adm-tabs-tab]:transition-transform
          `,
        )}
        style={{
          "--title-font-size": `${titleFontSize ? titleFontSize : "1.06rem"}`,
        }}
      >
        {tabs.map((tab, index) => (
          <Tabs.Tab key={index} title={tab.title} className="" />
        ))}
      </Tabs>
      {awaitingPaymentItemsLength > 0 && (
        <div className="absolute top-[.1875rem] left-[8.9rem]  bg-[red] h-[.6875rem] w-[.6875rem] p-1 rounded-3xl flex items-center justify-center text-white text-[.6rem] leading-[.6rem]"></div>
      )}

      {/* <div className='w-[140px'></div> */}

      <Swiper
        className="!h-[calc(100%-48px)] outline-0"
        ref={ref}
        indicator={() => null}
        tabIndex={Number(tabKey)}
        defaultIndex={defaultIndex}
        onIndexChange={(index) => setTabKey(`${index}`)}
      >
        {tabs.map((tab, index) => (
          <Swiper.Item
            key={index}
            className="no-scrollbar max-w-full overflow-y-auto overflow-x-hidden "
          >
            {tab.children}
          </Swiper.Item>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperTabs;
