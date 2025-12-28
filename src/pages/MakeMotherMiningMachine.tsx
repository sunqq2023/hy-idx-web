import { makemmmSvg, noSvg, percentSvg, rmbSvg } from "@/assets";
import { Button, Divider, Input, TextArea, Toast } from "antd-mobile";
import { useCallback, useEffect, useState } from "react";
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
  multicall,
} from "@wagmi/core";
import config from "@/proviers/config";
import { useNavigate } from "react-router-dom";
import {
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
  CHAIN_ID,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useChainId, useAccount, useWriteContract } from "wagmi";
import { formatEther, parseGwei } from "viem";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";

const isEmptyString = (str: string) => {
  return !str || str.trim().length === 0;
};

const MakeMotherMiningMachine = () => {
  const { address } = useAccount();
  const chainConfig = useChainConfig();
  const chainId = useChainId();

  // 使用动态地址
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;

  const [count, setCount] = useState("");
  const [price, setPrice] = useState("");
  const [percent, setPercent] = useState("");
  const [distributorAddress, setDistributorAddress] = useState("");
  const [distributorName, setDistributorName] = useState("");

  const [activeAndGasFee, setActiveAndGasFee] = useState("");

  const [PLATFORM_FEE_USD, setPLATFORM_FEE_USD] = useState("");
  const [SELLER_INCOME_USD, setSELLER_INCOME_USD] = useState("");
  const [feeLoading, setFeeLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const queryActiveAndGasFee = async () => {
    try {
      const contracts = [
        {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "PLATFORM_FEE_USD",
          args: [],
        },
        {
          address: MiningMachineSystemLogicAddress,
          abi: MiningMachineSystemLogicABI,
          functionName: "SELLER_INCOME_USD",
          args: [],
        },
      ];

      const res = await multicall(config, {
        contracts,
      });

      setPLATFORM_FEE_USD(String(res[0].result));
      setSELLER_INCOME_USD(String(res[1].result));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    queryActiveAndGasFee();
  }, []);

  const handleChangeActiveAndGasFee = async () => {
    if (PLATFORM_FEE_USD === "" || SELLER_INCOME_USD === "") {
      Toast.show({
        content: "正在读取链上数据，请稍后再尝试",
        position: "center",
      });
      return;
    }

    if (+activeAndGasFee === 0 || activeAndGasFee === "") {
      Toast.show({
        content: "燃料费、提现费不能为0",
        position: "center",
      });
      return;
    }
    try {
      setFeeLoading(true);
      const hash = await writeContractAsync({
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "setChildMachineTradeConfig",
        args: [PLATFORM_FEE_USD, SELLER_INCOME_USD, activeAndGasFee],
        gas: 600000n, // 复杂操作：修改多个参数（与Setting.tsx和工具函数保持一致）
        // 移除硬编码的 gas price，让钱包自动估算
        chainId: CHAIN_ID,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId,
      });
      Toast.show({
        content: "修改成功!",
        position: "center",
      });
      setFeeLoading(false);
      setActiveAndGasFee("");
    } catch (error) {
      Toast.show({
        content: "修改失败",
        position: "center",
      });
      setFeeLoading(false);
      console.error(error);
    }
  };

  const [isMaking, setIsMaking] = useState(false);
  const navigate = useNavigate();

  const [usdtToIdxRate, setUsdtToIdxRate] = useState("0");

  const handleMake = async () => {
    // navigate('/sale-person')
    // return

    if (
      isEmptyString(count) ||
      isEmptyString(price) ||
      isEmptyString(percent) ||
      isEmptyString(distributorName) ||
      isEmptyString(distributorName) ||
      isEmptyString(distributorAddress)
    ) {
      Toast.show({
        content: "请填充完整表单",
        position: "center",
        duration: 1000,
      });
      return;
    }

    try {
      Toast.show({
        content: "制作中...",
        position: "center",
        duration: 0,
      });

      setIsMaking(true);

      const args = [
        +count,
        +price,
        +percent,
        distributorName,
        distributorAddress,
      ];

      // 动态计算 Gas Limit（批量铸造母矿机）
      // 分析：batchMintMotherMachine 对每个矿机执行以下操作：
      // 1. 设置分销商信息（一次性）：约20k gas
      // 2. 设置BatchInfo（一次性）：约50k gas
      // 3. 循环内（每台矿机）：
      //    - store.setNextMachineId() - 写入，约5k gas
      //    - store.setMachine() - 结构体写入，约20k gas
      //    - store.pushOwnerToMachineId() - 数组push，约20k gas
      //    - store.setMachineLifecycle() - 结构体写入，约50k-100k gas
      //    - store.setMotherMachinePrice() - 写入，约5k gas
      //    - store.incrementBatchMinted() - 写入，约5k gas
      //    总计每台约 105k-155k gas
      // 4. 设置分销商用户名（一次性）：约20k gas
      // 5. history.recordMachineMints（一次性，外部调用）：约50k-100k gas
      //
      // 基础开销：函数调用、一次性操作等，约 200k-300k
      // 考虑到存储操作的复杂性，每台矿机取 200k gas 是合理的
      const baseGas = 500000n; // 基础开销（函数调用 + 一次性操作）
      const perMachineGas = 200000n; // 每台矿机的gas（包含所有存储操作）
      // 计算示例：
      //   10台 = 2.5M gas
      //   100台 = 20.5M gas
      //   125台 = 25.5M gas（超过25M，需要限制）
      //   150台 = 30.5M gas（超过block gas limit）
      //
      // 注意：BSC block gas limit = 30M，为了安全起见，设置上限为 25M
      const MAX_GAS_LIMIT = 25000000n; // 25M gas limit，留出5M的安全余量
      const calculatedGasLimit = baseGas + BigInt(count) * perMachineGas;

      // 检查是否超过最大gas limit
      if (calculatedGasLimit > MAX_GAS_LIMIT) {
        const maxCount = Math.floor(Number(MAX_GAS_LIMIT - baseGas) / Number(perMachineGas));
        const errorMsg = `数量过多（${count}台），计算出的 Gas Limit (${calculatedGasLimit.toString()}) 超过安全上限 (${MAX_GAS_LIMIT.toString()})。请分批铸造，每批最多 ${maxCount} 台`;
        console.error(`❌ ${errorMsg}`);
        Toast.show({
          content: errorMsg,
          position: "center",
          duration: 5000,
        });
        setIsMaking(false);
        Toast.clear();
        return; // 提前返回，不发送交易
      }

      const gasLimit = calculatedGasLimit;

      console.log(`计算的 Gas Limit: ${gasLimit.toString()} (${count} 台，计算值: ${calculatedGasLimit.toString()})`);

      // storage
      const hash = await writeContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "batchMintMotherMachine",
        args,
        gas: gasLimit, // 动态计算 gas limit
        // 移除硬编码的 gas price，让钱包自动估算
        chainId: CHAIN_ID,
      });

      await waitForTransactionReceipt(config, {
        hash,
        chainId,
      });

      Toast.clear();
    } catch (error: any) {
      // 增强错误处理
      let errorMsg = "制作失败";
      const errorMessage = error?.message?.toLowerCase() || String(error).toLowerCase();

      // 检测 Gas 不足
      if (
        errorMessage.includes("out of gas") ||
        errorMessage.includes("gas required exceeds allowance") ||
        errorMessage.includes("intrinsic gas too low")
      ) {
        errorMsg = `Gas 不足。当前尝试铸造 ${count} 台母矿机，建议减少数量分批铸造（每批建议不超过 100 台）`;
      }
      // 检测其他错误
      else if (errorMessage.includes("用户拒绝") || errorMessage.includes("user rejected")) {
        errorMsg = "用户取消了交易";
      }
      // 其他错误保持原样
      else {
        errorMsg = `制作失败: ${error?.message || String(error)}`;
      }

      Toast.show({
        content: errorMsg,
        position: "center",
        duration: 4000,
      });
      console.error(error);
    } finally {
      setIsMaking(false);
    }
  };

  const handleQueryHistory = () => {
    if (isMaking) {
      return;
    }
    navigate("/make-mmm/history");
  };

  const getUsdtToIdxRate = async () => {
    try {
      const data = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "getIDXAmount",
        args: [1],
      });

      const rate = data ? formatEther(data) : "0";
      setUsdtToIdxRate(rate);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getUsdtToIdxRate();
  }, []);

  // const getIsSalePerson = useCallback(async () => {
  //   try {
  //     const result = await readContract(config, {
  //       address: MiningMachineSystemStorageAddress,
  //       abi: MiningMachineSystemStorageABI,
  //       functionName: 'isMotherMachineDistributor',
  //       args: [address]
  //     })
  //     console.log('test', result)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }, [address])

  // useEffect(() => {
  //   getIsSalePerson()
  // }, [getIsSalePerson])

  return (
    <div className="pt-4 pb-6 px-[21px]">
      <span className="ml-4">制作母矿机</span>

      <div className="container-wrap mt-3">
        <Item
          src={noSvg}
          text="母矿机制作数量"
          inputText="输入数量"
          unit="台"
          value={count}
          max={100}
          setValue={setCount}
        />
        <Item
          value={price}
          setValue={setPrice}
          src={rmbSvg}
          text="渠道销售单价"
          inputText="输入单价"
          unit="USDT/台"
          slot={
            <div className="flex justify-end mt-1 gap-2">
              <span className="font-bold">1</span>
              <span className="">USDT =</span>
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={usdtToIdxRate}
                decimalSubLen={2}
                className="font-bold"
              />
              IDX
            </div>
          }
          max={1000}
        />
        <Item
          value={percent}
          setValue={setPercent}
          src={percentSvg}
          text="销售员提成比例"
          inputText="输入比例"
          unit="%"
          max={100}
        />

        <div className="mb-2">
          <div className="flex items-center mb-2">
            <div className="bg-black rounded-[50%] w-[.3125rem] h-[.3125rem] mr-2"></div>
            <div>分销商钱包地址</div>
          </div>
          <TextArea
            onChange={(val) => setDistributorAddress(val)}
            value={distributorAddress}
            placeholder="输入钱包地址..."
            rows={2}
            className="bg-[#ececee] rounded-3xl p-5 "
          />
        </div>
        <Divider className="mt-4  w-full h-0.5 bg-[#ececee]" />

        <div className="mb-8">
          <div className="flex items-center mb-2">
            <div className="bg-black rounded-[50%] w-[.3125rem] h-[.3125rem] mr-2"></div>
            <div>分销商备注名</div>
          </div>
          <Input
            onChange={(val) => setDistributorName(val)}
            value={distributorName}
            placeholder="输入备注名..."
            className="!bg-[#ececee] rounded-3xl px-5 py-1"
          />
        </div>

        <Button
          onClick={handleMake}
          className="!bg-black !rounded-3xl !text-white flex justify-center !py-1 w-full !text-[13px]"
          loading={isMaking}
        >
          制作母矿机
        </Button>
      </div>

      <div className="container-wrap mt-3">
        <img
          src={makemmmSvg}
          alt=""
          className="ml-8"
          onClick={handleQueryHistory}
        />
      </div>

      <div className="bg-white p-3 rounded-2xl mt-2 flex flex-col gap-1">
        <h2 className="mb-2 font-bold">费用设置</h2>
        <Input
          placeholder="燃烧费、激活费"
          style={{
            "--font-size": "13px",
          }}
          className="!bg-[#f3f3f3] rounded-3xl px-4 py-2 !flex !items-center !justify-center mb-2"
          value={activeAndGasFee}
          type="number"
          onChange={(val) => setActiveAndGasFee(val)}
        />
        <Button
          className="!bg-black !text-white !rounded-3xl !ml-auto !mt-2  !py-1 !w-full"
          style={{
            fontSize: "13px",
          }}
          loading={feeLoading}
          onClick={() => handleChangeActiveAndGasFee()}
        >
          修改
        </Button>
      </div>
    </div>
  );
};

const Item = ({
  value,
  setValue,
  src,
  text,
  inputText,
  unit,
  slot,
  max,
}: {
  value: string | undefined;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  src: string;
  text: string;
  inputText: string;
  unit: string;
  slot?: React.ReactNode;
  max: number;
}) => {
  const handleChange = (val: string) => {
    if (+val <= max) {
      setValue(val);
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img className="mr-1.5" src={src} alt="" />
          <div>{text}</div>
        </div>
        <div className="relative">
          <Input
            onChange={handleChange}
            value={value}
            placeholder={inputText}
            type="number"
            max={max}
            className="!bg-[#ececee] px-5 py-1.5 text-[#aba8b1] rounded-3xl !text-[15px] !max-w-[11rem]"
          />
          <div className="pointer-none absolute right-5 top-[50%] translate-y-[-50%] text-[#292929] text-[13px]">
            {unit}
          </div>
        </div>
      </div>

      {slot}
      <Divider className="mt-4  w-full h-0.5 bg-[#ececee]" />
    </div>
  );
};

export default MakeMotherMiningMachine;
