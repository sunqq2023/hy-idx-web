import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  getConfigByWalletChain,
  BSC_MAINNET_CONFIG,
  type ChainContractAddresses,
} from "@/constants";

/**
 * 获取当前链的合约配置
 * 会根据钱包连接的链ID动态返回对应的配置
 * 如果钱包未连接或链不支持，则返回默认配置
 */
export const useChainConfig = (): ChainContractAddresses => {
  const { isConnected, chain } = useAccount();
  const chainId = useChainId();

  const config = useMemo(() => {
    // 优先使用 account.chain.id（钱包实际连接的链）
    // 而不是 useChainId()（可能是 wagmi 配置的默认链）
    const actualChainId = isConnected && chain?.id ? chain.id : chainId;

    console.log(`🔍 useChainConfig - Debug info:`, {
      isConnected,
      "chain?.id": chain?.id,
      chainId,
      actualChainId,
      "chain object": chain,
    });

    // 如果钱包已连接，使用钱包的链配置
    if (isConnected && actualChainId) {
      // 获取 RPC URL（用于区分主网和 Anvil Fork）
      const rpcUrl =
        chain?.rpcUrls?.default?.http?.[0] ||
        (import.meta.env.VITE_RPC_URL as string | undefined);

      const walletConfig = getConfigByWalletChain(actualChainId, rpcUrl);
      if (walletConfig) {
        console.log(`✅ Using chain config for Chain ID: ${actualChainId}`, {
          STORAGE_ADDRESS: walletConfig.STORAGE_ADDRESS,
          NODE_SYSTEM_ADDRESS: walletConfig.NODE_SYSTEM_ADDRESS,
          rpcUrl: rpcUrl || "N/A",
        });
        return walletConfig;
      }
      console.warn(
        `⚠️ Chain ID ${actualChainId} not supported, using default config`
      );
    } else {
      console.log(`⚠️ Wallet not connected, using default config`);
    }

    // 否则返回默认配置（BSC 主网）
    // 注意：钱包未连接时使用主网配置，连接后会自动切换到对应链的配置
    console.log(`📋 Using default config (BSC Mainnet):`, {
      STORAGE_ADDRESS: BSC_MAINNET_CONFIG.STORAGE_ADDRESS,
    });
    return BSC_MAINNET_CONFIG;
  }, [isConnected, chain, chainId]);

  return config;
};

/**
 * 获取指定链的合约地址
 * @param contractName 合约名称
 * @returns 合约地址
 */
export const useContractAddress = (
  contractName: keyof ChainContractAddresses
): string => {
  const config = useChainConfig();
  return config[contractName] as string;
};

/**
 * 获取所有合约地址（便捷方法）
 * 返回当前链的所有合约地址，可以直接解构使用
 *
 * @example
 * const { STORAGE_ADDRESS, LOGIC_ADDRESS } = useContractAddresses();
 */
export const useContractAddresses = () => {
  const config = useChainConfig();
  return {
    STORAGE_ADDRESS: config.STORAGE_ADDRESS,
    LOGIC_ADDRESS: config.LOGIC_ADDRESS,
    PRODUCTION_LOGIC_ADDRESS: config.PRODUCTION_LOGIC_ADDRESS,
    HISTORY_ADDRESS: config.HISTORY_ADDRESS,
    NODE_SYSTEM_ADDRESS: config.NODE_SYSTEM_ADDRESS,
    EXTEND_STORAGE_ADDRESS: config.EXTEND_STORAGE_ADDRESS,
    EXTEND_LOGIC_ADDRESS: config.EXTEND_LOGIC_ADDRESS,
    EXTEND_HISTORY_ADDRESS: config.EXTEND_HISTORY_ADDRESS,
    SELLUSER_MANAGER_ADDRESS: config.SELLUSER_MANAGER_ADDRESS,
    IDX_TOKEN: config.IDX_TOKEN,
    USDT_TOKEN: config.USDT_TOKEN,
    IDX_USDT_PAIR: config.IDX_USDT_PAIR,
    ALLOWANCE_QUOTA: config.ALLOWANCE_QUOTA,
  };
};

export default useChainConfig;
