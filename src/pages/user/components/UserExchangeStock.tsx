import { arrowSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import {
    MiningMachineNodeSystemABI,
    StockSystemLogicABI,
    StockSystemStorageABI,
} from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import config from "@/proviers/config";
import { useQuery } from "@tanstack/react-query";
import {
    readContract,
    waitForTransactionReceipt,
    writeContract,
} from "@wagmi/core";
import { Button, Input, Modal, Tabs, Toast } from "antd-mobile";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";

interface StockExchangedEvent {
  id: string;
  user: string;
  isMixToStock: boolean;
  mixAmount: string;
  stockAmount: string;
  blockTimestamp: string;
  transactionHash: string;
}

interface DividendClaimedEvent {
  id: string;
  user: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/108352/hy-node-system/version/latest";

const UserExchangeStock = () => {
  const { address } = useAccount();
  const chainConfig = useChainConfig();
  const navigate = useNavigate();

  const StockLogicAddress = chainConfig.STOCK_LOGIC_ADDRESS as `0x${string}`;
  const StockStorageAddress =
    chainConfig.STOCK_STORAGE_ADDRESS as `0x${string}`;
  const NodeSystemAddress = chainConfig.NODE_SYSTEM_ADDRESS as `0x${string}`;

  // 从环境变量读取是否允许撤回股份
  const allowWithdraw = import.meta.env.VITE_ALLOW_WITHDRAW === "true";

  const [mixBalance, setMixBalance] = useState("0");
  const [stockBalance, setStockBalance] = useState("0");
  const [mixValue, setMixValue] = useState("0");
  const [totalMarketValue, setTotalMarketValue] = useState("0");
  const [totalStockIssued, setTotalStockIssued] = useState("0");
  const [unclaimedDividend, setUnclaimedDividend] = useState("0");
  const [bankInfo, setBankInfo] = useState<{
    bankName: string;
    bankCardNumber: string;
    name: string;
  } | null>(null);

  const [mixAmount, setMixAmount] = useState("");
  const [stockAmount, setStockAmount] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeMode, setExchangeMode] = useState<"mixToStock" | "stockToMix">(
    "mixToStock",
  );
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState("exchange"); // 'exchange' or 'withdraw'
  const [pendingExchangeRecords, setPendingExchangeRecords] = useState<
    StockExchangedEvent[]
  >([]);
  const [pendingWithdrawRecords, setPendingWithdrawRecords] = useState<
    DividendClaimedEvent[]
  >([]);

  // 查询用户 MIX 余额
  const queryMixBalance = useCallback(async () => {
    if (!address) return;
    try {
      const res = await readContract(config, {
        address: NodeSystemAddress,
        abi: MiningMachineNodeSystemABI,
        functionName: "getUserMixBalance",
        args: [address],
      });
      setMixBalance(res ? formatEther(res) : "0");
    } catch (error) {
      console.error("查询 MIX 余额失败:", error);
    }
  }, [address, NodeSystemAddress]);

  // 查询用户股权余额
  const queryStockBalance = useCallback(async () => {
    if (!address) return;
    try {
      const res = await readContract(config, {
        address: StockStorageAddress,
        abi: StockSystemStorageABI,
        functionName: "getUserStockBalance",
        args: [address],
      });
      setStockBalance(res ? formatEther(res) : "0");
    } catch (error) {
      console.error("查询股权余额失败:", error);
    }
  }, [address, StockStorageAddress]);

  // 查询未领取分红
  const queryUnclaimedDividend = useCallback(async () => {
    if (!address) return;
    try {
      const res = await readContract(config, {
        address: StockLogicAddress,
        abi: StockSystemLogicABI,
        functionName: "getTotalUnclaimedDividend",
        args: [address],
      });
      setUnclaimedDividend(res ? formatEther(res) : "0");
    } catch (error) {
      console.error("查询未领取分红失败:", error);
    }
  }, [address, StockLogicAddress]);

  // 查询银行账号信息
  const queryBankInfo = useCallback(async () => {
    if (!address) return;
    try {
      const res = await readContract(config, {
        address: StockStorageAddress,
        abi: StockSystemStorageABI,
        functionName: "getUserBankInfo",
        args: [address],
      });
      if (res && res[0] && res[1]) {
        setBankInfo({
          bankName: res[0] as string,
          bankCardNumber: res[1] as string,
          name: res[2] as string,
        });
      } else {
        setBankInfo(null);
      }
    } catch (error) {
      console.error("查询银行信息失败:", error);
      setBankInfo(null);
    }
  }, [address, StockStorageAddress]);

  // 从 The Graph 查询兑换记录
  const { data: exchangeRecords = [] } = useQuery({
    queryKey: ["stockExchangeRecords", address],
    queryFn: async () => {
      if (!address) return [];

      const query = `
        query GetStockExchanges($user: String!) {
          stockExchangeds(
            where: { user: $user }
            orderBy: blockTimestamp
            orderDirection: desc
            first: 50
          ) {
            id
            user
            isMixToStock
            mixAmount
            stockAmount
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
            user: address.toLowerCase(),
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        return [];
      }

      return (result.data?.stockExchangeds || []) as StockExchangedEvent[];
    },
    enabled: !!address,
  });

  // 从 The Graph 查询提现记录
  const { data: withdrawRecords = [] } = useQuery({
    queryKey: ["dividendClaimedRecords", address],
    queryFn: async () => {
      if (!address) return [];

      const query = `
        query GetDividendClaims($user: String!) {
          dividendClaimeds(
            where: { user: $user }
            orderBy: blockTimestamp
            orderDirection: desc
            first: 50
          ) {
            id
            user
            amount
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
            user: address.toLowerCase(),
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        return [];
      }

      return (result.data?.dividendClaimeds || []) as DividendClaimedEvent[];
    },
    enabled: !!address,
  });

  // 查询系统配置
  const querySystemConfig = useCallback(async () => {
    try {
      const [mixVal, marketVal, stockIssued] = await Promise.all([
        readContract(config, {
          address: StockStorageAddress,
          abi: StockSystemStorageABI,
          functionName: "mixValue",
        }),
        readContract(config, {
          address: StockStorageAddress,
          abi: StockSystemStorageABI,
          functionName: "totalMarketValue",
        }),
        readContract(config, {
          address: StockStorageAddress,
          abi: StockSystemStorageABI,
          functionName: "totalStockIssued",
        }),
      ]);

      console.log("查询到的系统配置:", {
        mixVal: mixVal?.toString(),
        marketVal: marketVal?.toString(),
        stockIssued: stockIssued?.toString(),
      });

      setMixValue(mixVal ? formatEther(mixVal) : "0");
      setTotalMarketValue(marketVal ? formatEther(marketVal) : "0");
      setTotalStockIssued(stockIssued ? formatEther(stockIssued) : "0");
    } catch (error) {
      console.error("查询系统配置失败:", error);
    }
  }, [StockStorageAddress]);

  useEffect(() => {
    queryMixBalance();
    queryStockBalance();
    querySystemConfig();
    queryUnclaimedDividend();
    queryBankInfo();
  }, [
    queryMixBalance,
    queryStockBalance,
    querySystemConfig,
    queryUnclaimedDividend,
    queryBankInfo,
  ]);

  // 预览兑换 - 本地计算
  const handlePreviewExchange = useCallback(
    (amount: string, mode: "mixToStock" | "stockToMix") => {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        if (mode === "mixToStock") {
          setStockAmount("");
        } else {
          setMixAmount("");
        }
        return;
      }

      try {
        const totalStock = Number(totalStockIssued);
        const marketValue = Number(totalMarketValue);
        const mixVal = Number(mixValue);

        if (totalStock === 0 || marketValue === 0 || mixVal === 0) {
          if (mode === "mixToStock") {
            setStockAmount("0");
          } else {
            setMixAmount("0");
          }
          return;
        }

        if (mode === "mixToStock") {
          // MIX -> 股权
          // 公式：(mixAmount * mixValue * totalStock) / marketValue
          // 因为所有值都已经是 ether 格式（普通数字），不需要再处理精度
          const mixAmt = Number(amount);
          const result = (mixAmt * mixVal * totalStock) / marketValue;
          setStockAmount(result.toFixed(2));
        } else {
          // 股权 -> MIX
          // 公式：(stockAmount * marketValue) / (totalStock * mixValue)
          const stockAmt = Number(amount);
          const result = (stockAmt * marketValue) / (totalStock * mixVal);
          setMixAmount(result.toFixed(2));
        }
      } catch (error) {
        console.error("本地计算失败:", error);
        if (mode === "mixToStock") {
          setStockAmount("0");
        } else {
          setMixAmount("0");
        }
      }
    },
    [mixValue, totalMarketValue, totalStockIssued],
  );

  // MIX 兑换股权
  const handleExchangeMixToStock = async () => {
    if (!mixAmount || Number(mixAmount) <= 0) {
      Toast.show({ content: "请输入有效的 MIX 数量", position: "center" });
      return;
    }

    if (Number(mixAmount) > Number(mixBalance)) {
      Toast.show({ content: "MIX 余额不足", position: "center" });
      return;
    }

    // 显示确认提示框
    Modal.show({
      bodyStyle: {
        background: "#000000",
        color: "#ffffff",
        width: "75vw",
        padding: "20px",
        borderRadius: "20px",
      },
      bodyClassName: "!m-auto",
      showCloseButton: false,
      closeOnMaskClick: false,
      content: (
        <div className="text-white">
          <div className="text-[#B195FF] text-[16px] mb-6 text-center">
            兑换提示:
          </div>
          <div className="space-y-3 text-[14px] mb-6">
            <div className="flex justify-between">
              <span className="text-[#999]">支付金额:</span>
              <span className="text-white font-medium">
                -{Number(mixAmount).toFixed(2)} MIX
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">兑换股份数:</span>
              <span className="text-white font-medium">
                {Number(stockAmount).toFixed(2)} 股
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 bg-[#333] rounded-3xl text-white py-3 text-[15px]"
              onClick={() => Modal.clear()}
            >
              取消
            </button>
            <button
              className="flex-1 bg-[#895EFF] rounded-3xl text-white py-3 text-[15px]"
              onClick={async () => {
                Modal.clear();
                try {
                  setIsExchanging(true);

                  const hash = await writeContract(config, {
                    address: StockLogicAddress,
                    abi: StockSystemLogicABI,
                    functionName: "exchangeMixForStock",
                    args: [parseEther(mixAmount)],
                    gas: 150000n,
                  });

                  await waitForTransactionReceipt(config, { hash });

                  // 立即添加到本地待确认记录（乐观更新）
                  const newRecord: StockExchangedEvent = {
                    id: `local-${hash}`,
                    user: address!.toLowerCase(),
                    isMixToStock: true,
                    mixAmount: parseEther(mixAmount).toString(),
                    stockAmount: parseEther(stockAmount).toString(),
                    blockTimestamp: Math.floor(Date.now() / 1000).toString(),
                    transactionHash: hash,
                  };
                  setPendingExchangeRecords((prev) => [newRecord, ...prev]);

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
                        <div className="text-[#B195FF]">兑换成功</div>
                        <div>
                          <div className="mb-4">
                            你已成功兑换
                            <AdaptiveNumber
                              type={NumberType.BALANCE}
                              value={stockAmount}
                              decimalSubLen={2}
                              className="font-bold text-[15px] mx-1"
                            />
                            股权
                          </div>
                          <button
                            className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                            onClick={() => {
                              Modal.clear();
                              setMixAmount("");
                              setStockAmount("");
                              queryMixBalance();
                              queryStockBalance();
                              queryUnclaimedDividend();
                            }}
                          >
                            确认
                          </button>
                        </div>
                      </div>
                    ),
                  });
                } catch (error) {
                  console.error("兑换失败:", error);
                  // 检测错误类型
                  const errorMessage =
                    error instanceof Error ? error.message : "兑换失败";
                  const isUserRejected =
                    errorMessage.toLowerCase().includes("user rejected") ||
                    errorMessage.toLowerCase().includes("user denied");
                  const isNotAuthorized = errorMessage
                    .toLowerCase()
                    .includes("not authorized");

                  let displayMessage = "兑换失败";
                  if (isUserRejected) {
                    displayMessage = "用户取消";
                  } else if (isNotAuthorized) {
                    displayMessage =
                      "合约未授权，请联系管理员在设置页面执行授权";
                  }

                  Toast.show({
                    content: displayMessage,
                    position: "center",
                    duration: isNotAuthorized ? 3000 : 2000,
                  });
                } finally {
                  setIsExchanging(false);
                }
              }}
            >
              确认兑换
            </button>
          </div>
        </div>
      ),
    });
  };

  // 股权兑换 MIX
  const handleExchangeStockToMix = async () => {
    if (!stockAmount || Number(stockAmount) <= 0) {
      Toast.show({ content: "请输入有效的股权数量", position: "center" });
      return;
    }

    if (Number(stockAmount) > Number(stockBalance)) {
      Toast.show({ content: "股权余额不足", position: "center" });
      return;
    }

    // 显示确认提示框
    Modal.show({
      bodyStyle: {
        background: "#000000",
        color: "#ffffff",
        width: "75vw",
        padding: "20px",
        borderRadius: "20px",
      },
      bodyClassName: "!m-auto",
      showCloseButton: false,
      closeOnMaskClick: false,
      content: (
        <div className="text-white">
          <div className="text-[#B195FF] text-[16px] mb-6 text-center">
            撤回提示:
          </div>
          <div className="space-y-3 text-[14px] mb-6">
            <div className="flex justify-between">
              <span className="text-[#999]">撤回股份数:</span>
              <span className="text-white font-medium">
                -{Number(stockAmount).toFixed(2)} 股
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">获得金额:</span>
              <span className="text-white font-medium">
                {Number(mixAmount).toFixed(2)} MIX
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 bg-[#333] rounded-3xl text-white py-3 text-[15px]"
              onClick={() => Modal.clear()}
            >
              取消
            </button>
            <button
              className="flex-1 bg-[#895EFF] rounded-3xl text-white py-3 text-[15px]"
              onClick={async () => {
                Modal.clear();
                try {
                  setIsExchanging(true);

                  const hash = await writeContract(config, {
                    address: StockLogicAddress,
                    abi: StockSystemLogicABI,
                    functionName: "exchangeStockForMix",
                    args: [parseEther(stockAmount)],
                    gas: 150000n,
                  });

                  await waitForTransactionReceipt(config, { hash });

                  // 立即添加到本地待确认记录（乐观更新）
                  const newRecord: StockExchangedEvent = {
                    id: `local-${hash}`,
                    user: address!.toLowerCase(),
                    isMixToStock: false,
                    mixAmount: parseEther(mixAmount).toString(),
                    stockAmount: parseEther(stockAmount).toString(),
                    blockTimestamp: Math.floor(Date.now() / 1000).toString(),
                    transactionHash: hash,
                  };
                  setPendingExchangeRecords((prev) => [newRecord, ...prev]);

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
                        <div className="text-[#B195FF]">兑换成功</div>
                        <div>
                          <div className="mb-4">
                            你已成功兑换
                            <AdaptiveNumber
                              type={NumberType.BALANCE}
                              value={mixAmount}
                              decimalSubLen={2}
                              className="font-bold text-[15px] mx-1"
                            />
                            MIX
                          </div>
                          <button
                            className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                            onClick={() => {
                              Modal.clear();
                              setMixAmount("");
                              setStockAmount("");
                              queryMixBalance();
                              queryStockBalance();
                              queryUnclaimedDividend();
                            }}
                          >
                            确认
                          </button>
                        </div>
                      </div>
                    ),
                  });
                } catch (error) {
                  console.error("兑换失败:", error);
                  // 检测错误类型
                  const errorMessage =
                    error instanceof Error ? error.message : "兑换失败";
                  const isUserRejected =
                    errorMessage.toLowerCase().includes("user rejected") ||
                    errorMessage.toLowerCase().includes("user denied");
                  const isNotAuthorized = errorMessage
                    .toLowerCase()
                    .includes("not authorized");

                  let displayMessage = "兑换失败";
                  if (isUserRejected) {
                    displayMessage = "用户取消";
                  } else if (isNotAuthorized) {
                    displayMessage =
                      "合约未授权，请联系管理员在设置页面执行授权";
                  }

                  Toast.show({
                    content: displayMessage,
                    position: "center",
                    duration: isNotAuthorized ? 3000 : 2000,
                  });
                } finally {
                  setIsExchanging(false);
                }
              }}
            >
              确认撤回
            </button>
          </div>
        </div>
      ),
    });
  };

  const handleBack = () => {
    navigate("/user");
  };

  const toggleExchangeMode = () => {
    setExchangeMode((prev) =>
      prev === "mixToStock" ? "stockToMix" : "mixToStock",
    );
    setMixAmount("");
    setStockAmount("");
  };

  // 显示股权说明弹窗
  const showStockInfoModal = () => {
    const stockPrice =
      Number(totalStockIssued) > 0
        ? (Number(totalMarketValue) / Number(totalStockIssued)).toFixed(3)
        : "0";
    const myStockValue =
      Number(stockBalance) > 0 && Number(totalStockIssued) > 0
        ? (
            (Number(stockBalance) * Number(totalMarketValue)) /
            Number(totalStockIssued)
          ).toFixed(2)
        : "0";

    Modal.show({
      bodyStyle: {
        background: "#000000",
        color: "#ffffff",
        width: "75vw",
        padding: "15px",
        borderRadius: "20px",
      },
      bodyClassName: "!m-auto",
      showCloseButton: true,
      closeOnMaskClick: true,
      content: (
        <div className="text-white">
          <div className="text-[#B195FF] text-[16px] mb-6">股权说明:</div>
          <div className="space-y-4 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[#999]">当前股价:</span>
              <span className="text-white font-medium">{stockPrice} 元</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">公司总股数:</span>
              <span className="text-white font-medium">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={totalStockIssued}
                  decimalSubLen={0}
                />{" "}
                股
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">公司总市值:</span>
              <span className="text-white font-medium">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={totalMarketValue}
                  decimalSubLen={2}
                />{" "}
                元
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">我的持股数:</span>
              <span className="text-white font-medium">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={stockBalance}
                  decimalSubLen={2}
                />{" "}
                股
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">我的持股估值:</span>
              <span className="text-white font-medium">
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={myStockValue}
                  decimalSubLen={2}
                />{" "}
                元
              </span>
            </div>
          </div>
        </div>
      ),
    });
  };

  // 一键提现处理函数
  const handleWithdraw = async () => {
    // 检查是否有银行卡信息
    if (
      !bankInfo ||
      !bankInfo.bankName ||
      !bankInfo.bankCardNumber ||
      !bankInfo.name
    ) {
      Toast.show({
        content: "请先添加银行卡信息",
        position: "center",
        duration: 2000,
      });
      return;
    }

    // 检查是否有可提现的分红
    if (!unclaimedDividend || Number(unclaimedDividend) <= 0) {
      Toast.show({
        content: "暂无可提现的分红",
        position: "center",
      });
      return;
    }

    // 显示确认弹窗
    Modal.show({
      bodyStyle: {
        background: "#000000",
        color: "#ffffff",
        width: "75vw",
        padding: "20px",
        borderRadius: "20px",
      },
      bodyClassName: "!m-auto",
      showCloseButton: false,
      closeOnMaskClick: false,
      content: (
        <div className="text-white">
          <div className="text-[#B195FF] text-[16px] mb-6 text-center">
            分红提现申请:
          </div>
          <div className="space-y-3 text-[14px] mb-6">
            <div className="flex justify-between">
              <span className="text-[#999]">提现金额:</span>
              <span className="text-white font-medium">
                -{Number(unclaimedDividend).toFixed(2)} 元
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">收款银行:</span>
              <span className="text-white font-medium">
                {bankInfo.bankName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">收款账号:</span>
              <span className="text-white font-medium">
                {bankInfo.bankCardNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#999]">收款姓名:</span>
              <span className="text-white font-medium">{bankInfo.name}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 bg-[#333] rounded-3xl text-white py-3 text-[15px]"
              onClick={() => Modal.clear()}
            >
              取消
            </button>
            <button
              className="flex-1 bg-[#895EFF] rounded-3xl text-white py-3 text-[15px]"
              onClick={async () => {
                Modal.clear();
                try {
                  setIsWithdrawing(true);

                  const hash = await writeContract(config, {
                    address: StockLogicAddress,
                    abi: StockSystemLogicABI,
                    functionName: "claimDividend",
                    gas: 300000n,
                  });

                  await waitForTransactionReceipt(config, { hash });

                  // 立即添加到本地待确认记录（乐观更新）
                  const newRecord: DividendClaimedEvent = {
                    id: `local-${hash}`,
                    user: address!.toLowerCase(),
                    amount: parseEther(unclaimedDividend).toString(),
                    blockTimestamp: Math.floor(Date.now() / 1000).toString(),
                    transactionHash: hash,
                  };
                  setPendingWithdrawRecords((prev) => [newRecord, ...prev]);

                  Toast.show({
                    content: "提现申请已提交，请等待财务审核",
                    position: "center",
                    duration: 3000,
                  });

                  // 刷新分红数据
                  queryUnclaimedDividend();
                } catch (error) {
                  console.error("提现失败:", error);
                  // 检测错误类型
                  const errorMessage =
                    error instanceof Error ? error.message : "提现失败";
                  const isUserRejected =
                    errorMessage.toLowerCase().includes("user rejected") ||
                    errorMessage.toLowerCase().includes("user denied");
                  const isNotAuthorized = errorMessage
                    .toLowerCase()
                    .includes("not authorized");
                  const isNoDividend = errorMessage
                    .toLowerCase()
                    .includes("no dividend");

                  let displayMessage = "提现失败";
                  if (isUserRejected) {
                    displayMessage = "用户取消";
                  } else if (isNotAuthorized) {
                    displayMessage = "合约未授权，请联系管理员";
                  } else if (isNoDividend) {
                    displayMessage = "暂无可提现的分红";
                  }

                  Toast.show({
                    content: displayMessage,
                    position: "center",
                    duration: isNotAuthorized ? 3000 : 2000,
                  });
                } finally {
                  setIsWithdrawing(false);
                }
              }}
            >
              提交申请
            </button>
          </div>
        </div>
      ),
    });
  };

  // 显示银行信息编辑弹窗
  const showBankInfoModal = () => {
    let tempBankName = bankInfo?.bankName || "";
    let tempBankCardNumber = bankInfo?.bankCardNumber || "";
    let tempName = bankInfo?.name || "";

    Modal.show({
      bodyStyle: {
        background: "#F5F5F5",
        width: "75vw",
        padding: "0",
        borderRadius: "20px",
      },
      bodyClassName: "!m-auto",
      showCloseButton: false,
      closeOnMaskClick: false,
      content: (
        <div className="bg-[#F5F5F5] rounded-3xl overflow-hidden">
          {/* 头部 */}
          <div className="px-6 py-4 flex items-center justify-center relative">
            <span className="text-[18px] font-medium">
              {bankInfo ? "修改收款信息" : "填写收款信息"}
            </span>
            <button
              onClick={() => Modal.clear()}
              className="absolute right-4 w-8 h-8 flex items-center justify-center text-[#999]"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-2 space-y-4">
            {/* 姓名 */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#666]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <Input
                  placeholder="持卡人姓名"
                  defaultValue={tempName}
                  onChange={(val) => (tempName = val)}
                  className="flex-1 border-none bg-transparent text-[15px]"
                  style={{ "--font-size": "15px" }}
                />
              </div>
            </div>

            {/* 银行名称 */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#666]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <Input
                  placeholder="所属银行"
                  defaultValue={tempBankName}
                  onChange={(val) => (tempBankName = val)}
                  className="flex-1 border-none bg-transparent text-[15px]"
                  style={{ "--font-size": "15px" }}
                />
              </div>
            </div>

            {/* 银行卡号 */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-[#666]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path
                    fillRule="evenodd"
                    d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <Input
                  placeholder="银行卡号"
                  defaultValue={tempBankCardNumber}
                  onChange={(val) => (tempBankCardNumber = val)}
                  className="flex-1 border-none bg-transparent text-[15px]"
                  style={{ "--font-size": "15px" }}
                />
              </div>
            </div>

            {/* 保存按钮 */}
            <Button
              onClick={async () => {
                if (!tempName.trim()) {
                  Toast.show({
                    content: "请输入持卡人姓名",
                    position: "center",
                  });
                  return;
                }
                if (!tempBankName.trim()) {
                  Toast.show({ content: "请输入银行名称", position: "center" });
                  return;
                }
                if (!tempBankCardNumber.trim()) {
                  Toast.show({ content: "请输入银行卡号", position: "center" });
                  return;
                }

                // 显示确认弹窗
                const confirmModalHandler = Modal.show({
                  bodyStyle: {
                    background: "#000000",
                    color: "#ffffff",
                    width: "75vw",
                    padding: "20px",
                    borderRadius: "20px",
                  },
                  bodyClassName: "!m-auto",
                  showCloseButton: false,
                  closeOnMaskClick: false,
                  content: (
                    <ConfirmSaveBankInfo
                      tempName={tempName}
                      tempBankName={tempBankName}
                      tempBankCardNumber={tempBankCardNumber}
                      stockStorageAddress={StockStorageAddress}
                      userAddress={address!}
                      onSuccess={() => {
                        // 关闭所有弹窗
                        Modal.clear();
                        // 刷新银行信息
                        queryBankInfo();
                      }}
                      onCancel={() => {
                        // 只关闭确认弹窗
                        confirmModalHandler.close();
                      }}
                    />
                  ),
                });
              }}
              className="w-full bg-black! rounded-full! py-3! text-white! border-none! text-[16px]! font-medium! mt-6!"
            >
              保存
            </Button>
          </div>
        </div>
      ),
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-6">
      {/* 头部 */}
      <div className="flex items-center px-[21px] pt-4 mb-4 bg-white">
        <Button onClick={handleBack} className="p-0! rounded-2xl!">
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">兑换股权</span>
      </div>

      {/* 兑换卡片 */}
      <div className="bg-white rounded-3xl mx-4 p-4 mb-4">
        {/* 支付金额 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[14px] text-[#666]">
              {exchangeMode === "mixToStock" ? "支付金额" : "撤回股权"}
            </span>
            <span className="text-[12px] text-[#999]">
              余额:{" "}
              {exchangeMode === "mixToStock"
                ? `${Number(mixBalance).toFixed(2)}MIX`
                : `${Number(stockBalance).toFixed(2)}股`}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={exchangeMode === "mixToStock" ? mixAmount : stockAmount}
              onChange={(val) => {
                if (exchangeMode === "mixToStock") {
                  setMixAmount(val);
                  handlePreviewExchange(val, "mixToStock");
                } else {
                  setStockAmount(val);
                  handlePreviewExchange(val, "stockToMix");
                }
              }}
              placeholder={
                exchangeMode === "mixToStock" ? "输入转账金额" : "输入撤回股数"
              }
              className="w-full bg-[#F8F8F8] rounded-xl px-4 py-3 text-[16px] border-none"
              style={{ "--font-size": "16px" }}
            />
            <button
              onClick={() => {
                if (exchangeMode === "mixToStock") {
                  const balance = Number(mixBalance).toFixed(2);
                  setMixAmount(balance);
                  handlePreviewExchange(balance, "mixToStock");
                } else {
                  const balance = Number(stockBalance).toFixed(2);
                  setStockAmount(balance);
                  handlePreviewExchange(balance, "stockToMix");
                }
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#7334FE] text-white text-[12px] rounded-md"
            >
              全部
            </button>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[#666]">
              {exchangeMode === "mixToStock" ? "MIX" : "股"}
            </span>
          </div>
        </div>

        {/* 切换按钮 - 根据环境变量控制显示 */}
        {allowWithdraw && (
          <div className="flex justify-center mb-4">
            <button
              onClick={toggleExchangeMode}
              className="w-10 h-10 flex items-center justify-center bg-[#F8F8F8] rounded-full hover:bg-[#E8E8E8] transition-colors"
              aria-label="切换兑换方向"
            >
              <svg
                className="w-5 h-5 text-[#7334FE]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 兑换比例提示 */}
        {mixAmount &&
          stockAmount &&
          Number(mixAmount) > 0 &&
          Number(stockAmount) > 0 && (
            <div className="text-center text-[12px] text-[#999] mb-4">
              兑换股数 1股 ={" "}
              {(Number(mixAmount) / Number(stockAmount)).toFixed(3)}MIX ={" "}
              {(
                (Number(mixAmount) * Number(mixValue)) /
                Number(stockAmount)
              ).toFixed(3)}
              CNY
            </div>
          )}

        {/* 兑换股数/获得金额 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[14px] text-[#666]">
              {exchangeMode === "mixToStock" ? "兑换股数" : "获得金额"}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={exchangeMode === "mixToStock" ? stockAmount : mixAmount}
              onChange={(val) => {
                if (exchangeMode === "mixToStock") {
                  setStockAmount(val);
                  handlePreviewExchange(val, "stockToMix");
                } else {
                  setMixAmount(val);
                  handlePreviewExchange(val, "mixToStock");
                }
              }}
              placeholder={
                exchangeMode === "mixToStock" ? "输入兑换股数" : "输入获得金额"
              }
              className="w-full bg-[#F8F8F8] rounded-xl px-4 py-3 text-[16px] border-none"
              style={{ "--font-size": "16px" }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[#666]">
              {exchangeMode === "mixToStock" ? "股" : "MIX"}
            </span>
          </div>
        </div>

        {/* 兑换按钮 */}
        <Button
          disabled={
            !mixAmount ||
            Number(mixAmount) <= 0 ||
            !stockAmount ||
            Number(stockAmount) <= 0 ||
            isExchanging
          }
          loading={isExchanging}
          onClick={
            exchangeMode === "mixToStock"
              ? handleExchangeMixToStock
              : handleExchangeStockToMix
          }
          className="w-full bg-black! rounded-full! py-3! text-white! border-none! text-[16px]! font-medium!"
        >
          {isExchanging
            ? "处理中..."
            : exchangeMode === "mixToStock"
              ? "兑换股权"
              : "撤回股权"}
        </Button>
      </div>

      {/* 我的股权卡片 */}
      <div className="bg-white rounded-3xl mx-4 p-6 mb-4">
        {/* 持股数和估值 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#666]">我的持股数:</span>
            <span className="text-[20px] font-bold">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={stockBalance}
                decimalSubLen={2}
              />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#666]">估值:</span>
            <span className="text-[20px] font-bold text-[#333]">
              <AdaptiveNumber
                type={NumberType.BALANCE}
                value={
                  Number(stockBalance) > 0 && Number(totalStockIssued) > 0
                    ? (
                        (Number(stockBalance) * Number(totalMarketValue)) /
                        Number(totalStockIssued)
                      ).toString()
                    : "0"
                }
                decimalSubLen={2}
              />
              元
            </span>
            <button
              onClick={showStockInfoModal}
              className="w-5 h-5 flex items-center justify-center bg-[#E0E0E0] rounded-full text-white text-[12px]"
            >
              ?
            </button>
          </div>
        </div>

        {/* 分红累计 */}
        <div className="text-center mb-6">
          <div className="text-[48px] font-bold mb-1">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={unclaimedDividend}
              decimalSubLen={2}
            />
          </div>
          <div className="text-[14px] text-[#999]">分红累计（元）</div>
        </div>

        {/* 一键提现按钮 */}
        <Button
          disabled={!unclaimedDividend || Number(unclaimedDividend) <= 0}
          loading={isWithdrawing}
          onClick={handleWithdraw}
          className="w-full bg-[#7334FE]! rounded-full! py-3! text-white! border-none! text-[16px]! font-medium! disabled:bg-[#CCCCCC]! disabled:opacity-50!"
        >
          一键提现
        </Button>
      </div>

      {/* 收款人账号 */}
      <div className="bg-white rounded-3xl mx-4 p-6 pb-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[15px] font-medium">收款人账号</span>
          {bankInfo && (
            <button
              onClick={showBankInfoModal}
              className="text-[#7334FE] text-[12px]"
            >
              修改信息
            </button>
          )}
        </div>
        {bankInfo ? (
          <div className="border-2 border-[#7334FE] rounded-xl p-4 space-y-2">
            <div className="flex text-[13px]">
              <span className="text-[#666] w-16">姓名:</span>
              <span>{bankInfo.name}</span>
            </div>
            <div className="flex text-[13px]">
              <span className="text-[#666] w-16">银行:</span>
              <span>{bankInfo.bankName}</span>
            </div>
            <div className="flex text-[13px]">
              <span className="text-[#666] w-16">账号:</span>
              <span>{bankInfo.bankCardNumber}</span>
            </div>
          </div>
        ) : (
          <Button
            onClick={showBankInfoModal}
            className="w-full bg-[#7334FE]! rounded-full! py-3! text-white! border-none! text-[15px]! font-medium!"
          >
            添加银行账号
          </Button>
        )}
      </div>

      {/* 历史记录标题和标签 */}
      <div className="bg-[#F5F5F5] px-4 pt-2 pb-1">
        <h3 className="text-[15px] font-bold mb-2">交易记录:</h3>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          style={{
            "--title-font-size": "14px",
            "--active-line-color": "#7334FE",
            "--active-title-color": "#7334FE",
          }}
        >
          <Tabs.Tab title="兑换记录" key="exchange" />
          <Tabs.Tab title="提现记录" key="withdraw" />
        </Tabs>
      </div>

      {/* 记录列表 */}
      <div className="px-4 pb-6">
        {activeTab === "exchange" && (
          <div className="space-y-3 mt-3">
            {[...pendingExchangeRecords, ...exchangeRecords].length > 0 ? (
              [...pendingExchangeRecords, ...exchangeRecords].map((record) => (
                <div key={record.id} className="bg-white rounded-2xl p-4">
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#666]">
                        {record.isMixToStock ? "支付金额:" : "获得金额:"}
                      </span>
                      <span
                        className={`font-medium ${
                          record.isMixToStock
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {record.isMixToStock ? "-" : "+"}
                        {Number(formatEther(BigInt(record.mixAmount))).toFixed(
                          2,
                        )}{" "}
                        MIX
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">
                        {record.isMixToStock ? "兑换股份数:" : "撤回股份数:"}
                      </span>
                      <span
                        className={`font-medium ${
                          record.isMixToStock
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {record.isMixToStock ? "+" : "-"}
                        {Number(
                          formatEther(BigInt(record.stockAmount)),
                        ).toFixed(2)}{" "}
                        股
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">兑换时间:</span>
                      <span className="text-[#999]">
                        {dayjs
                          .unix(parseInt(record.blockTimestamp))
                          .format("YYYY年M月DD日 HH:mm:ss")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">交易哈希:</span>
                      <span className="text-[#999] text-[11px] break-all">
                        {record.transactionHash.slice(0, 10)}...
                        {record.transactionHash.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
                暂无兑换记录
              </div>
            )}
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="space-y-3 mt-3">
            {[...pendingWithdrawRecords, ...withdrawRecords].length > 0 ? (
              [...pendingWithdrawRecords, ...withdrawRecords].map((record) => (
                <div key={record.id} className="bg-white rounded-2xl p-4">
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#666]">提现金额:</span>
                      <span className="font-medium text-red-500">
                        -{Number(formatEther(BigInt(record.amount))).toFixed(2)}{" "}
                        元
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">提现时间:</span>
                      <span className="text-[#999]">
                        {dayjs
                          .unix(parseInt(record.blockTimestamp))
                          .format("YYYY年M月DD日 HH:mm:ss")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">提现状态:</span>
                      <span className="text-orange-500">待财务审核</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">交易哈希:</span>
                      <span className="text-[#999] text-[11px] break-all">
                        {record.transactionHash.slice(0, 10)}...
                        {record.transactionHash.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
                暂无提现记录
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 确认保存银行信息弹窗组件
const ConfirmSaveBankInfo: React.FC<{
  tempName: string;
  tempBankName: string;
  tempBankCardNumber: string;
  stockStorageAddress: `0x${string}`;
  userAddress: `0x${string}`;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({
  tempName,
  tempBankName,
  tempBankCardNumber,
  stockStorageAddress,
  userAddress,
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);

      const hash = await writeContract(config, {
        address: stockStorageAddress,
        abi: StockSystemStorageABI,
        functionName: "setUserBankInfo",
        args: [userAddress, tempBankName, tempBankCardNumber, tempName],
        gas: 200000n,
      });

      await waitForTransactionReceipt(config, {
        hash,
      });

      Toast.show({
        content: "保存成功",
        position: "center",
      });

      onSuccess();
    } catch (error) {
      console.error("保存银行信息失败:", error);
      // 检测用户取消操作
      const errorMessage = error instanceof Error ? error.message : "保存失败";
      const isUserRejected =
        errorMessage.toLowerCase().includes("user rejected") ||
        errorMessage.toLowerCase().includes("user denied");

      Toast.show({
        content: isUserRejected ? "用户取消" : "保存失败",
        position: "center",
      });

      // 如果用户取消，关闭确认弹窗
      if (isUserRejected) {
        onCancel();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-white">
      <div className="text-[#B195FF] text-[16px] mb-6 text-center">
        确认保存
      </div>
      <div className="space-y-3 text-[14px] mb-6">
        <div className="flex justify-between">
          <span className="text-[#999]">持卡人姓名:</span>
          <span className="text-white font-medium">{tempName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#999]">所属银行:</span>
          <span className="text-white font-medium">{tempBankName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#999]">银行卡号:</span>
          <span className="text-white font-medium">{tempBankCardNumber}</span>
        </div>
      </div>
      {isLoading && (
        <div className="text-center text-[#B195FF] text-[14px] mb-4">
          正在处理中，请稍候...
        </div>
      )}
      <div className="flex gap-3">
        <button
          className="flex-1 bg-[#333] rounded-3xl text-white py-3 text-[15px] disabled:opacity-50"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </button>
        <button
          className="flex-1 bg-[#895EFF] rounded-3xl text-white py-3 text-[15px] disabled:opacity-50 flex items-center justify-center gap-2"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading && (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {isLoading ? "处理中..." : "确认保存"}
        </button>
      </div>
    </div>
  );
};

export default UserExchangeStock;
