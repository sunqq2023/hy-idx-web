import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

const CustomConnectButton = () => {
  const { address } = useAccount();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        const blacklistAddresses: string[] = [
          "0xF5C1d985C52aE8cB0Ab7a642E378089eF15D9300",
        ];
        const effectiveConnected =
          connected && !blacklistAddresses.includes(address ?? "");
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
                    className="bg-black w-full rounded-3xl text-white flex justify-center py-2"
                  >
                    连接钱包
                  </div>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-[red] w-full rounded-3xl text-white flex justify-center py-2"
                  >
                    不支持的网络 请点击以切换到BSC网络
                  </button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={openChainModal}
                    style={{ display: "flex", alignItems: "center" }}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: "hidden",
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>
                  <button onClick={openAccountModal} type="button">
                    {account.displayName}
                    {/* {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''} */}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
