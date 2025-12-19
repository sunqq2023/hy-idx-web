import { useMemo } from "react";
import { useChainId } from "wagmi";
import {
  getConfigByWalletChain,
  getCurrentChainConfig,
  type ChainContractAddresses,
} from "@/constants/chainConfig";

/**
 * 获取当前链的合约配置
 * 会根据钱包连接的链ID动态返回对应的配置
 * 如果钱包未连接或链不支持，则返回环境变量配置
 */
export const useChainConfig = (): ChainContractAddresses => {
  const chainId = useChainId();

  const config = useMemo(() => {
    // 如果钱包已连接，尝试获取该链的配置
    if (chainId) {
      const walletConfig = getConfigByWalletChain(chainId);
      if (walletConfig) {
        return walletConfig;
      }
    }

    // 否则返回当前环境配置
    return getCurrentChainConfig();
  }, [chainId]);

  return config;
};

/**
 * 获取指定链的合约地址
 * @param contractName 合约名称
 * @returns 合约地址
 */
export const useContractAddress = (
  contractName: keyof ChainContractAddresses,
): string => {
  const config = useChainConfig();
  return config[contractName] as string;
};

export default useChainConfig;
