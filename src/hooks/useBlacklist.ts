import { useAccount } from "wagmi";
import { useMemo } from "react";

const BLACKLIST_ADDRESSES: string[] = [
  "0x64239ae99d44507Ad0686873755F36e9e489A4B7",
  "0x2F680EB86a6872db0a3f808CCFFDD0Fd8A51726F",
  "0x68df50bd247dDEe64a18caa7a5d52CB5d191bfEf",
  "0x340e9A7ad5fcc718b49DF6b5ab5fC3c2fa5CCA8e",
  "0x9F9c5486e39052199AbAb6dEB57e6ddc7F027AD2",
  "0x4ae443C2e624970950D34d534c984cfFdF25786c",
  "0x24ADDa299c4C4940b31b26A46467D4312ba4D723",
  "0xB378Af5c9110083B45564B8Ff74804601b12a25F",
];

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
