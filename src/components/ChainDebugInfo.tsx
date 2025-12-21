import { useAccount, useChainId } from "wagmi";
import { useChainConfig } from "@/hooks/useChainConfig";

/**
 * Debug component to show current chain information
 * Add this to your page to see what chain is detected
 */
export const ChainDebugInfo = () => {
  const { isConnected, chain, address } = useAccount();
  const chainId = useChainId();
  const chainConfig = useChainConfig();

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
        🔍 Chain Debug Info
      </div>
      <div>Wallet Connected: {isConnected ? "✅ Yes" : "❌ No"}</div>
      <div>
        Address:{" "}
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A"}
      </div>
      <div>Chain ID (useChainId): {chainId}</div>
      <div>Chain ID (account.chain): {chain?.id || "N/A"}</div>
      <div>Chain Name: {chain?.name || "N/A"}</div>
      <div
        style={{
          marginTop: "5px",
          paddingTop: "5px",
          borderTop: "1px solid #666",
        }}
      >
        <div style={{ fontWeight: "bold" }}>Using Config:</div>
        <div>Storage: {chainConfig.STORAGE_ADDRESS.slice(0, 10)}...</div>
        <div>
          Node System: {chainConfig.NODE_SYSTEM_ADDRESS.slice(0, 10)}...
        </div>
      </div>
    </div>
  );
};

export default ChainDebugInfo;
