import { useAccount, usePublicClient } from "wagmi";

/**
 * 获取当前使用的 RPC URL
 * 如果钱包已连接，返回钱包提供的 RPC
 * 如果未连接，返回配置的默认 RPC
 */
export const useWalletRpc = () => {
  const { isConnected, chain } = useAccount();
  const publicClient = usePublicClient();

  // 获取当前使用的 RPC URL
  const rpcUrl =
    publicClient?.transport?.url || chain?.rpcUrls?.default?.http?.[0];

  return {
    rpcUrl,
    isUsingWalletRpc: isConnected, // 如果钱包已连接，说明在使用钱包的 RPC
    chainId: chain?.id,
    chainName: chain?.name,
  };
};

export default useWalletRpc;
