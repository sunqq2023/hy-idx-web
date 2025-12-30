import { Modal } from "antd-mobile";

interface BindWalletModalProps {
  visible: boolean;
  mallAccount: string; // 商城账号
  onReject: () => void; // 拒绝回调
  onAgree: () => void; // 同意回调
  onClose?: () => void; // 关闭回调
}

export const BindWalletModal = ({
  visible,
  mallAccount,
  onReject,
  onAgree,
  onClose,
}: BindWalletModalProps) => {
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
      content={
        <div className="flex flex-col">
          {/* 标题 */}
          <div className="text-white text-lg font-semibold mb-5">绑定提示:</div>

          {/* 内容 */}
          <div className="text-white text-sm leading-6 mb-8">
            商城账号:{" "}
            <span className="font-medium text-white">{mallAccount}</span>
            <br />
            <span className="mt-2 block">
              正在申请绑定你的钱包地址, 请确认是否是你本人发起, 若不是, 请拒绝;
              若是, 请同意!
            </span>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onReject();
                onClose?.();
              }}
              className="flex-1 py-3.5 bg-[#2A2A2A] text-white rounded-xl text-base font-medium active:opacity-80 transition-opacity"
            >
              拒绝
            </button>
            <button
              onClick={() => {
                onAgree();
                onClose?.();
              }}
              className="flex-1 py-3.5 bg-[#895EFE] text-white rounded-xl text-base font-medium active:opacity-80 transition-opacity"
            >
              同意
            </button>
          </div>
        </div>
      }
      bodyStyle={{
        borderRadius: "20px",
        backgroundColor: "#1A1A1A",
        padding: "20px 24px 24px",
        width: "90%",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    />
  );
};
