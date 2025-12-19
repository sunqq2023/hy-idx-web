import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Toast, Popup } from "antd-mobile";
import { closeSvg } from "@/assets";
import {
  MiningMachineNodeSystemAddress,
  MiningMachineNodeSystemABI,
} from "@/constants";

// API URL
// 生产环境使用实际 API 地址，开发环境使用代理
const API_URL =
  import.meta.env.MODE === "production" ? "https://www.ihealth.vip" : "/api";

// 缓存键名
const PHONE_CACHE_KEY = "user_phone_cache";

// 发送验证码 API
const sendVerificationCode = async (phoneNumber: string) => {
  const response = await fetch(API_URL + "/wx/sendVerificationCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: "hy2025666",
      timestamp: Date.now(),
      phoneNumber: phoneNumber,
      businessType: "BOUND_WALLET",
    }),
  });

  if (!response.ok) {
    throw new Error("发送验证码失败");
  }

  return await response.json();
};

// 绑定手机号 API
const bindPhone = async (phone: string, code: string, address: string) => {
  const response = await fetch(API_URL + "/mix/boundUserPhoneWithCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: phone,
      code: code,
      address: address,
    }),
  });

  if (!response.ok) {
    throw new Error("绑定失败");
  }

  return await response.json();
};

// 从缓存读取电话号码
const getPhoneFromCache = (address: string): string | null => {
  try {
    const cache = localStorage.getItem(PHONE_CACHE_KEY);
    if (cache) {
      const cacheData = JSON.parse(cache);
      return cacheData[address.toLowerCase()] || null;
    }
  } catch (error) {
    console.error("读取缓存失败:", error);
  }
  return null;
};

// 保存电话号码到缓存
const savePhoneToCache = (address: string, phone: string) => {
  try {
    const cache = localStorage.getItem(PHONE_CACHE_KEY);
    const cacheData = cache ? JSON.parse(cache) : {};
    cacheData[address.toLowerCase()] = phone;
    localStorage.setItem(PHONE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("保存缓存失败:", error);
  }
};

interface BindPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BindPhoneModal = ({ isOpen, onClose }: BindPhoneModalProps) => {
  const { address } = useAccount();
  const [phone, setPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);

  // 错误信息状态
  const [phoneError, setPhoneError] = useState("");
  const [verifyCodeError, setVerifyCodeError] = useState("");

  // 从链上读取电话号码
  const { refetch: refetchPhone } = useReadContract({
    address: MiningMachineNodeSystemAddress as `0x${string}`,
    abi: MiningMachineNodeSystemABI,
    functionName: "getUserPhone",
    args: address ? [address] : undefined,
    query: {
      enabled: false, // 手动触发
    },
  });

  // 弹窗打开时加载电话号码
  useEffect(() => {
    if (isOpen && address) {
      loadPhoneNumber();
    }
  }, [isOpen, address]);

  // 加载电话号码（先从缓存，再从链上）
  const loadPhoneNumber = async () => {
    if (!address) return;

    setIsLoadingPhone(true);
    try {
      // 1. 先从缓存读取
      const cachedPhone = getPhoneFromCache(address);
      if (cachedPhone) {
        console.log("从缓存读取电话号码:", cachedPhone);
        setPhone(cachedPhone);
        setIsLoadingPhone(false);
        return;
      }

      // 2. 缓存没有，从链上读取
      console.log("从链上读取电话号码...");
      const result = await refetchPhone();
      const chainPhone = result.data as string;

      if (chainPhone && chainPhone.trim()) {
        console.log("从链上读取电话号码:", chainPhone);
        setPhone(chainPhone);
        // 保存到缓存
        savePhoneToCache(address, chainPhone);
      }
    } catch (error) {
      console.error("加载电话号码失败:", error);
    } finally {
      setIsLoadingPhone(false);
    }
  };

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 验证手机号
  const validatePhone = (phoneNumber: string): boolean => {
    if (!phoneNumber) {
      setPhoneError("请输入手机号");
      return false;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError("请输入正确的手机号格式");
      return false;
    }

    setPhoneError("");
    return true;
  };

  // 验证验证码
  const validateVerifyCode = (code: string): boolean => {
    if (!code) {
      setVerifyCodeError("请输入验证码");
      return false;
    }

    if (code.length !== 6) {
      setVerifyCodeError("验证码必须是6位数字");
      return false;
    }

    setVerifyCodeError("");
    return true;
  };

  // 手机号输入变化
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    setPhone(cleaned);
    if (phoneError) {
      setPhoneError("");
    }
  };

  // 验证码输入变化
  const handleVerifyCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setVerifyCode(cleaned);
    if (verifyCodeError) {
      setVerifyCodeError("");
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendVerificationCode(phone);
      console.log("验证码发送结果:", result);

      Toast.show({ content: "验证码已发送", icon: "success" });
      setCountdown(60);
    } catch (error) {
      console.error("发送验证码失败:", error);
      Toast.show({
        content:
          error instanceof Error ? error.message : "发送验证码失败，请重试",
        icon: "fail",
      });
    } finally {
      setIsSending(false);
    }
  };

  // 绑定手机号
  const handleBind = async () => {
    const isPhoneValid = validatePhone(phone);
    const isCodeValid = validateVerifyCode(verifyCode);

    if (!isPhoneValid || !isCodeValid) {
      return;
    }

    if (!address) {
      Toast.show({ content: "请先连接钱包", icon: "fail" });
      return;
    }

    try {
      // 调用绑定手机号的 API
      const result = await bindPhone(phone, verifyCode, address);
      console.log("绑定结果:", result);

      // 绑定成功后保存到缓存
      savePhoneToCache(address, phone);

      Toast.show({ content: "绑定成功", icon: "success" });
      onClose();

      // 重置表单
      setPhone("");
      setVerifyCode("");
      setCountdown(0);
      setPhoneError("");
      setVerifyCodeError("");
    } catch (error) {
      console.error("绑定失败:", error);
      Toast.show({
        content: error instanceof Error ? error.message : "绑定失败，请重试",
        icon: "fail",
      });
    }
  };

  return (
    <Popup
      visible={isOpen}
      onClose={onClose}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        minHeight: "420px",
      }}
      destroyOnClose
      showCloseButton={false}
    >
      <div className="flex flex-col p-6 pb-8 min-h-[420px]">
        {/* 标题和关闭按钮 */}
        <div className="relative flex items-center justify-center mb-8">
          <h2 className="text-xl font-bold text-black">绑定商城账号</h2>
          <img
            src={closeSvg}
            className="absolute right-0 w-4 h-4 cursor-pointer"
            onClick={onClose}
            alt="关闭"
          />
        </div>

        {/* 加载提示 */}
        {isLoadingPhone && (
          <div className="text-center text-gray-500 text-sm mb-4">
            正在加载电话号码...
          </div>
        )}

        {/* 手机号输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            手机号
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="请输入手机号"
            maxLength={11}
            disabled={isLoadingPhone}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-black disabled:bg-gray-100 ${
              phoneError ? "border-red-500" : "border-gray-300"
            }`}
          />
          {phoneError && (
            <p className="text-red-500 text-sm mt-2">{phoneError}</p>
          )}
        </div>

        {/* 验证码输入和发送按钮 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            验证码
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => handleVerifyCodeChange(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-black ${
                  verifyCodeError ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            <button
              onClick={handleSendCode}
              disabled={countdown > 0 || isSending || !phone || isLoadingPhone}
              className="px-4 py-3 bg-black text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors whitespace-nowrap text-sm"
            >
              {countdown > 0
                ? `${countdown}秒`
                : isSending
                  ? "发送中..."
                  : "发送验证码"}
            </button>
          </div>
          {verifyCodeError && (
            <p className="text-red-500 text-sm mt-2">{verifyCodeError}</p>
          )}
        </div>

        {/* 绑定按钮 */}
        <button
          onClick={handleBind}
          disabled={!phone || !verifyCode || isLoadingPhone}
          className="w-full py-3 bg-black text-white rounded-xl font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors mb-4"
        >
          绑定
        </button>

        {/* 提示信息 */}
        <p className="text-xs text-gray-500 text-center">
          绑定后可使用手机号登录商城
        </p>
      </div>
    </Popup>
  );
};

export default BindPhoneModal;
