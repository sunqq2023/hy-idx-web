import { arrowSvg } from "@/assets";
import { Button, Divider, Toast } from "antd-mobile";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { readContract } from "@wagmi/core";
import config from "@/proviers/config";
import {
  ALLOWANCE_QUOTA,
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { erc20Abi, formatEther, parseEther, parseGwei } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { usePaymentCheck } from "@/hooks/usePaymentCheck";

const AddFuel = () => {
  const { address: userAddress, chain } = useAccount();
  const chainConfig = useChainConfig();

  // 使用动态地址
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const IDX_CONTRACTS_ADDRESS = chainConfig.IDX_TOKEN as `0x${string}`;

  const navigate = useNavigate();
  const location = useLocation();

  const pageData = location.state;

  const [isPaying, setIsPaying] = useState(false);
  const [idxBalance, setIdxBalance] = useState("");
  const [idxPrice, setIdxPrice] = useState(0);

  const [monthCount, setMonthCount] = useState(1);
  const [unactivatedMachines, setUnactivatedMachines] = useState<any[]>([]);
  const [isCheckingActivation, setIsCheckingActivation] = useState(true);

  const { executeSequentialCalls, batchPayFuel } = useSequentialContractWrite();
  const { writeContractAsync } = useWriteContract();
  const [maskCount, setMaskCount] = useState(1); // 批量操作只有1笔交易
  const handlBack = () => {
    navigate("/user");
  };

  const handleQueryIdxBalance = useCallback(async () => {
    try {
      console.log("=== 查询IDX余额 ===");
      console.log("合约地址:", IDX_CONTRACTS_ADDRESS);
      console.log("合约ABI:", erc20Abi);
      console.log("函数名: balanceOf");
      console.log("查询地址:", userAddress);

      const balance = await readContract(config, {
        address: IDX_CONTRACTS_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress!],
        chainId: chain?.id,
      });

      console.log("原始余额数据:", balance);
      console.log("格式化后余额:", formatEther(balance));
      setIdxBalance(formatEther(balance));
    } catch (error) {
      console.error("查询IDX余额失败:", error);
    }
  }, [userAddress]);

  useEffect(() => {
    handleQueryIdxBalance();
  }, [handleQueryIdxBalance]);

  const handleQueryIdxPrice = async () => {
    try {
      console.log("=== 查询IDX价格 ===");
      console.log("合约地址:", MiningMachineSystemLogicAddress);
      console.log("合约ABI:", MiningMachineSystemLogicABI);
      console.log("函数名: getIDXAmount");
      console.log("参数: [15] (15 USDT)");

      const price = await readContract(config, {
        address: MiningMachineSystemLogicAddress,
        abi: MiningMachineSystemLogicABI,
        functionName: "getIDXAmount",
        args: [15],
        chainId: chain?.id,
      });

      console.log("原始价格数据:", price);
      console.log("格式化后价格:", price ? formatEther(price as bigint) : "0");
      setIdxPrice(+(price ? formatEther(price as bigint) : "0"));
    } catch (error) {
      console.error("查询IDX价格失败:", error);
    }
  };

  useEffect(() => {
    handleQueryIdxPrice();
  }, []);

  // 检查所有矿机的激活状态
  const checkMachinesActivation = useCallback(async () => {
    if (!pageData || pageData.length === 0) {
      setIsCheckingActivation(false);
      return;
    }

    console.log("=== 检查矿机激活状态 ===");
    setIsCheckingActivation(true);
    const unactivated = [];
    let hasError = false;

    for (const machine of pageData) {
      try {
        console.log(`检查矿机 ${machine.id} 的激活状态...`);
        const lifecycle = await readContract(config, {
          address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
          abi: MiningMachineSystemStorageABI,
          functionName: "getMachineLifecycle",
          args: [BigInt(machine.id)],
          chainId: chain?.id,
        });

        console.log(`矿机 ${machine.id} 生命周期数据:`, lifecycle);

        // isActivatedStakedLP 是第5个字段（索引4）
        // 注意：返回的可能是对象而不是数组，需要同时支持两种方式
        const isActivated =
          (lifecycle as any).isActivatedStakedLP ?? lifecycle[4];
        console.log(`矿机 ${machine.id} 激活状态:`, isActivated);
        console.log(`矿机 ${machine.id} 激活状态类型:`, typeof isActivated);

        if (!isActivated) {
          unactivated.push(machine);
          console.log(`矿机 ${machine.id} 未激活LP`);
        }
      } catch (error) {
        console.error(`检查矿机 ${machine.id} 激活状态失败:`, error);
        hasError = true;
        // 如果检查失败，显示错误提示但不阻止支付
        Toast.show({
          content: `检查矿机 ${machine.id} 状态失败，请刷新重试`,
          position: "center",
          duration: 2000,
        });
      }
    }

    console.log("未激活LP的矿机:", unactivated);
    setUnactivatedMachines(unactivated);
    setIsCheckingActivation(false);
  }, [pageData, chain?.id, chainConfig.STORAGE_ADDRESS]);

  useEffect(() => {
    checkMachinesActivation();
  }, [checkMachinesActivation]);

  const {
    isLoading: isPaymentCheckLoading,
    isAllowanceSufficient,
    isBalanceSufficient,
    balance: idxBalanceBigInt,
    allowance: idxAllowance,
  } = usePaymentCheck({
    paymentAmount: parseEther(
      String(Math.ceil(idxPrice * monthCount * pageData.length)),
    ),
    tokenAddress: IDX_CONTRACTS_ADDRESS,
    spenderAddress: MiningMachineSystemLogicAddress,
  });

  // 添加调试日志
  useEffect(() => {
    if (!isPaymentCheckLoading) {
      console.log("=== 支付检查结果 ===");
      console.log("IDX余额 (BigInt):", idxBalanceBigInt);
      console.log("IDX余额 (格式化):", formatEther(idxBalanceBigInt));
      console.log("IDX授权额度 (BigInt):", idxAllowance);
      console.log("IDX授权额度 (格式化):", formatEther(idxAllowance));
      console.log(
        "需要支付:",
        formatEther(
          parseEther(
            String(Math.ceil(idxPrice * monthCount * pageData.length)),
          ),
        ),
        "IDX",
      );
      console.log("余额是否充足:", isBalanceSufficient);
      console.log("授权是否充足:", isAllowanceSufficient);
    }
  }, [
    isPaymentCheckLoading,
    idxBalanceBigInt,
    idxAllowance,
    isBalanceSufficient,
    isAllowanceSufficient,
    idxPrice,
    monthCount,
    pageData.length,
  ]);

  const handlePay = async () => {
    try {
      console.log("=== 开始加注燃料流程 ===");
      console.log("当前用户地址:", userAddress);
      console.log("当前链信息:", {
        chainId: chain?.id,
        chainName: chain?.name,
        rpcUrl: chain?.rpcUrls?.default?.http?.[0],
        blockExplorer: chain?.blockExplorers?.default?.url,
      });
      console.log("选中的矿机数据:", pageData);
      console.log("购买月数:", monthCount);
      console.log("IDX价格:", idxPrice);
      console.log("总费用计算:", idxPrice * monthCount * pageData.length);

      // 检查是否有未激活LP的矿机
      if (unactivatedMachines.length > 0) {
        console.log("发现未激活LP的矿机:", unactivatedMachines);
        Toast.show({
          content: `有 ${unactivatedMachines.length} 台矿机未激活LP，请先激活后再添加燃料费`,
          position: "center",
          duration: 3000,
        });
        return;
      }

      if (isPaymentCheckLoading) return;

      if (!isBalanceSufficient) {
        console.log("余额不足，无法继续");
        Toast.show({
          content: "余额不足",
          position: "center",
          duration: 2000,
        });
        return;
      }

      setIsPaying(true);

      // 授权检查
      console.log("=== 检查IDX授权 ===");
      console.log("授权状态:", isAllowanceSufficient ? "已授权" : "未授权");

      if (!isAllowanceSufficient) {
        console.log("=== 执行IDX智能授权检查 ===");

        // 计算实际需要的金额
        const actualAmount = parseEther(
          String(Math.ceil(idxPrice * monthCount * pageData.length)),
        );
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
          chainId: chain?.id,
        })) as bigint;

        console.log("当前allowance值:", formatEther(currentAllowance), "IDX");

        // 检查当前allowance是否已经足够（超过2倍实际需要）
        if (currentAllowance >= smartAllowance) {
          console.log("当前allowance已足够，无需重新授权");
        } else {
          console.log("当前allowance不足，执行智能授权");
          console.log("授权合约地址:", IDX_CONTRACTS_ADDRESS);
          console.log("授权目标地址:", MiningMachineSystemLogicAddress);

          // 使用显式 gas 配置
          console.log("执行 IDX 授权...");
          await writeContractAsync({
            address: IDX_CONTRACTS_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [MiningMachineSystemLogicAddress, smartAllowance],
            gas: 350000n, // 授权操作
            // 移除硬编码的 gas price，让钱包自动估算
          });
          console.log("IDX智能授权交易已发送");
        }
      }

      // 构建批量加注燃料合约调用
      console.log("=== 构建批量加注燃料合约调用 ===");
      const machineIds = pageData.map((item: any) => BigInt(item.id));
      const monthCountBigInt = BigInt(monthCount);

      console.log("批量加注燃料参数:", {
        矿机ID列表: machineIds,
        购买月数: monthCountBigInt,
        合约地址: MiningMachineSystemLogicAddress,
        函数名: "batchPayFuel",
      });

      console.log("=== 执行批量加注燃料 ===");
      const res = await batchPayFuel(
        MiningMachineSystemLogicAddress as `0x${string}`,
        machineIds,
        monthCountBigInt,
      );

      console.log("批量加注燃料结果:", res);

      if (res.success) {
        console.log("批量加注燃料成功，交易哈希:", res.txHash);
        setMaskCount(0); // 批量操作完成后，待处理数量设为0
        setIsPaying(false);

        if (res.receipt) {
          // 交易已确认
          Toast.show({
            content: `成功为 ${pageData.length} 台矿机添加燃料费`,
            position: "center",
            duration: 3000,
          });

          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            navigate("/user");
          }, 1500);
        } else {
          // 交易已提交但未确认（超时或其他原因）
          const shortHash = res.txHash?.slice(0, 10);
          const explorerUrl = chain?.blockExplorers?.default?.url
            ? `${chain.blockExplorers.default.url}/tx/${res.txHash}`
            : null;

          Toast.show({
            content: (
              <div>
                <div>交易已提交 ({shortHash}...)，请稍后在矿机列表查看结果</div>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1890ff",
                      textDecoration: "underline",
                      marginTop: "8px",
                      display: "block",
                    }}
                  >
                    点击查看交易详情
                  </a>
                )}
                {!explorerUrl && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    交易哈希: {res.txHash}
                  </div>
                )}
              </div>
            ),
            position: "center",
            duration: 6000,
          });

          // 延长等待时间，让用户看完提示
          setTimeout(() => {
            navigate("/user");
          }, 6000);
        }
      } else {
        // 交易失败
        console.error("批量加注燃料失败:", res.error);
        setIsPaying(false);

        // 显示具体的错误信息
        const errorMessage =
          res.error instanceof Error
            ? res.error.message
            : String(res.error || "批量加注燃料失败");

        Toast.show({
          content: errorMessage,
          position: "center",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("=== 加注燃料流程异常 ===", error);
      Toast.show({
        content: "支付失败",
        position: "center",
        duration: 2000,
      });

      console.error(error);
      setIsPaying(false);
    }
  };

  const handleDecrease = () => {
    setMonthCount((mount) => {
      if (mount === 1) return mount;
      return mount - 1;
    });
  };

  const handleIncrease = () => {
    setMonthCount((mount) => mount + 1);
  };

  return (
    <div className="h-full overflow-scroll pb-[4rem]">
      <div className="px-[21px] text-center ">
        <div className=" bg-[#1d1c25] rounded-xl text-white py-1">
          你有
          <span className="text-[red] text-[1rem] font-bold mx-1">
            {maskCount}
          </span>
          笔批量交易待处理
        </div>
      </div>

      <div className="h-full overflow-scroll px-[21px] text-[.8125rem] relative">
        <div className="flex pt-4">
          <Button
            onClick={handlBack}
            className="!p-[0] !rounded-2xl"
            loading={isPaying}
          >
            <img src={arrowSvg} alt="" />
          </Button>
          <span className="m-auto text-[17px] font-bold text-black">
            添加燃料
          </span>
        </div>

        {/* 未激活LP警告 */}
        {!isCheckingActivation && unactivatedMachines.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg mt-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-[14px]">⚠️ 警告</p>
                <p className="text-[13px] mt-1">
                  有 {unactivatedMachines.length} 台矿机未激活LP，无法添加燃料费
                </p>
                <p className="text-[12px] mt-2 text-yellow-700">
                  请先在矿机列表中激活这些矿机的LP（质押30U等值的IDX）
                </p>
                {/* 调试信息 */}
                <details className="mt-2 text-[11px]">
                  <summary className="cursor-pointer text-yellow-900">
                    查看详细信息（调试用）
                  </summary>
                  <pre className="mt-2 p-2 bg-yellow-100 rounded overflow-auto max-h-40">
                    {JSON.stringify(
                      unactivatedMachines.map((m) => ({
                        id: m.id,
                        ...m,
                      })),
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </div>
              <Button
                size="small"
                className="!bg-yellow-600 !text-white !text-[12px] !px-2 !py-1 !h-auto"
                onClick={checkMachinesActivation}
              >
                刷新
              </Button>
            </div>
          </div>
        )}

        {/* 检查中提示 */}
        {isCheckingActivation && (
          <div className="bg-blue-50 border border-blue-400 text-blue-800 px-4 py-3 rounded-lg mt-4">
            <p className="text-[13px]">正在检查矿机激活状态...</p>
          </div>
        )}

        <div className="transfer-container mt-2">
          <div className="flex gap-2 items-center">
            钱包IDX余额
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={idxBalance}
              decimalSubLen={2}
              className="ml-auto mr-1.5 text-[1rem] font-bold"
            />
            <div>IDX</div>
          </div>

          <Divider className="!my-3" />

          <div className="flex">
            购买月数（月）
            <div className="flex ml-auto text-white gap-8">
              <div
                className="w-[22px] h-[22px] bg-[#c2c0cd] text-center rounded-[50%]"
                onClick={handleDecrease}
              >
                -
              </div>
              <div className="text-black text-[18px] font-bold">
                {monthCount}
              </div>
              <div
                className="w-[22px] h-[22px] bg-[#504379] text-center rounded-[50%]"
                onClick={handleIncrease}
              >
                +
              </div>
            </div>
          </div>
        </div>

        <div className="transfer-container mt-2">
          <div className="text-[.9375rem] font-bold mb-2 text-black">
            已选矿机
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div className="flex  py-2 text-[#777777] text-[.75rem]">
            <div className="w-[90px]">矿机类型</div>
            <div className="flex-1 flex justify-between">
              <div className="pl-[15px]">燃料费单价</div>
              <div>已选数量</div>
            </div>
          </div>

          <Divider className="!mt-[10px] !mb-[0]" />

          <div className="flex text-[.75rem] pt-2">
            <div className="w-[90px] font-bold pl-[10px] ">矿机</div>
            <div className="flex-1 mx-auto ">15U 等值IDX/月</div>
            <div className="w-[3.125rem] text-center">{pageData.length}</div>
          </div>
          <Divider className="!my-2" />

          <div className="flex text-[.75rem]">
            <div className="w-[90px] font-bold pl-[10px]">母矿机</div>
            <div className="flex-1">无需添加燃料费</div>
            <div className="w-[3.125rem] text-center">/</div>
          </div>
        </div>

        <div className="transfer-container mt-2">
          <div className="flex gap-4">
            <div className="text-lg font-bold text-gray-800 text-[.9375rem]">
              燃料费权益
            </div>
            <div className="text-[#666666] flex items-center text-[12px]">
              注：激活后才能获得权益
            </div>
          </div>

          <Divider />

          <div className="flex text-[#666] text-[12px]">
            <div className="w-[90px]">矿机类型</div>
            <div className="flex-1 text-center">权益</div>
          </div>
          <Divider />

          <div className="flex text-[12px]">
            <div className="w-[90px] font-bold pl-[10px]">矿机</div>
            <div className="flex-1">
              每台矿机每日产出4个MIX积分，每日00:00:00~01:00:00内到账
            </div>
          </div>
          <Divider />

          <div className="flex text-[12px]">
            <div className="w-[90px] font-bold pl-[10px]">母矿机</div>
            <div className="flex-1">
              母矿机每10天产出1台矿机，母矿机不能产出MIX积分；
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white h-[3.8rem] flex items-center absolute bottom-0 px-[30px] justify-between">
        <div>
          <div className="text-[.75rem]">待支付 IDX</div>
          <div className="text-[#FF6D6D] text-[1.25rem]">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={idxPrice * monthCount * pageData.length}
              decimalSubLen={2}
              className="font-bold"
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
            isPaying || isCheckingActivation || unactivatedMachines.length > 0
          }
        >
          {isCheckingActivation
            ? "检查中..."
            : unactivatedMachines.length > 0
              ? "无法支付"
              : "支付"}
        </Button>
      </div>
    </div>
  );
};

export default AddFuel;
