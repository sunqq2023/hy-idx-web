import { arrowSvg, userMachineSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { Button, Input, Toast } from "antd-mobile";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import config from "@/proviers/config";
import {
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useChainId } from "wagmi";
import { formatEther, parseGwei } from "viem";
import { shortenAddress } from "@/utils/helper";

const SellToPlatform = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chainConfig = useChainConfig();
  const chainId = useChainId();
  const [isSelling, setIsSelling] = useState(false);

  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;

  const [usdtToIdxRate, setUsdtToIdxRate] = useState(0);

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

  const handlBack = () => {
    navigate("/user");
  };

  const pageData = location.state;
  const [priceInUsd, setPriceInUsd] = useState(0);

  const handleQueryProducedHours = useCallback(async () => {
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "getMachineLifecycle",
        args: [pageData.machineId],
      });
      setPriceInUsd(16 * (1 - Number(res.producedHours) / 360));
    } catch (error) {
      console.error(error);
    }
  }, [pageData.machineId]);

  useEffect(() => {
    handleQueryProducedHours();
  }, [handleQueryProducedHours]);

  const handleSellToPlatform = async () => {
    try {
      setIsSelling(true);
      const hash = await writeContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "sellToPlatform",
        args: [pageData.machineId],
        gas: 250000n, // 固定 gas limit
        maxFeePerGas: parseGwei("10"),
        maxPriorityFeePerGas: parseGwei("2"),
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId,
      });
      Toast.show({
        content: "卖出成功",
        position: "center",
      });
      navigate("/user");
    } catch (error) {
      Toast.show({
        content: "卖出失败，请稍后再试",
        position: "center",
      });
      console.error(error);
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <div className="px-[21px]">
      <div className="flex pt-4 mb-4">
        <Button
          onClick={handlBack}
          className="!p-[0] !rounded-2xl"
          loading={isSelling}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">卖给平台</span>
      </div>

      <div className="rounded-3xl bg-white p-4">
        <div className="flex gap-2 items-center">
          <img src={userMachineSvg} alt="" width={51} />
          <div>
            <div className="flex flex-col justify-between py-1">
              <div>
                <span className="text-[20px] font-bold mr-1">
                  {priceInUsd * usdtToIdxRate}
                </span>
                IDX/台 ≈{priceInUsd}USDT/台
              </div>
            </div>
            <div>
              矿机卖家：
              <span className="font-bold">
                {shortenAddress(pageData.seller, 4, 4)}
              </span>
            </div>
          </div>
        </div>

        {/* <div className="flex items-center my-4">
          <div className="w-[80px] text-[16px] font-bold">购买数量</div>
          <div className="relative flex-1">
            <Input
              placeholder="输入整数"
              className="!bg-[#f3f3f3] rounded-3xl px-4 py-2"
              value={count}
              type="number"
              onChange={handleChangeCount}
            />
            <span className="absolute right-[40px] top-[12px] text-[12px] bg-[#895eff] text-white px-2 rounded-3xl">
              MAX
            </span>
            <span className="absolute right-[20px] top-[10px] text-[16px]">
              台
            </span>
          </div>
        </div> */}

        <div className="mt-2 text-end pr-[.625rem]">
          合计：
          <AdaptiveNumber
            type={NumberType.BALANCE}
            value={priceInUsd * usdtToIdxRate}
            decimalSubLen={2}
            className="font-bold text-[20px] mr-1"
          />
          IDX
        </div>

        <Button
          style={{
            "--background-color": "black",
            "--text-color": "white",
            width: "100%",
            marginTop: "20px",
            fontSize: "14px",
          }}
          shape="rounded"
          onClick={handleSellToPlatform}
          loading={isSelling}
        >
          卖出
        </Button>
      </div>
    </div>
  );
};

export default SellToPlatform;
