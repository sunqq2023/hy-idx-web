import { arrowSvg, blackExchangeSvg, whiteExchangeSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import {
  MiningMachineProductionLogicABI,
  MiningMachineSystemLogicABI,
  MiningMachineSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useChainId, useAccount } from "wagmi";
import { MachineInfo } from "@/constants/types";
import { useSequentialContractWrite } from "@/hooks/useSequentialContractWrite";
import { Button, Divider, Modal, ProgressBar, Toast } from "antd-mobile";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import { formatEther, parseEther, parseGwei, TransactionReceipt } from "viem";
import config from "@/proviers/config";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  multicall,
} from "@wagmi/core";
import { formatTime } from "@/utils/helper";
import EmptyComp from "@/components/EmptyComp";

interface IReleaseInfo {
  //  锁仓 IDX 总数量。
  totalAmount: number;
  //  锁仓开始时间。
  startTime: number;
  //  已释放数量。
  releasedAmount: number;
  //  当前可领取数量。
  releasableAmount: number;
  //  剩余未释放数量。
  remainingAmount: number;
  //  剩余锁仓时间（秒，锁仓期内有效）。
  remainingLockTime: number;
  //  剩余释放时间（秒，释放期内有效）。
  remainingReleaseTime: number;
  id: number;
}

const ExchangeIdx = () => {
  const { address } = useAccount();
  const chainConfig = useChainConfig();
  const chainId = useChainId();

  // 使用动态地址（添加类型断言）
  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineSystemLogicAddress =
    chainConfig.LOGIC_ADDRESS as `0x${string}`;
  const MiningMachineProductionLogicAddress =
    chainConfig.PRODUCTION_LOGIC_ADDRESS as `0x${string}`;

  const [mixBalance, setMixBalance] = useState("");
  const [machineList, setMachineList] = useState<IReleaseInfo[]>([]);
  const [usdtToIdxRate, setUsdtToIdxRate] = useState("");

  const [idxToBeClaimed, setIdxToBeClaimed] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [releasedAmount, setReleasedAmount] = useState(0);

  const { executeSequentialCalls } = useSequentialContractWrite();
  const [isExchangingIDX, setIsExchangingIDX] = useState(false);
  const navigate = useNavigate();
  const [listHeight, setListHeight] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [isClaimingIDX, setIsClaimingIDX] = useState(false);
  const [claimProgress, setClaimProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
  });

  const handleQuery = useCallback(async () => {
    try {
      const bigNumIds = await readContract(config, {
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "getUserReleaseIds",
        args: [address],
      });

      const contracts = (bigNumIds as bigint[]).map((id) => ({
        address: MiningMachineProductionLogicAddress,
        abi: MiningMachineProductionLogicABI,
        functionName: "getReleaseInfo",
        args: [address, id],
      }));

      const result = await multicall(config, {
        contracts,
      });

      const data = result.map((item, i) => {
        return {
          //  锁仓 IDX 总数量。
          totalAmount: +formatEther(item.result[0]),
          //  锁仓开始时间。
          startTime: Number(item.result[1]),
          //  已释放数量。
          releasedAmount: +formatEther(item.result[2]),
          //  当前可领取数量。
          releasableAmount: +formatEther(item.result[3]),
          //  剩余未释放数量。
          remainingAmount: +formatEther(item.result[4]),
          //  剩余锁仓时间（秒，锁仓期内有效）。
          remainingLockTime: Number(item.result[5]),
          //  剩余释放时间（秒，释放期内有效）。
          remainingReleaseTime: Number(item.result[6]),
          id: Number(bigNumIds[i]),
        };
      });

      setMachineList(data);

      setReleasedAmount(data.reduce((acc, cur) => acc + cur.releasedAmount, 0));
      setRemainingAmount(
        data.reduce((acc, cur) => acc + cur.remainingAmount, 0),
      );
      setIdxToBeClaimed(
        data.reduce((acc, cur) => acc + cur.releasableAmount, 0),
      );
      console.log("release Info", data);
    } catch (error) {
      console.error(error);
    }
  }, [address]);

  useEffect(() => {
    handleQuery();
  }, [handleQuery]);

  const queryMIXBalance = useCallback(async () => {
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "mixBalances",
        args: [address],
      });
      setMixBalance(res ? formatEther(res) : "0");
    } catch (error) {
      console.error(error);
    }
  }, [address]);

  useEffect(() => {
    queryMIXBalance();
  }, [queryMIXBalance]);

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

  const handleExchangeMixToIDX = async () => {
    if (+mixBalance < 100) {
      Toast.show({
        content: "MIX余额不足（至少需要100 MIX）",
        position: "center",
      });
      return;
    }

    try {
      setIsExchangingIDX(true);

      const exchangeMixCount = Math.floor(+mixBalance / 100);

      if (exchangeMixCount === 0) {
        Toast.show({
          content: "兑换数量为0，请检查MIX余额",
          position: "center",
        });
        setIsExchangingIDX(false);
        return;
      }

      console.log("兑换参数:", {
        mixBalance,
        exchangeMixCount,
        address: MiningMachineProductionLogicAddress,
      });

      // 先尝试估算Gas，如果失败会显示具体错误
      try {
        const hash = await writeContract(config, {
          address: MiningMachineProductionLogicAddress as `0x${string}`,
          abi: MiningMachineProductionLogicABI,
          functionName: "convertMIXtoIDX",
          args: [exchangeMixCount],
          gas: 600000n, // 兑换操作：涉及 MIX 扣除、IDX 转账、锁仓记录创建（500000n → 600000n）⚠️ 已提高
        });

        await waitForTransactionReceipt(config, {
          hash,
          chainId,
        });
        Toast.show({
          content: "兑换成功",
          position: "center",
        });
        queryMIXBalance();
        handleQuery();
      } catch (contractError: unknown) {
        console.error("合约调用错误:", contractError);

        // 解析错误信息
        let errorMessage = "兑换失败";
        if (contractError instanceof Error) {
          const errorMsg = contractError.message || String(contractError);

          // 检查常见的合约错误
          if (
            errorMsg.includes("Insufficient MIX") ||
            errorMsg.includes("余额不足")
          ) {
            errorMessage = "MIX余额不足";
          } else if (
            errorMsg.includes("No IDX to release") ||
            errorMsg.includes("IDX数量为0")
          ) {
            errorMessage = "无法兑换：IDX数量为0，可能是交易对余额不足";
          } else if (
            errorMsg.includes("IDX transfer failed") ||
            errorMsg.includes("转账失败")
          ) {
            errorMessage = "兑换失败：合约IDX余额不足，请联系管理员";
          } else if (errorMsg.includes("gas") || errorMsg.includes("Gas")) {
            errorMessage = "Gas估算失败，可能是合约状态不允许兑换";
          } else if (errorMsg.includes("execution reverted")) {
            // 提取revert原因
            const revertMatch = errorMsg.match(/execution reverted: (.+)/);
            if (revertMatch) {
              errorMessage = `兑换失败: ${revertMatch[1]}`;
            } else {
              errorMessage = "兑换失败：合约执行被回退，请检查余额和权限";
            }
          } else {
            errorMessage = `兑换失败: ${errorMsg}`;
          }
        }

        Toast.show({
          content: errorMessage,
          position: "center",
          duration: 5000,
        });
        throw contractError; // 重新抛出以便外部catch处理
      }
    } catch (error) {
      console.error("兑换过程错误:", error);
      // 外层catch处理非合约错误（如网络错误等）
      if (
        !(
          error instanceof Error && error.message.includes("execution reverted")
        )
      ) {
        Toast.show({
          content: "兑换失败，请稍后重试",
          position: "center",
          duration: 3000,
        });
      }
    } finally {
      setIsExchangingIDX(false);
    }
  };

  const handleCloseModal = () => {
    Modal.clear();
  };

  const handleClaimIDX = async () => {
    let progressToast: ReturnType<typeof Toast.show> | null = null;

    try {
      const notClaimList = machineList.filter(
        (item) => item.releasableAmount > 0,
      );

      if (notClaimList.length === 0) {
        Toast.show({
          content: "没有可领取的 IDX",
          position: "center",
          duration: 2000,
        });
        return;
      }

      setIsClaimingIDX(true);

      const totalReleases = notClaimList.length;
      console.log(`准备领取 ${totalReleases} 个 releaseId 的 IDX`);

      // 初始化进度
      setClaimProgress({
        current: 0,
        total: totalReleases,
        percent: 0,
      });

      // 显示进度提示
      progressToast = Toast.show({
        content: `正在领取 ${totalReleases} 个 IDX (0/${totalReleases})`,
        position: "center",
        duration: 0, // 持久显示
        icon: "loading",
      });

      // 动态计算 Gas Limit
      // 分析：claimReleasedIdx 对每个releaseId执行以下操作：
      // 1. 读取存储：userReleaseInfos[msg.sender][releaseId] - SLOAD，约2k gas
      // 2. 时间计算：计算时间差和释放比例 - 纯计算，约5k-10k gas
      // 3. 更新存储：info.releasedAmount = totalReleasable - SSTORE，约5k-20k gas（取决于是否首次写入）
      // 4. IDX转账：IERC20(store.idxToken()).transfer(msg.sender, newlyReleased)
      //    - ERC20转账基础开销：21k gas
      //    - IDX是代理合约，可能涉及代理调用，约30k-80k gas
      //    - 存储操作（余额更新等）：约20k-40k gas
      //    总计约70k-140k gas
      // 5. 事件：emit IdxReleased - 约1k gas
      //
      // 每个交易的总计：函数调用(21k) + 参数处理(5k) + 执行(80k-140k) = 约110k-170k gas
      // 考虑到IDX代理合约的复杂性和安全余量，取 350k gas 是合理的
      const perReleaseGas = 350000n; // 每个releaseId的gas（包含IDX转账和存储更新）

      const multiContractsCalls = notClaimList.map((item, index) => ({
        address: MiningMachineProductionLogicAddress as `0x${string}`,
        abi: MiningMachineProductionLogicABI,
        functionName: "claimReleasedIdx",
        args: [item.id],
        gas: perReleaseGas, // 每个releaseId的gas limit
        onConfirmed: (receipt: TransactionReceipt, callIndex: number) => {
          // 更新进度
          const currentPercent = Math.round(
            ((callIndex + 1) / totalReleases) * 100,
          );
          setClaimProgress({
            current: callIndex + 1,
            total: totalReleases,
            percent: currentPercent,
          });

          // 更新 Toast 内容
          if (progressToast) {
            progressToast.close();
          }
          progressToast = Toast.show({
            content: `正在领取第 ${callIndex + 1}/${totalReleases} 个 IDX`,
            position: "center",
            duration: 0,
            icon: "loading",
          });

          console.log(`✅ 第 ${callIndex + 1}/${totalReleases} 个 IDX 领取成功`);
        },
      }));

      const res = await executeSequentialCalls(multiContractsCalls);

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

      setIsClaimingIDX(false);
      const extractedIdxAmount = res.reduce((acc, cur, index) => {
        if (cur.success) {
          acc += notClaimList[index].releasableAmount;
        }
        return acc;
      }, 0);
      const isAtLeastOneSuccess = res.find((item) => item.success);

      if (isAtLeastOneSuccess) {
        handleQuery();
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
                  你已成功提取
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={extractedIdxAmount}
                    decimalSubLen={2}
                    className="font-bold text-[15px]"
                  />
                  IDX，已存入你的钱包中。
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
      }
    } catch (error) {
      console.error("领取IDX失败:", error);

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

      setIsClaimingIDX(false);

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
        // 用户拒绝签名
        else if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("user denied")
        ) {
          errorMsg = "领取失败: 用户取消了交易";
        }
        // BNB 余额不足
        else if (
          errorMessage.includes("exceeds the balance of the account") ||
          errorMessage.includes("insufficient funds for gas")
        ) {
          errorMsg = "领取失败: BNB 余额不足，请充值 BNB 用于支付 Gas 费";
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
    navigate("/user");
  };

  // 动态计算高度
  useEffect(() => {
    if (!listContainerRef.current) return;

    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const topSectionHeight = 435;
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
          loading={isExchangingIDX}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">兑换IDX</span>
      </div>

      <div
        style={{
          background: "#000",
          width: "100%",
          padding: "12px 20px",
          gap: "5px",
          borderRadius: "24px",
          color: "#fff",
        }}
      >
        <div className="text-[12px]">待兑换MIX</div>

        <div className="pl-1 flex items-center justify-between">
          <div className="">
            <div className="flex   text-white items-center mt-4">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={mixBalance}
                decimalSubLen={2}
                className="ml-2 mr-1.5  font-bold text-[22px]"
              />
              <div className="text-[11px] pt-[8px] ">MIX</div>
            </div>

            <div className="pl-2 text-[#939393] flex gap-1 items-center">
              ≈
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={(+mixBalance / 2) * +usdtToIdxRate}
                decimalSubLen={2}
                className="text-[16px] "
              />
              IDX
            </div>
          </div>

          <Button
            disabled={isExchangingIDX}
            onClick={handleExchangeMixToIDX}
            className=" !bg-[#7334FE] !rounded-2xl  !mb-2 !flex !items-center  !text-[13px] !text-white !border-none"
          >
            <div className="flex gap-2">
              兑换
              <img src={whiteExchangeSvg} alt="" width={10} />
            </div>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-[15px] mt-2">
        <div className="">
          <div className="flex flex-col items-center">
            <div className="text-[.6875rem]">可提取IDX：</div>
            <div className="pl-2 my-2">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={idxToBeClaimed}
                decimalSubLen={2}
                className="text-[1.5rem] font-bold mr-0.5"
              />
            </div>
          </div>

          <Button
            disabled={idxToBeClaimed === 0 || isExchangingIDX}
            loading={isClaimingIDX}
            onClick={handleClaimIDX}
            className="w-full !py-2 !bg-[#7334FE] !rounded-2xl !text-[14px]  !mb-2 !flex !items-center !justify-center  !text-white !border-none"
          >
            {isClaimingIDX
              ? `领取中 (${claimProgress.current}/${claimProgress.total})`
              : "提取到钱包"}
          </Button>
          {isClaimingIDX && claimProgress.total > 0 && (
            <div className="px-2 pb-2">
              <ProgressBar
                percent={claimProgress.percent}
                className="w-full"
                style={{
                  "--fill-color": "#7334FE",
                }}
              />
              <div className="text-[12px] text-center mt-1 text-gray-600">
                {claimProgress.current}/{claimProgress.total} 个
              </div>
            </div>
          )}

          <div className="flex mt-4">
            <div className="flex-1 flex flex-col items-end">
              <div>剩余未释放数量</div>
              <div className="pl-2">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={remainingAmount}
                  decimalSubLen={2}
                  className="text-[1rem] font-bold mr-1.5"
                />
                IDX
              </div>
            </div>

            <Divider
              direction="vertical"
              style={{
                color: "#1677ff",
                borderColor: "#bdbdbd",
                height: "40px",
              }}
            />
            <div className="flex-1 flex-col items-start">
              <div>已释放数量</div>
              <div className="pl-2">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={releasedAmount}
                  decimalSubLen={2}
                  className="text-[1rem] font-bold mr-1.5"
                />
                IDX
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <div
          ref={listContainerRef}
          style={{ height: `${listHeight}px` }}
          className="no-scrollbar"
        >
          {machineList.length > 0 ? (
            <List
              height={listHeight}
              width="100%"
              itemCount={machineList.length}
              itemSize={70}
              itemData={machineList}
            >
              {Row}
            </List>
          ) : (
            <EmptyComp />
          )}
        </div>
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
    data: IReleaseInfo[];
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
        <div className="flex text-[12px] items-center gap-2">
          <img src={blackExchangeSvg} alt="" width={37} height={37} />

          <div className="w-full">
            <div className="flex justify-between">
              <div className="font-bold">兑换IDX</div>
              <div className="flex items-center">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={item.totalAmount}
                  decimalSubLen={4}
                  className="ml-2 mr-1.5  font-bold "
                />
              </div>
            </div>

            <div className="flex justify-between mt-0.5">
              <div className="text-[#7E7878] text-[.625rem]">
                {formatTime(item.startTime)}
              </div>
              <div className="flex">
                已释放：
                <div>
                  <AdaptiveNumber
                    type={NumberType.BALANCE}
                    value={item.releasedAmount}
                    decimalSubLen={4}
                    className="ml-2 font-bold "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider />
      </div>
    );
  },
);

export default ExchangeIdx;
