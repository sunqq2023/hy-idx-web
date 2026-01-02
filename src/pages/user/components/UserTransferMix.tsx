import { arrowSvg } from "@/assets";
import { Button, Input, Toast, Dialog, TextArea } from "antd-mobile";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { validateAddressFnMap } from "@/utils/validateAddress";
import { useQuery } from "@tanstack/react-query";
import {
  waitForTransactionReceipt,
  writeContract,
  readContract,
} from "@wagmi/core";
import config from "@/proviers/config";
import {
  MiningMachineSystemStorageABI,
  MiningMachineNodeSystemABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import dayjs from "dayjs";

interface MixBalanceChangedEvent {
  id: string;
  from: string;
  to: string;
  amount: string;
  action: string;
  blockTimestamp: string;
  transactionHash: string;
}

const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/108352/hy-node-system/version/latest";

const UserTransferMix = () => {
  const navigate = useNavigate();
  const chainConfig = useChainConfig();
  const { address: userAddress } = useAccount();

  const MiningMachineSystemStorageAddress =
    chainConfig.STORAGE_ADDRESS as `0x${string}`;
  const MiningMachineNodeSystemAddress =
    chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`;

  const [receiveAddress, setReceiveAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [mixBalance, setMixBalance] = useState("0");
  const [transferLoading, setTransferLoading] = useState(false);
  const [pendingRecords, setPendingRecords] = useState<
    MixBalanceChangedEvent[]
  >([]);

  const handlBack = () => {
    navigate("/user");
  };

  // 查询 MIX 余额
  const queryMIXBalance = useCallback(async () => {
    if (!userAddress) return;
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "mixBalances",
        args: [userAddress],
      });
      setMixBalance(res ? formatEther(res as bigint) : "0");
    } catch (error) {
      console.error(error);
    }
  }, [userAddress, MiningMachineSystemStorageAddress]);

  useEffect(() => {
    queryMIXBalance();
  }, [queryMIXBalance]);

  // 从 The Graph 查询转账记录（from 或 to 等于当前钱包地址）
  const { data: transferRecords = [], refetch: refetchRecords } = useQuery({
    queryKey: ["mixTransferRecords", userAddress],
    queryFn: async () => {
      if (!userAddress) return [];

      // The Graph 不支持 OR 操作符，所以分两次查询：
      // 1. 查询 from = 当前地址（转出记录）
      // 2. 查询 to = 当前地址（转入记录）
      // 然后合并结果
      const query = `
        query GetMixTransfers($from: String!, $to: String!) {
          sent: mixBalanceChangeds(
            where: { from: $from }
            orderBy: blockTimestamp
            orderDirection: desc
            first: 20
          ) {
            id
            from
            to
            amount
            action
            blockTimestamp
            transactionHash
          }
          received: mixBalanceChangeds(
            where: { to: $to }
            orderBy: blockTimestamp
            orderDirection: desc
            first: 20
          ) {
            id
            from
            to
            amount
            action
            blockTimestamp
            transactionHash
          }
        }
      `;

      const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: {
            from: userAddress.toLowerCase(),
            to: userAddress.toLowerCase(),
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        return [];
      }

      // 合并发送和接收的记录
      const sent = (result.data?.sent || []) as MixBalanceChangedEvent[];
      const received = (result.data?.received ||
        []) as MixBalanceChangedEvent[];
      const allRecords = [...sent, ...received];

      // 去重（基于 id，避免同一条记录出现两次）
      const uniqueRecords = Array.from(
        new Map(allRecords.map((record) => [record.id, record])).values(),
      );

      // 按时间戳倒序排序（最新的在前面）
      return uniqueRecords.sort(
        (a, b) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp),
      );
    },
    enabled: !!userAddress,
  });

  // 设置全部余额
  const handleSetAllBalance = () => {
    setTransferAmount(mixBalance);
  };

  // 显示确认对话框
  const handleTransfer = async () => {
    // 验证地址
    const isValid = validateAddressFnMap?.["EVM"]?.(receiveAddress);
    if (!isValid) {
      Toast.show({
        content: "请输入合法的钱包地址",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 验证金额
    if (!transferAmount || +transferAmount <= 0) {
      Toast.show({
        content: "请输入有效的转账金额",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 检查余额
    if (+transferAmount > +mixBalance) {
      Toast.show({
        content: "MIX余额不足",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 显示确认对话框
    Dialog.show({
      content: (
        <div className="text-left py-2">
          <div className="text-[13px] font-normal mb-4 text-purple-500">
            再次提示：
          </div>
          <div className="mb-3">
            <div className="text-white text-[14px] mb-1">接收地址：</div>
            <div className="text-white text-[15px] break-all leading-relaxed font-light">
              {receiveAddress}
            </div>
          </div>
          <div className="mb-6">
            <span className="text-white text-[14px]">转账金额：</span>
            <span className="text-white text-[15px] ml-2 font-light">
              {transferAmount} MIX
            </span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => Dialog.clear()}
              className="flex-1 bg-[#4a4a4a] text-white rounded-3xl py-3 text-[15px] font-medium"
            >
              取消
            </button>
            <button
              onClick={() => {
                Dialog.clear();
                executeTransfer();
              }}
              className="flex-1 bg-[#7334FE] text-white rounded-3xl py-3 text-[15px] font-medium"
            >
              确认转账
            </button>
          </div>
        </div>
      ),
      closeOnAction: false,
      closeOnMaskClick: false,
      actions: [],
      bodyClassName: "!bg-black !rounded-3xl !p-6",
      bodyStyle: {
        borderRadius: "24px",
        width: "90vw",
        maxWidth: "500px",
        margin: "0 auto",
      },
      style: {
        "--background": "#000000",
        "--border-radius": "24px",
        "--width": "90vw",
        "--max-width": "500px",
        "--margin": "0 auto",
      } as React.CSSProperties,
    });
  };

  // 执行转账
  const executeTransfer = async () => {
    try {
      setTransferLoading(true);
      Toast.show({
        content: "转账中...",
        position: "center",
        duration: 0,
      });

      const hash = await writeContract(config, {
        address: MiningMachineNodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "transferMix",
        args: [receiveAddress as `0x${string}`, parseEther(transferAmount)],
        gas: 200000n,
      });

      console.log("Transaction hash:", hash);

      // 等待交易确认，增加超时时间和重试
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        timeout: 60000, // 60 秒超时
        confirmations: 1, // 等待 1 个确认
      });

      console.log("Transaction receipt:", receipt);

      // 检查交易状态
      if (receipt.status === "success") {
        Toast.clear();
        Toast.show({
          content: "转账成功",
          position: "center",
          duration: 2000,
        });

        // 立即添加到本地待确认记录（乐观更新）
        const newRecord: MixBalanceChangedEvent = {
          id: `local-${hash}`,
          from: userAddress!.toLowerCase(),
          to: receiveAddress.toLowerCase(),
          amount: parseEther(transferAmount).toString(),
          action: "transferMix",
          blockTimestamp: Math.floor(Date.now() / 1000).toString(),
          transactionHash: hash,
        };
        setPendingRecords((prev) => [newRecord, ...prev]);

        // 清空表单并刷新余额
        setReceiveAddress("");
        setTransferAmount("");
        queryMIXBalance();
      } else {
        // 交易失败
        throw new Error("Transaction failed");
      }
    } catch (error: unknown) {
      console.error("Transfer MIX failed:", error);
      Toast.clear();

      let errorMessage = "转账失败";
      if (error instanceof Error && error.message) {
        console.log("Error message:", error.message);
        if (error.message.includes("user rejected")) {
          errorMessage = "用户取消了交易";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "BNB余额不足，无法支付Gas费";
        } else if (error.message.includes("execution reverted")) {
          errorMessage = "转账失败：合约执行被回退";
        }
      }

      Toast.show({
        content: errorMessage,
        position: "center",
        duration: 3000,
      });
    } finally {
      setTransferLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (timestamp: string) => {
    return dayjs.unix(parseInt(timestamp)).format("YYYY年 M月DD日   HH:mm:ss");
  };

  // 判断是转出还是转入
  const getTransferType = (record: MixBalanceChangedEvent) => {
    if (!userAddress) return "unknown";
    return record.from.toLowerCase() === userAddress.toLowerCase()
      ? "out"
      : "in";
  };

  // 获取对方地址
  const getOtherAddress = (record: MixBalanceChangedEvent) => {
    if (!userAddress) return "";
    return record.from.toLowerCase() === userAddress.toLowerCase()
      ? record.to
      : record.from;
  };

  // 合并 The Graph 数据和本地待确认记录
  const allRecords = [...pendingRecords, ...transferRecords];

  return (
    <div className="h-screen bg-gray-100 px-[20px] pb-6 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="flex pt-2 pb-2 flex-shrink-0">
        <Button
          onClick={handlBack}
          className="!p-[0] !rounded-2xl"
          loading={transferLoading}
        >
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[17px] font-bold text-black">MIX转账</span>
      </div>

      {/* 转账表单 */}
      <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-shrink-0">
        {/* 接收钱包地址 */}
        <div className="mb-3">
          <div className="text-[14px] font-medium mb-1.5 text-black flex items-center">
            <span className="w-2 h-2 bg-black rounded-full mr-2"></span>
            接收钱包地址
          </div>
          <TextArea
            value={receiveAddress}
            onChange={(val) => setReceiveAddress(val)}
            placeholder="输入钱包地址..."
            rows={2}
            autoSize={{ minRows: 2, maxRows: 2 }}
            className="!bg-[#f5f5f7] !rounded-2xl !p-3 !border-none"
            style={{
              fontSize: "14px",
              "--placeholder-color": "#999",
            }}
          />
        </div>

        {/* 转账金额 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[14px] font-medium text-black flex items-center">
              <span className="w-2 h-2 bg-black rounded-full mr-2"></span>
              转账金额
            </div>
            <div className="text-[12px] text-gray-500">
              余额:{" "}
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={mixBalance}
                decimalSubLen={2}
                className="font-semibold text-black"
              />
              MIX
            </div>
          </div>
          <div className="relative">
            <Input
              value={transferAmount}
              onChange={(val) => {
                // 只允许数字和小数点
                const filtered = val.replace(/[^\d.]/g, "");
                // 确保只有一个小数点
                const parts = filtered.split(".");
                const result =
                  parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : filtered;
                setTransferAmount(result);
              }}
              placeholder="输入转账金额"
              className="!bg-[#f5f5f7] !rounded-2xl !p-3 !pr-24 !border-none"
              style={{
                fontSize: "14px",
                "--placeholder-color": "#999",
              }}
              type="text"
              inputMode="decimal"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                onClick={handleSetAllBalance}
                className="!px-4 !py-1 !h-auto !text-[12px] !bg-[#7334FE] !text-white !rounded-full !border-none"
              >
                全部
              </Button>
              <span className="text-[13px] text-gray-500 font-medium">MIX</span>
            </div>
          </div>
        </div>

        {/* 执行转账按钮 */}
        <Button
          onClick={handleTransfer}
          loading={transferLoading}
          disabled={transferLoading || !receiveAddress || !transferAmount}
          className="w-full !bg-black !text-white !rounded-3xl !py-2.5 !text-[15px] !font-medium !h-auto disabled:!bg-gray-300"
        >
          执行转账
        </Button>
      </div>

      {/* 交易记录 */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="text-[14px] font-medium mb-3 text-gray-700 flex-shrink-0">
          交易记录：
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {allRecords.length > 0 ? (
            allRecords.map((record) => {
              const transferType = getTransferType(record);
              const otherAddress = getOtherAddress(record);
              const amount = formatEther(BigInt(record.amount));

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl px-4 py-2 shadow-sm"
                >
                  <div className="space-y-0">
                    <div className="flex items-start text-[13px]">
                      <span className="text-gray-600 min-w-[70px]">
                        转账金额:
                      </span>
                      <span
                        className={`font-semibold flex-1 ${
                          transferType === "out"
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {transferType === "out" ? "-" : "+"}
                        {amount} MIX
                      </span>
                    </div>
                    <div className="flex items-start text-[13px]">
                      <span className="text-gray-600 min-w-[70px]">
                        转账日期:
                      </span>
                      <span className="text-gray-800 flex-1">
                        {formatDate(record.blockTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-start text-[13px]">
                      <span className="text-gray-600 min-w-[70px]">
                        {transferType === "out" ? "收款地址:" : "发送地址:"}
                      </span>
                      <span className="text-gray-800 break-all flex-1 leading-relaxed">
                        {otherAddress}
                      </span>
                    </div>
                    <div className="flex items-start text-[13px]">
                      <span className="text-gray-600 min-w-[70px]">
                        操作类型:
                      </span>
                      <span className="text-gray-800 flex-1">
                        {record.action === "transferMix" ||
                        record.action === "changeUserAddress"
                          ? "用户转账"
                          : record.action === "addMixForUser" ||
                              record.action === "subMixForUser"
                            ? "积分兑换"
                            : "系统转账"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
              暂无转账记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTransferMix;
