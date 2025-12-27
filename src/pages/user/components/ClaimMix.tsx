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
    navigate("/user");
  };

  const handleClaimMix = async () => {
    try {
      setIsClaimingMIX(true);

      if (producedMixList.length === 0) {
        setIsClaimingMIX(false);
        return;
      }

      // 提取需要领取的矿机ID数组
      const machineIds = producedMixList.map((item: MachineInfo) => item.id);

      // 分批设置：每批最多 10 个矿机
      const MAX_BATCH_SIZE = 10;
      const batches: bigint[][] = [];

      for (let i = 0; i < machineIds.length; i += MAX_BATCH_SIZE) {
        batches.push(machineIds.slice(i, i + MAX_BATCH_SIZE));
      }

      console.log(
        `需要分 ${batches.length} 批领取，共 ${machineIds.length} 个矿机`,
      );

      // 如果需要分批，先让用户确认
      if (batches.length > 1) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Modal.show({
            bodyStyle: {
              background: "#ffffff",
              borderRadius: "20px",
              padding: "20px",
            },
            closeOnMaskClick: false,
            content: (
              <div className="text-center">
                <div className="text-[18px] font-bold mb-4 text-[#333]">
                  分批领取提示
                </div>
                <div className="text-[14px] text-[#666] mb-3 text-left">
                  <p className="mb-2">
                    您有{" "}
                    <span className="font-bold text-[#7334FE]">
                      {machineIds.length}
                    </span>{" "}
                    个矿机待领取
                  </p>
                  <p className="mb-2">
                    将分{" "}
                    <span className="font-bold text-[#7334FE]">
                      {batches.length}
                    </span>{" "}
                    批领取
                  </p>
                  <p className="mb-2 text-[#ff6b6b]">
                    ⚠️ 需要在钱包中签名{" "}
                    <span className="font-bold">{batches.length}</span> 次
                  </p>
                  <p className="text-[12px] text-[#999]">
                    预计耗时: 约 {batches.length * 15} 秒
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 bg-[#f0f0f0] text-[#666] rounded-3xl py-2 text-[14px]"
                    onClick={() => {
                      Modal.clear();
                      resolve(false);
                    }}
                  >
                    取消
                  </button>
                  <button
                    className="flex-1 bg-[#7334FE] text-white rounded-3xl py-2 text-[14px]"
                    onClick={() => {
                      Modal.clear();
                      resolve(true);
                    }}
                  >
                    确认领取
                  </button>
                </div>
              </div>
            ),
          });
        });

        if (!confirmed) {
          setIsClaimingMIX(false);
          return;
        }

        Toast.show({
          content: `开始分批领取，请耐心等待并及时签名`,
          position: "center",
          duration: 3000,
        });
      }

      let totalClaimed = 0;

      // 依次处理每批
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        if (batches.length > 1) {
          Toast.show({
            content: `正在领取第 ${i + 1}/${batches.length} 批，请在钱包中确认签名`,
            position: "center",
            duration: 3000,
          });
        }

        // 动态计算 Gas Limit（批量领取 MIX）
        const baseGas = 150000n;
        const perMachineGas = 50000n;
        const gasLimit = baseGas + BigInt(batch.length) * perMachineGas;

        console.log(
          `第 ${i + 1} 批计算的 Gas Limit: ${gasLimit} (${batch.length} 个矿机)`,
        );

        const contractCall = {
          address: MiningMachineProductionLogicAddress as `0x${string}`,
          abi: MiningMachineProductionLogicABI,
          functionName: "claimMixByMachineIds",
          args: [batch],
          gas: gasLimit, // 动态计算 gas limit
        };

        const [result] = await executeSequentialCalls([contractCall]);

        if (!result?.success) {
          throw new Error(`第 ${i + 1} 批领取失败`);
        }

        // 累计领取数量
        try {
          if (result && "data" in result && result.data != null) {
            const data = BigInt(result.data.toString());
            totalClaimed += Number(formatEther(data));
          }
        } catch (e) {
          console.warn("解析第", i + 1, "批返回值失败:", e);
        }
      }

      // 使用累计的总数或备选值
      const finalClaimed =
        totalClaimed > 0 ? totalClaimed : mixPointsToBeClaimed;

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
                  value={finalClaimed}
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
      setIsClaimingMIX(false);

      // 显示错误提示
      Toast.show({
        content: `领取失败: ${error instanceof Error ? error.message : "未知错误"}`,
        position: "center",
        duration: 3000,
      });
    }
  };

  const handlBack = () => {
    navigate("/user");
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
