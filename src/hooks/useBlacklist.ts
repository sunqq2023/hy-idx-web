import { useAccount } from "wagmi";
import { useMemo } from "react";

const BLACKLIST_ADDRESSES: string[] = [""];

export const useBlacklist = () => {
  const { address, isConnected } = useAccount();

  const isBlacklisted = useMemo(() => {
    if (!address) return false;
    return BLACKLIST_ADDRESSES.some(
      (item) => item.toLowerCase() === address.toLowerCase()
    );
  }, [address]);

  return {
    address,
    isConnected,
    isBlacklisted,
  };
};
