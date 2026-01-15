import { arrowSvg } from "@/assets";
import AdaptiveNumber, { NumberType } from "@/components/AdaptiveNumber";
import { StockSystemLogicABI, StockSystemStorageABI } from "@/constants";
import { useChainConfig } from "@/hooks/useChainConfig";
import config from "@/proviers/config";
import {
    readContract,
    waitForTransactionReceipt,
    writeContract,
} from "@wagmi/core";
import { Button, Modal, Toast } from "antd-mobile";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatEther } from "viem";
import { useAccount, useChainId } from "wagmi";

const ClaimDividend = () => {
  const { address } = useAccount();
  const chainConfig = useChainConfig();
  const chainId = useChainId();
  const navigate = useNavigate();

  const StockLogicAddress = chainConfig.STOCK_LOGIC_ADDRESS as `0x${string}`;
  const StockStorageAddress =
    chainConfig.STOCK_STORAGE_ADDRESS as `0x${string}`;

  const [stockBalance, setStockBalance] = useState("0");
  const [unclaimedDividend, setUnclaimedDividend] = useState("0");
  const [isClaiming, setIsClaiming] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    bankCardNumber: "",
    name: "",
  });

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

  // 查询银行信息
  const queryBankInfo = useCallback(async () => {
    if (!address) return;
    try {
      const res = await readContract(config, {
        address: StockStorageAddress,
        abi: StockSystemStorageABI,
        functionName: "getUserBankInfo",
        args: [address],
      });
      if (res) {
        setBankInfo({
          bankName: res[0] as string,
          bankCardNumber: res[1] as string,
          name: res[2] as string,
        });
      }
    } catch (error) {
      console.error("查询银行信息失败:", error);
    }
  }, [address, StockStorageAddress]);

  useEffect(() => {
    queryStockBalance();
    queryUnclaimedDividend();
    queryBankInfo();
  }, [queryStockBalance, queryUnclaimedDividend, queryBankInfo]);

  // 领取分红
  const handleClaimDividend = async () => {
    if (Number(unclaimedDividend) <= 0) {
      Toast.show({ content: "暂无可领取分红", position: "center" });
      return;
    }

    if (!bankInfo.bankName || !bankInfo.bankCardNumber) {
      Toast.show({
        content: "请先在股权兑换页面填写银行信息",
        position: "center",
        afterClose: () => {
          navigate("/user/exchangeStock");
        },
      });
      return;
    }

    try {
      setIsClaiming(true);

      const hash = await writeContract(config, {
        address: StockLogicAddress,
        abi: StockSystemLogicABI,
        functionName: "claimDividend",
        gas: 500000n,
      });

      await waitForTransactionReceipt(config, { hash, chainId });

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
            <div className="text-[#B195FF]">领取成功</div>
            <div>
              <div className="mb-4">
                你已成功领取
                <AdaptiveNumber
                  type={NumberType.BALANCE}
                  value={unclaimedDividend}
                  decimalSubLen={2}
                  className="font-bold text-[15px] mx-1"
                />
                元分红，将在3-5个工作日内转入你的银行账户。
              </div>
              <button
                className="w-full bg-[#895EFF] rounded-3xl text-white py-2"
                onClick={() => {
                  Modal.clear();
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
      console.error("领取分红失败:", error);
      Toast.show({
        content: error instanceof Error ? error.message : "领取失败",
        position: "center",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleBack = () => {
    navigate("/user");
  };

  const handleSetBankInfo = () => {
    navigate("/user/exchangeStock");
  };

  return (
    <div className="px-[21px] pb-6">
      {/* 头部 */}
      <div className="flex pt-4 mb-4">
        <Button onClick={handleBack} className="p-0! rounded-2xl!">
          <img src={arrowSvg} alt="" />
        </Button>
        <span className="m-auto text-[19px] font-bold">领取分红</span>
      </div>

      {/* 股权余额卡片 */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "24px",
          padding: "20px",
          color: "#fff",
          marginBottom: "16px",
        }}
      >
        <div className="text-[12px] opacity-80">我的股权</div>
        <div className="flex items-center mt-2">
          <AdaptiveNumber
            type={NumberType.BALANCE}
            value={stockBalance}
            decimalSubLen={2}
            className="text-[26px] font-bold"
          />
        </div>
      </div>

      {/* 分红信息 */}
      <div className="bg-white rounded-2xl p-[20px] mb-4">
        <div className="text-center">
          <div className="text-[12px] text-[#7E7878] mb-2">可领取分红</div>
          <div className="flex justify-center items-baseline mb-4">
            <AdaptiveNumber
              type={NumberType.BALANCE}
              value={unclaimedDividend}
              decimalSubLen={2}
              className="text-[32px] font-bold text-[#7334FE]"
            />
            <span className="text-[16px] ml-2">元</span>
          </div>

          <Button
            disabled={Number(unclaimedDividend) <= 0 || isClaiming}
            loading={isClaiming}
            onClick={handleClaimDividend}
            className="w-full bg-[#7334FE]! rounded-2xl! py-3! text-white! border-none! text-[15px]! font-bold!"
          >
            {isClaiming ? "领取中..." : "确认领取"}
          </Button>
        </div>
      </div>

      {/* 银行信息 */}
      <div className="bg-white rounded-2xl p-[20px]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[15px] font-bold">收款信息</div>
          <button
            onClick={handleSetBankInfo}
            className="text-[#7334FE] text-[13px]"
          >
            {bankInfo.bankName ? "修改" : "设置"}
          </button>
        </div>

        {bankInfo.bankName ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#7334FE">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[#7E7878]">持卡人</div>
                <div className="text-[14px] font-bold">{bankInfo.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#7334FE">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[#7E7878]">开户银行</div>
                <div className="text-[14px] font-bold">{bankInfo.bankName}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#7334FE">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-[#7E7878]">银行卡号</div>
                <div className="text-[14px] font-bold">
                  {bankInfo.bankCardNumber.replace(/(\d{4})/g, "$1 ")}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-[#999] text-[14px] mb-3">暂未设置收款信息</div>
            <button
              onClick={handleSetBankInfo}
              className="text-[#7334FE] text-[14px] font-bold"
            >
              立即设置 →
            </button>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-4 bg-[#FFF9E6] rounded-2xl p-4">
        <div className="text-[12px] text-[#8B7355] leading-relaxed">
          💡 分红说明：
          <br />
          • 分红将在3-5个工作日内转入你的银行账户
          <br />
          • 请确保银行信息准确无误
          <br />• 分红金额根据持有股权比例计算
        </div>
      </div>
    </div>
  );
};

export default ClaimDividend;
