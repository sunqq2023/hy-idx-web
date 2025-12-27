import { arrowSvg, claimMixBgSvg, miningSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { MiningMachineProductionLogicABI } from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { MachineInfo } from "@/constants/types";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { Button, Divider, Modal, Toast } from "antd-mobile";
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

      console.log(`准备一次性领取 ${machineIds.length} 个矿机的 MIX`);

      // 显示进度提示
      progressToast = Toast.show({
        content: `正在领取 ${machineIds.length} 个矿机的 MIX，请在钱包中确认签名`,
        position: "center",
        duration: 0, // 持久显示
        icon: "loading",
      });

      // 动态计算 Gas Limit
      // 基于实测：10 台矿机约需 1,400,000 Gas
      const baseGas = 500000n;
      const perMachineGas = 150000n;
      const gasLimit = baseGas + BigInt(machineIds.length) * perMachineGas;

      console.log(
        `计算的 Gas Limit: ${gasLimit} (${machineIds.length} 个矿机)`,
      );

      const contractCall = {
        address: MiningMachineProductionLogicAddress as `0x${string}`,
        abi: MiningMachineProductionLogicABI,
        functionName: "claimMixByMachineIds",
        args: [machineIds],
        gas: gasLimit, // 使用动态计算的 gas limit
      };

      const [result] = await executeSequentialCalls([contractCall]);

      // 关闭进度提示
      if (progressToast) {
        progressToast.close();
      }

      if (!result?.success) {
        console.error(`领取失败，详细信息:`, result);

        // 提供更详细的错误信息
        let errorMsg = "领取失败";
        if (result && "error" in result) {
          const errorStr = String(result.error).toLowerCase();

          // 检测超时错误
          if (errorStr.includes("超时")) {
            errorMsg += ": 交易确认超时，请刷新页面查看交易是否成功";
          }
          // 检测执行回退（通常是矿机未激活或没有 MIX）
          else if (errorStr.includes("execution reverted")) {
            errorMsg +=
              ": 矿机未激活或没有可领取的 MIX，请确认矿机已激活并加燃料";
          }
          // 检测 BNB 余额不足
          else if (
            errorStr.includes("exceeds the balance") ||
            errorStr.includes("insufficient funds for gas")
          ) {
            errorMsg += ": BNB 余额不足，请充值 BNB";
          }
          // 用户拒绝签名
          else if (
            errorStr.includes("user rejected") ||
            errorStr.includes("user denied")
          ) {
            errorMsg += ": 用户取消了交易";
          }
          // 没有可领取的 MIX
          else if (errorStr.includes("no mix to claim")) {
            errorMsg += ": 没有可领取的 MIX";
          }
          // 其他错误
          else {
            errorMsg += `: ${result.error}`;
          }
        }

        throw new Error(errorMsg);
      }

      // 获取领取的数量
      let totalClaimed = mixPointsToBeClaimed;
      try {
        if (result && "data" in result && result.data != null) {
          const data = BigInt(result.data.toString());
          totalClaimed = Number(formatEther(data));
        }
      } catch (e) {
        console.warn("解析返回值失败:", e);
      }

      // 关闭进度提示
      if (progressToast) {
        progressToast.close();
      }

      setIsClaimingMIX(false);

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
                你已成功提取所有MIX收益：
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={totalClaimed}
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
    } catch (error) {
      console.error("领取MIX失败:", error);

      // 关闭进度提示（如果存在）
      if (progressToast) {
        progressToast.close();
      }

      setIsClaimingMIX(false);

      // 显示错误提示
      let errorMsg = "领取失败: 未知错误";
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // 检测执行回退（矿机未激活或没有 MIX）
        if (
          errorMessage.includes("矿机未激活") ||
          errorMessage.includes("没有可领取")
        ) {
          errorMsg = error.message; // 使用已经格式化的错误消息
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
            提取到钱包
          </Button>
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
