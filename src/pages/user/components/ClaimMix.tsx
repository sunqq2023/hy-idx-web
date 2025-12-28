import { arrowSvg, claimMixBgSvg, miningSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { MiningMachineProductionLogicABI } from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { MachineInfo } from "@/constants/types";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { Button, Divider, Modal, Toast, ProgressBar } from "antd-mobile";
import { memo, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import dayjs from "dayjs";
import { formatEther } from "viem";

const formatTime = (timestamp: number) => {
  return dayjs.unix(timestamp).format("MM月 DD日 HH:mm:ss");
};

const ClaimMix = () => {
  const location = useLocation();
  const chainConfig = useChainConfig();
  const { machineList, mixPointsToBeClaimed } = location.state;
  const { executeSequentialCalls } = useSequentialContractWrite();
  const [isClaimingMIX, setIsClaimingMIX] = useState(false);
  const navigate = useNavigate();
  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [claimProgress, setClaimProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
  });

  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;

  const producedMixList = machineList.filter(
    (item: MachineInfo) => item.unclaimedMix! > 0,
  );

  const handleCloseModal = () => {
    Modal.clear();
    // 返回时传递刷新信号
    navigate("/user", {
      state: { needRefresh: true },
      replace: true,
    });
  };

  const handleClaimMix = async () => {
    let progressToast: ReturnType<typeof Toast.show> | null = null;

    try {
      setIsClaimingMIX(true);

      if (producedMixList.length === 0) {
        setIsClaimingMIX(false);
        return;
      }

      // 提取需要领取的矿机ID数组
      const machineIds = producedMixList.map((item: MachineInfo) => item.id);
      const totalMachines = machineIds.length;

      console.log(`准备分批领取 ${totalMachines} 个矿机的 MIX`);

      // 分批配置：每批最多60台
      const BATCH_SIZE = 60;
      const batches: number[][] = [];
      for (let i = 0; i < machineIds.length; i += BATCH_SIZE) {
        batches.push(machineIds.slice(i, i + BATCH_SIZE));
      }

      console.log(`总共 ${totalMachines} 台矿机，分为 ${batches.length} 批，每批最多 ${BATCH_SIZE} 台`);

      // 初始化进度
      setClaimProgress({
        current: 0,
        total: batches.length,
        percent: 0,
      });

      // 显示进度提示
      progressToast = Toast.show({
        content: `正在领取 ${totalMachines} 个矿机的 MIX (0/${batches.length})`,
        position: "center",
        duration: 0, // 持久显示
        icon: "loading",
      });

      // Gas Limit 计算（每批60台）
      // 分析：claimMixByMachineIds 对每个矿机执行以下操作：
      // 1. getMachine + getMachineLifecycle（SLOAD，在循环中读取）- 约 4k gas
      // 2. addMixBalance（SSTORE映射累加）- 约 5k gas（累加操作，非首次写入）
      // 3. setMachineLifecycle（结构体多字段SSTORE，11个字段，多个字段改变）- 约 50k-100k gas
      // 4. claimMixHistory.push（动态数组push）- 约 20k gas（存储length和元素）
      // 5. history.recordEarning（外部CALL）- 约 30k-50k gas（包括CALL开销21k和内部操作）
      // 6. emit MixClaimed（LOG事件）- 约 1k gas
      // 7. 可能的外部调用 nodeSystem.recordMachineDestroyed - 约 30k gas（如果矿机销毁）
      // 总计每个矿机约 140k-210k gas，考虑到实际存储操作的复杂性和安全余量，取 400k 更安全
      const baseGas = 300000n; // 函数基础开销
      const perMachineGas = 400000n; // 每台矿机的gas（包含安全余量）
      // 每批60台的 gas limit = 300k + 60 * 400k = 24.3M gas（安全，低于25M上限）
      const MAX_GAS_LIMIT = 25000000n; // 25M gas limit，留出安全余量

      const errors: string[] = [];

      // 逐批领取
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchGasLimit = baseGas + BigInt(batch.length) * perMachineGas;

        // 检查是否超过最大gas limit（理论上不应该，因为每批最多60台）
        if (batchGasLimit > MAX_GAS_LIMIT) {
          const errorMsg = `第 ${batchIndex + 1} 批矿机数量过多（${batch.length}台），计算出的 Gas Limit (${batchGasLimit.toString()}) 超过安全上限 (${MAX_GAS_LIMIT.toString()})`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue; // 跳过这一批
        }

        console.log(
          `第 ${batchIndex + 1}/${batches.length} 批：${batch.length} 台矿机，Gas Limit: ${batchGasLimit.toString()}`,
        );

        // 更新进度（在执行前更新，显示当前正在执行的批次）
        const currentPercent = Math.round(
          ((batchIndex + 1) / batches.length) * 100,
        );
        setClaimProgress({
          current: batchIndex + 1,
          total: batches.length,
          percent: currentPercent,
        });

        // 更新 Toast 内容
        if (progressToast) {
          progressToast.close();
        }
        progressToast = Toast.show({
          content: `正在领取第 ${batchIndex + 1}/${batches.length} 批 (${batch.length} 台矿机)`,
          position: "center",
          duration: 0,
          icon: "loading",
        });

        try {
          const contractCall = {
            address: MiningMachineProductionLogicAddress as `0x${string}`,
            abi: MiningMachineProductionLogicABI,
            functionName: "claimMixByMachineIds",
            args: [batch],
            gas: batchGasLimit,
          };

          const [result] = await executeSequentialCalls([contractCall]);

          if (!result?.success) {
            const errorStr = String(result?.error || "未知错误");
            const errorStrLower = errorStr.toLowerCase();
            console.error(`第 ${batchIndex + 1} 批领取失败:`, result);

            // 如果是用户取消或余额不足，直接停止
            if (
              errorStrLower.includes("user rejected") ||
              errorStrLower.includes("user denied") ||
              errorStrLower.includes("insufficient funds")
            ) {
              throw new Error(errorStr);
            }

            // 网络错误
            if (
              errorStrLower.includes("failed to fetch") ||
              errorStrLower.includes("network request failed") ||
              errorStrLower.includes("rpc request failed") ||
              errorStrLower.includes("fetch failed")
            ) {
              errors.push(`第 ${batchIndex + 1} 批失败: 网络连接失败，请检查网络连接后重试`);
              // 网络错误时稍作延迟再继续
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }

            // 其他错误继续下一批
            errors.push(`第 ${batchIndex + 1} 批失败: ${errorStr}`);
            continue;
          }

          console.log(`✅ 第 ${batchIndex + 1} 批领取成功`);
        } catch (error: unknown) {
          const errorStr = String(
            (error instanceof Error ? error.message : error) || "",
          ).toLowerCase();

          // 用户取消或余额不足，直接停止
          if (
            errorStr.includes("user rejected") ||
            errorStr.includes("user denied") ||
            errorStr.includes("insufficient funds")
          ) {
            throw error;
          }

          // 网络错误（Failed to fetch, RPC 调用失败等）
          if (
            errorStr.includes("failed to fetch") ||
            errorStr.includes("network request failed") ||
            errorStr.includes("rpc request failed") ||
            errorStr.includes("fetch failed")
          ) {
            errors.push(`第 ${batchIndex + 1} 批失败: 网络连接失败，请检查网络连接后重试`);
            console.error(`第 ${batchIndex + 1} 批领取失败（网络错误）:`, error);
            // 网络错误时稍作延迟再继续，给网络恢复时间
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          // 其他错误记录但继续
          errors.push(`第 ${batchIndex + 1} 批失败: ${errorStr}`);
          console.error(`第 ${batchIndex + 1} 批领取失败:`, error);
        }

        // 批次之间稍作延迟，避免 RPC 压力过大
        if (batchIndex < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // 关闭进度提示
      if (progressToast) {
        progressToast.close();
      }

      // 重置进度
      setClaimProgress({
        current: 0,
        total: 0,
        percent: 0,
      });

      setIsClaimingMIX(false);

      // 如果有错误，显示警告
      if (errors.length > 0) {
        console.warn("部分批次领取失败:", errors);
        Toast.show({
          content: `部分领取失败，已成功领取 ${batches.length - errors.length}/${batches.length} 批`,
          position: "center",
          duration: 4000,
        });
      }

      // 显示成功提示
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
                {errors.length === 0 ? (
                  <>
                    你已成功提取所有MIX收益：
                    <AdaptiveNumber
                      type={NumberType.BALANCE}
                      value={mixPointsToBeClaimed}
                      decimalSubLen={2}
                      className="font-bold text-[15px]"
                    />
                    ，已存入你的钱包中。
                  </>
                ) : (
                  <>
                    部分领取完成：
                    <AdaptiveNumber
                      type={NumberType.BALANCE}
                      value={mixPointsToBeClaimed}
                      decimalSubLen={2}
                      className="font-bold text-[15px]"
                    />
                    <div className="mt-2 text-[12px] text-yellow-400">
                      注意：有 {errors.length} 批领取失败，已成功领取 {batches.length - errors.length}/{batches.length} 批，请稍后重试失败批次
                    </div>
                  </>
                )}
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
      console.error("领取MIX失败:", error);

      // 关闭进度提示（如果存在）
      if (progressToast) {
        progressToast.close();
      }

      // 重置进度
      setClaimProgress({
        current: 0,
        total: 0,
        percent: 0,
      });

      setIsClaimingMIX(false);

      // 显示错误提示
      let errorMsg = "领取失败: 未知错误";
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // 检测网络错误
        if (
          errorMessage.includes("failed to fetch") ||
          errorMessage.includes("network request failed") ||
          errorMessage.includes("rpc request failed") ||
          errorMessage.includes("fetch failed")
        ) {
          errorMsg = "领取失败: 网络连接失败，请检查网络连接或稍后重试";
        }
        // 检测执行回退（矿机未激活或没有 MIX）
        else if (
          errorMessage.includes("矿机未激活") ||
          errorMessage.includes("没有可领取")
        ) {
          errorMsg = error.message;
        }
        // 检测 BNB 余额不足
        else if (
          errorMessage.includes("exceeds the balance of the account") ||
          errorMessage.includes("insufficient funds for gas")
        ) {
          errorMsg = "领取失败: BNB 余额不足，请充值 BNB 用于支付 Gas 费";
        }
        // 用户拒绝签名
        else if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied")
        ) {
          errorMsg = "领取失败: 用户取消了交易";
        }
        // Gas 不足
        else if (errorMessage.includes("out of gas")) {
          errorMsg = "领取失败: Gas 不足";
        }
        // 其他错误
        else {
          errorMsg = `领取失败: ${error.message}`;
        }
      }

      Toast.show({
        content: errorMsg,
        position: "center",
        duration: 4000,
      });
    }
  };

  const handlBack = () => {
    // 返回时传递刷新信号（以防用户在领取后点击返回）
    navigate("/user", {
      state: { needRefresh: true },
      replace: true,
    });
  };

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = 270;
      const newHeight = windowHeight - topSectionHeight;
      setListHeight(newHeight);
    };

    // 初始化计算
    calculateHeight();

    // 监听窗口变化（如旋转屏幕、键盘弹出等）
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  return (
    <div className="px-[21px]">
      <div className="flex pt-4 mb-4">
        <Button
          onClick={handlBack}
          className="!p-[0] !rounded-2xl"
          loading={isClaimingMIX}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">收益</span>
      </div>

      <div className="bg-black rounded-2xl ">
        <div
          style={{
            backgroundImage: `url(${claimMixBgSvg})`,
            width: "100%",
            height: "170px",
            backgroundSize: "cover",
            padding: "0 20px",
            gap: "5px",
            borderRadius: "1rem",
          }}
        >
          <div className="flex   text-white items-center pt-[18%]">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={mixPointsToBeClaimed}
              decimalSubLen={2}
              className="ml-2 mr-1.5  font-bold text-[26px]"
            />
            <div className="text-[11px] pt-[8px] ">MIX</div>
          </div>
          <Button
            disabled={isClaimingMIX}
            onClick={handleClaimMix}
            className="w-full !bg-[#7334FE] !rounded-2xl !py-2 !my-3  !items-center  !p-0 !text-white !border-none !text-[15px]"
          >
            {isClaimingMIX
              ? `领取中 (${claimProgress.current}/${claimProgress.total})`
              : "提取到钱包"}
          </Button>
          {isClaimingMIX && claimProgress.total > 0 && (
            <div className="px-4 pb-2">
              <ProgressBar
                percent={claimProgress.percent}
                className="w-full"
                style={{
                  "--fill-color": "#7334FE",
                }}
              />
              <div className="text-white text-[12px] text-center mt-1">
                {claimProgress.current}/{claimProgress.total} 批
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={listContainerRef}
        style={{ height: `${listHeight}px` }}
        className="no-scrollbar bg-white rounded-2xl p-[15px] mt-4"
      >
        <List
          height={listHeight}
          width="100%"
          itemCount={producedMixList.length}
          itemSize={70}
          itemData={producedMixList}
        >
          {Row}
        </List>
      </div>
    </div>
  );
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
    const item: MachineInfo = data[index];
    return (
      <div
        style={{
          ...style,
          height: "70px",
        }}
      >
        <div className="flex text-[12px] items-center gap-2">
          <img src={miningSvg} alt="" width={37} height={37} />

          <div className="w-full">
            <div className="flex justify-between">
              矿机产出
              <div className="flex items-center">
                <div className="text-[16px]">+</div>
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={+formatEther(BigInt(item.unclaimedMix!))}
                  decimalSubLen={4}
                  className="ml-2 mr-1.5  font-bold "
                />
              </div>
            </div>

            <div className="flex justify-between">
              <div className="text-[#7E7878]">
                {formatTime(item.createTime)}
              </div>
              <div>MIX积分</div>
            </div>
          </div>
        </div>

        <Divider
          style={{
            width: "87%",
            marginLeft: "auto",
            marginBottom: "0",
          }}
        />
        <div className="w-full flex justify-end"></div>
      </div>
    );
  },
);

export default ClaimMix;
