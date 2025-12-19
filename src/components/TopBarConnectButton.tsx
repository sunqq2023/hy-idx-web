import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMimirList } from "@/hooks/useMimirList";
import classNames from "classnames";
import { useState } from "react";
import BindPhoneModal from "./BindPhoneModal";

interface TopBarConnectButtonProps {
  isStudio?: boolean;
}

const TopBarConnectButton = ({
  isStudio = false,
}: TopBarConnectButtonProps) => {
  const { isConnected, isMimir } = useMimirList();
  const [showBindModal, setShowBindModal] = useState(false);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        const effectiveConnected = connected && isConnected && !isMimir;
        return (
          <div
            className="w-full flex justify-center"
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!effectiveConnected) {
                return (
                  <div
                    onClick={openConnectModal}
                    className={classNames(
                      [!effectiveConnected ? "hidden" : ""],
                      "bg-black w-[50%] rounded-3xl text-white flex justify-center py-2",
                    )}
                  >
                    连接钱包
                  </div>
                );
              }
              // if (chain.unsupported) {
              //   return (
              //     <button
              //       onClick={openChainModal}
              //       type="button"
              //       className="bg-[red] w-full rounded-3xl text-white flex justify-center py-2"
              //     >
              //       不支持的网络 请点击以切换到BSC网络
              //     </button>
              //   )
              // }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  {/* <button
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button> */}
                  <button
                    onClick={() => setShowBindModal(true)}
                    type="button"
                    className="text-[.75rem] flex items-center gap-1"
                  >
                    {isStudio && (
                      <div className="w-4 h-4 bg-[#895EFE] rounded flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          {/* 工作室图标 - 三个人形图标 */}
                          <circle cx="8" cy="6" r="2" fill="white" />
                          <path d="M6 8c0-1.1.9-2 2-2s2 .9 2 2" fill="white" />
                          <circle cx="16" cy="6" r="2" fill="white" />
                          <path d="M14 8c0-1.1.9-2 2-2s2 .9 2 2" fill="white" />
                          <circle cx="12" cy="12" r="1.5" fill="white" />
                          <path
                            d="M10.5 14c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5"
                            fill="white"
                          />
                        </svg>
                      </div>
                    )}
                    {account.displayName}
                  </button>

                  {/* 绑定手机号弹窗 */}
                  <BindPhoneModal
                    isOpen={showBindModal}
                    onClose={() => setShowBindModal(false)}
                  />
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default TopBarConnectButton;
