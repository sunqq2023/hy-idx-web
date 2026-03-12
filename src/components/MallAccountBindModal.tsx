import { Button, Input, Modal } from "antd-mobile";
import React, { useEffect, useMemo, useState } from "react";

interface MallAccountBindModalProps {
  visible: boolean;
  address?: string;
  boundPhone?: string;
  onClose: () => void;
  onBind: (params: { phone: string; smsCode: string }) => Promise<void>;
  onUnbind: () => Promise<void>;
  onSendSmsCode: (phone: string) => Promise<void>;
}

export function MallAccountBindModal({
  visible,
  address,
  boundPhone,
  onClose,
  onBind,
  onUnbind,
  onSendSmsCode,
}: MallAccountBindModalProps) {
  const isBound = Boolean(boundPhone);

  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sendingSms, setSendingSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (isBound) {
      setPhone("");
      setSmsCode("");
      setCooldown(0);
    } else {
      setPhone("");
      setSmsCode("");
      setCooldown(0);
    }
    setSendingSms(false);
    setSubmitting(false);
  }, [visible, isBound]);

  useEffect(() => {
    if (!visible) return;
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [visible, cooldown]);

  const canSendSms = useMemo(() => {
    if (sendingSms) return false;
    if (cooldown > 0) return false;
    return phone.trim().length > 0;
  }, [sendingSms, cooldown, phone]);

  const sendSmsText = cooldown > 0 ? `${cooldown}s` : "发送验证码";

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnMaskClick={false}
      style={
        {
          "--min-width": "100vw",
        } as React.CSSProperties
      }
      bodyStyle={{
        borderRadius: "20px",
        backgroundColor: "#1A1A1A",
        padding: "20px 24px 24px",
        width: "90vw",
        maxWidth: "none",
        margin: "0 auto",
      }}
      content={
        <div className="flex flex-col gap-4">
          <div className="text-white text-lg font-semibold text-center">
            {isBound ? "已绑定账号" : "绑定账号"}
          </div>

          {isBound && (
            <div className="text-white text-sm leading-6">
              <div>钱包地址:</div>
              <div className="font-medium break-all mt-1">{address || "-"}</div>
              <div className="mt-1">
                手机号: <span className="font-medium">{boundPhone}</span>
              </div>
            </div>
          )}

          {!isBound && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="text-white text-sm">手机号</div>
                <Input
                  value={phone}
                  onChange={setPhone}
                  placeholder="请输入手机号"
                  type="tel"
                  clearable
                  className="!bg-[#f3f3f3] rounded-2xl px-3 py-2"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-white text-sm">验证码</div>
                <div className="flex gap-2 items-center">
                  <Input
                    value={smsCode}
                    onChange={setSmsCode}
                    placeholder="请输入验证码"
                    type="number"
                    clearable
                    className="!bg-[#f3f3f3] rounded-2xl px-3 py-2 flex-1"
                  />
                  <Button
                    size="small"
                    disabled={!canSendSms}
                    loading={sendingSms}
                    onClick={async () => {
                      const p = phone.trim();
                      if (!p) return;
                      try {
                        setSendingSms(true);
                        await onSendSmsCode(p);
                        setCooldown(60);
                      } finally {
                        setSendingSms(false);
                      }
                    }}
                    className="!rounded-2xl"
                  >
                    {sendSmsText}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              block
              onClick={onClose}
              className="flex-1 !rounded-2xl !bg-[#2A2A2A] !text-white !border-none"
            >
              取消
            </Button>
            <Button
              block
              loading={submitting}
              onClick={async () => {
                try {
                  setSubmitting(true);
                  if (isBound) {
                    await onUnbind();
                  } else {
                    await onBind({ phone: phone.trim(), smsCode: smsCode.trim() });
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
              className="flex-1 !rounded-2xl !bg-[#895EFE] !text-white !border-none"
            >
              {isBound ? "解绑" : "绑定"}
            </Button>
          </div>
        </div>
      }
    />
  );
}

