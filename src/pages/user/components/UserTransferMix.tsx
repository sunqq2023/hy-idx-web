import { arrowSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { MiningMachineNodeSystemABI } from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import config from "@/proviers/config";
import { sendSignedRequest } from "@/utils/rsaSignature";
import { validateAddressFnMap } from "@/utils/validateAddress";
import { useQuery } from "@tanstack/react-query";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Button, Dialog, Input, TextArea, Toast } from "antd-mobile";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { MiningMachineSystemStorageABI } from "@/constants";

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
  const location = useLocation();
  const chainConfig = useChainConfig();
  const { address: userAddress } = useAccount();
  const boundPhone =
    (location.state as { boundPhone?: string } | undefined)?.boundPhone || "";

  const MiningMachineNodeSystemAddress =
    chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`;

  const [activeTab, setActiveTab] = useState<"mall" | "wallet">("mall");
  const [mallTransferType, setMallTransferType] = useState<"in" | "out">("in");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [mallAmount, setMallAmount] = useState("");
  const [mixBalance, setMixBalance] = useState("0"); // 本地余额状态
  const [mallTransferLoading, setMallTransferLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // 查询 MIX 余额
  useEffect(() => {
    const queryMIXBalance = async () => {
      if (!userAddress) return;
      try {
        const res = await readContract(config, {
          address: chainConfig.STORAGE_ADDRESS as `0x${string}`,
          abi: MiningMachineSystemStorageABI,
          functionName: "mixBalances",
          args: [userAddress],
        });
        setMixBalance(res ? formatEther(res as bigint) : "0");
      } catch (error) {
        console.error("查询MIX余额失败:", error);
        setMixBalance("0");
      }
    };

    queryMIXBalance();
  }, [userAddress, chainConfig.STORAGE_ADDRESS]);
  // 定义API响应接口
  interface ApiResponse {
    status: number;
    msg: string;
    data: {
      success: boolean;
      message?: string;
    };
  }

  const [pendingRecords, setPendingRecords] = useState<
    MixBalanceChangedEvent[]
  >([]);

  // 检查商城服务时间
  const checkMallServiceTime = (): boolean => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    // 22:58 = 22*60 + 58 = 1378 分钟
    // 01:02 = 1*60 + 2 = 62 分钟
    const serviceEnd = 1378; // 22:58
    const serviceStart = 62; // 01:02

    // 如果当前时间在 22:58-23:59 或 00:00-01:02 之间，暂停服务
    if (currentMinutes >= serviceEnd || currentMinutes < serviceStart) {
      return false; // 暂停服务
    }

    return true; // 正常服务
  };

  const handlBack = () => {
    navigate("/user");
  };

  const handleGoBind = () => {
    navigate("/user");
  };

  // 从 The Graph 查询转账记录（from 或 to 等于当前钱包地址）
  const { data: transferRecords = [] } = useQuery({
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
        gas: 100000n,
      });

      console.log("Transaction hash:", hash);

      // 等待交易确认，增加超时时间和重试
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        timeout: 60000, // 60 秒超时
        confirmations: 1, // 等待 1 个确认
      });

      // 检查交易状态
      if (receipt.status === "success") {
        Toast.clear();
        Toast.show({
          content: "转账成功",
          position: "center",
          duration: 2000,
        });

        // 更新本地余额
        const numericAmount = Number(transferAmount || 0);
        if (!Number.isNaN(numericAmount) && numericAmount > 0) {
          const current = Number(mixBalance || 0);
          const nextValue = Number.isNaN(current) ? 0 : current - numericAmount;
          setMixBalance(nextValue.toString());
        }

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

        // 清空表单
        setReceiveAddress("");
        setTransferAmount("");
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

  // 商城提交处理
  const handleMallSubmit = async () => {
    if (!userAddress) return;

    if (!boundPhone) {
      Toast.show({
        content: "请绑定钱包",
        position: "center",
        duration: 2000,
      });
      return;
    }

    if (!mallAmount || +mallAmount <= 0) {
      Toast.show({
        content: "请输入有效的数量",
        position: "center",
        duration: 2000,
      });
      return;
    }

    if (mallTransferType === "in" && +mallAmount > +mixBalance) {
      Toast.show({
        content: "MIX余额不足",
        position: "center",
        duration: 2000,
      });
      return;
    }

    const mixApiBase = (() => {
      if (import.meta.env.DEV) return "/api";
      const raw = (chainConfig.BIND_ADDRESS_URL || "").replace(/\/$/, "");
      if (!raw) return "";
      return raw.endsWith("/api") ? raw : `${raw}/api`;
    })();

    if (!mixApiBase) {
      Toast.show({
        content: "商城服务未配置",
        position: "center",
        duration: 2000,
      });
      return;
    }

    const confirmed = await Dialog.confirm({
      content: `确认${mallTransferType === "in" ? "转出" : "转入"} ${mallAmount} MIX？`,
      cancelText: "取消",
      confirmText: "确认",
    });
    if (!confirmed) return;

    // 检查商城服务时间
    if (!checkMallServiceTime()) {
      Toast.show({
        content: "商城暂停服务中",
        position: "center",
        duration: 3000,
      });
      return;
    }

    setMallTransferLoading(true);
    Toast.show({
      content: `${mallTransferType === "in" ? "转出" : "转入"}处理中...`,
      position: "center",
      duration: 0,
    });

    if (mallTransferType === "in") {
      // 钱包转商城：先调用接口，再调用链上，链上失败时回滚
      const mallContractAddress =
        "0x1cea1dc56Be6ab13Ad590Ff367c3Af375DA98A7d" as `0x${string}`;

      try {
        Toast.show({
          content: "更新商城余额中...",
          position: "center",
          duration: 0,
        });

        // 1. 先调用 /api/mix/updateMix 接口，增加商城余额
        const updateResult = await sendSignedRequest<ApiResponse>(
          "POST",
          `${mixApiBase}/mix/updateMix`,
          {
            phone: boundPhone,
            address: userAddress,
            amount: mallAmount, // 正数，表示转入商城
          },
        );

        // 检查API响应状态
        if (updateResult.status !== 200) {
          throw new Error(updateResult.msg || "更新商城余额失败");
        }

        // 检查业务逻辑是否成功
        if (updateResult.data?.success !== true) {
          throw new Error(
            updateResult.data?.message ||
              updateResult.msg ||
              "更新商城余额失败",
          );
        }

        Toast.show({
          content: "链上转账中...",
          position: "center",
          duration: 0,
        });

        // 2. 接口成功后，调用链上 transferMix 方法
        const hash = await writeContract(config, {
          address: MiningMachineNodeSystemAddress,
          abi: MiningMachineNodeSystemABI,
          functionName: "transferMix",
          args: [mallContractAddress, parseEther(mallAmount)],
          gas: 100000n,
        });

        console.log("Transaction hash:", hash);

        // 等待交易确认
        const receipt = await waitForTransactionReceipt(config, {
          hash,
          timeout: 120000, // 120 秒超时
          confirmations: 1, // 等待 1 个确认
        });

        // 检查交易状态
        if (receipt.status !== "success") {
          throw new Error("链上转账失败");
        }

        // 链上成功，完全成功
        Toast.clear();
        Toast.show({
          content: "转账成功",
          position: "center",
          duration: 2000,
        });

        // 立即添加到本地待确认记录（乐观更新）
        const newRecord: MixBalanceChangedEvent = {
          id: `local-mall-${hash}`,
          from: userAddress!.toLowerCase(),
          to: mallContractAddress.toLowerCase(),
          amount: parseEther(mallAmount).toString(),
          action: "transferMix",
          blockTimestamp: Math.floor(Date.now() / 1000).toString(),
          transactionHash: hash,
        };
        setPendingRecords((prev) => [newRecord, ...prev]);

        // 更新本地余额
        const numericAmount = Number(mallAmount || 0);
        if (!Number.isNaN(numericAmount) && numericAmount > 0) {
          const current = Number(mixBalance || 0);
          const nextValue = Number.isNaN(current) ? 0 : current - numericAmount;
          setMixBalance(nextValue.toString());
        }

        setMallAmount("");
      } catch (error) {
        // 链上调用失败，需要回滚接口
        console.error("链上转账失败，正在回滚商城余额:", error);

        // 优化错误提示
        let userFriendlyMessage = "链上转账失败";
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase();

          if (
            errorMsg.includes("user rejected") ||
            errorMsg.includes("rejected")
          ) {
            userFriendlyMessage = "用户取消了交易";
          } else if (
            errorMsg.includes("execution reverted") ||
            errorMsg.includes("revert")
          ) {
            userFriendlyMessage = "转账失败：合约执行被拒绝";
          } else if (
            errorMsg.includes("timeout") ||
            errorMsg.includes("timed out")
          ) {
            userFriendlyMessage = "网络超时，请稍后重试";
          } else if (
            errorMsg.includes("network") ||
            errorMsg.includes("connection")
          ) {
            userFriendlyMessage = "网络连接异常，请检查网络后重试";
          } else if (
            errorMsg.includes("gas") ||
            errorMsg.includes("insufficient funds")
          ) {
            userFriendlyMessage = "BNB余额不足，无法支付Gas费用";
          } else {
            userFriendlyMessage = "未知错误，请联系客服";
          }
        }

        Toast.show({
          content: `${userFriendlyMessage}，正在回滚商城余额...`,
          position: "center",
          duration: 0,
        });

        try {
          // 调用回滚接口，用负数把商城的MIX减掉
          const rollbackResult = await sendSignedRequest<ApiResponse>(
            "POST",
            `${mixApiBase}/mix/updateMix`,
            {
              phone: boundPhone,
              address: userAddress,
              amount: `-${mallAmount}`, // 负数，表示从商城减掉
            },
          );

          if (rollbackResult.status === 200 && rollbackResult.data?.success) {
            Toast.clear();
            Toast.show({
              content: `${userFriendlyMessage}，商城余额已回滚`,
              position: "center",
              duration: 3000,
            });
          } else {
            Toast.clear();
            Toast.show({
              content: `${userFriendlyMessage}，商城余额回滚失败，请联系客服`,
              position: "center",
              duration: 5000,
            });
          }
        } catch (rollbackError) {
          console.error("回滚失败:", rollbackError);
          Toast.clear();
          Toast.show({
            content: `${userFriendlyMessage}，商城余额回滚失败，请联系客服`,
            position: "center",
            duration: 5000,
          });
        }
      } finally {
        setMallTransferLoading(false);
      }
    } else {
      try {
        // 商城转钱包：保留现有功能
        const amountValue = `-${mallAmount}`;

        const result = await sendSignedRequest<ApiResponse>(
          "POST",
          `${mixApiBase}/mix/transferMix`,
          {
            phone: boundPhone,
            address: userAddress,
            amount: amountValue,
          },
        );

        // 检查API响应状态
        if (result.status !== 200) {
          throw new Error(result.msg || "转账失败");
        }

        // 检查业务逻辑是否成功
        if (result.data?.success !== true) {
          throw new Error(result.data?.message || result.msg || "转账失败");
        }

        // 立即添加到本地待确认记录（乐观更新）
        const mallContractAddress =
          "0x1cea1dc56Be6ab13Ad590Ff367c3Af375DA98A7d";
        const newRecord: MixBalanceChangedEvent = {
          id: `local-mall-${Date.now()}`,
          from: mallContractAddress.toLowerCase(),
          to: userAddress!.toLowerCase(),
          amount: parseEther(mallAmount).toString(),
          action: "transferMix",
          blockTimestamp: Math.floor(Date.now() / 1000).toString(),
          transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`, // 生成模拟hash
        };
        setPendingRecords((prev) => [newRecord, ...prev]);

        // 更新本地余额
        const numericAmount = Number(mallAmount || 0);
        if (!Number.isNaN(numericAmount) && numericAmount > 0) {
          const current = Number(mixBalance || 0);
          const nextValue = Number.isNaN(current) ? 0 : current + numericAmount;
          setMixBalance(nextValue.toString());
        }

        Toast.clear();
        Toast.show({
          content: "提交成功",
          position: "center",
          duration: 2000,
        });

        setMallAmount("");
      } catch (error) {
        Toast.clear();
        const message = error instanceof Error ? error.message : "提交失败";
        Toast.show({
          content: message || "提交失败",
          position: "center",
          duration: 3000,
        });
      } finally {
        setMallTransferLoading(false);
      }
    }
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

      {/* 标签切换 */}
      <div className="flex mb-4 flex-shrink-0 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("mall")}
          className={`flex-1 pb-2 text-[16px] transition-all text-center ${
            activeTab === "mall"
              ? "font-bold text-black border-b-2 border-black"
              : "font-normal text-gray-500"
          }`}
        >
          商城
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex-1 pb-2 text-[16px] transition-all text-center ${
            activeTab === "wallet"
              ? "font-bold text-black border-b-2 border-black"
              : "font-normal text-gray-500"
          }`}
        >
          钱包
        </button>
      </div>

      {/* 商城标签内容 */}
      {activeTab === "mall" && (
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-shrink-0">
          {boundPhone ? (
            <>
              {/* 转入/转出切换 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMallTransferType("in")}
                  className={`flex-1 py-2 rounded-xl text-[14px] font-medium transition-all ${
                    mallTransferType === "in"
                      ? "bg-[#7334FE] text-white"
                      : "bg-[#f5f5f7] text-gray-600"
                  }`}
                >
                  钱包 -&gt; 商城
                </button>
                <button
                  onClick={() => setMallTransferType("out")}
                  className={`flex-1 py-2 rounded-xl text-[14px] font-medium transition-all ${
                    mallTransferType === "out"
                      ? "bg-[#7334FE] text-white"
                      : "bg-[#f5f5f7] text-gray-600"
                  }`}
                >
                  商城 -&gt; 钱包
                </button>
              </div>

              {/* 输入数量 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[14px] font-medium text-black flex items-center">
                    <span className="w-2 h-2 bg-black rounded-full mr-2"></span>
                    数量
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
                    value={mallAmount}
                    onChange={(val) => {
                      const filtered = val.replace(/[^\d.]/g, "");
                      const parts = filtered.split(".");
                      const result =
                        parts.length > 2
                          ? parts[0] + "." + parts.slice(1).join("")
                          : filtered;
                      setMallAmount(result);
                    }}
                    placeholder={
                      mallTransferType === "in"
                        ? "输入转出数量"
                        : "输入转入数量"
                    }
                    className="!bg-[#f5f5f7] !rounded-2xl !p-3 !pr-24 !border-none"
                    style={{
                      fontSize: "14px",
                      "--placeholder-color": "#999",
                    }}
                    type="text"
                    inputMode="decimal"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                    {mallTransferType === "in" && (
                      <button
                        type="button"
                        onClick={() => setMallAmount(mixBalance)}
                        className="px-4 py-1 text-[12px] bg-[#7334FE] text-white rounded-full border-none"
                      >
                        全部
                      </button>
                    )}
                    <span className="text-[13px] text-gray-500 font-medium">
                      MIX
                    </span>
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <Button
                onClick={handleMallSubmit}
                loading={mallTransferLoading}
                disabled={mallTransferLoading || !mallAmount}
                className="w-full !bg-black !text-white !rounded-3xl !py-2.5 !text-[15px] !font-medium !h-auto disabled:!bg-gray-300"
              >
                提交
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-[15px] font-medium text-gray-700">
                请先绑定商城账号
              </div>
              <div className="text-[12px] text-gray-400 mt-2">
                绑定后即可进行 MIX 转入/转出
              </div>
              <button
                type="button"
                onClick={handleGoBind}
                className="mt-5 px-6 py-2 text-[13px] font-medium rounded-full bg-[#7334FE] text-white"
              >
                去绑定
              </button>
            </div>
          )}
        </div>
      )}

      {/* 钱包标签内容 */}
      {activeTab === "wallet" && (
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
                数量
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
                <span className="text-[13px] text-gray-500 font-medium">
                  MIX
                </span>
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
            提交
          </Button>
        </div>
      )}

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
                        record.action === "addMixForUser" ||
                        record.action === "subMixForUser" ||
                        record.action === "changeUserAddress"
                          ? "用户转账"
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
