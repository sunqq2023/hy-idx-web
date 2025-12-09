import { useAccount } from "wagmi";
import { useMemo } from "react";

// 使用 Base64 编码的地址片段，运行时解码和重组
const _d = [
  "MHg2NDIzOWFlOTlkNDQ1MDdBZDA2ODY4NzM3NTVGMzZlOWU0ODlBNEI3",
  "MHgyRjY4MEVCODZhNjg3MmRiMGEzZjgwOENDRkZERDBGZDhBNTE3MjZG",
  "MHg2OGRmNTBiZDI0N2RERWU2NGExOGNhYTdhNWQ1MkNCNWQxOTFiZkVm",
  "MHgzNDBlOUE3YWQ1ZmNjNzE4YjQ5REY2YjVhYjVmQzNjMmZhNUNDQThl",
  "MHg5RjljNTQ4NmUzOTA1MjE5OUFiQWI2ZEVCNTdlNmRkYzdGMDI3QUQy",
  "MHg0YWU0NDNDMmU2MjQ5NzA5NTBEMzRkNTM0Yzk4NGNmRmRGMjU3ODZj",
  "MHgyNEFERGEyOTljNEM0OTQwYjMxYjI2QTQ2NDY3RDQzMTJiYTRENzIz",
  "MHhCMzc4QWY1YzkxMTAwODNCNDU1NjRCOEZmNzQ4MDQ2MDFiMTJhMjVG",
  "MHgwMWI0NkJEQ2M1RDk0QjQzOGU5NkFjMGNlOWJEOWY1RERENUM5OWE0",
];

// 解码函数
const _r = (s: string): string => {
  try {
    return atob(s);
  } catch {
    return "";
  }
};

// 获取黑名单地址列表
const _g = (): string[] => {
  return _d.map(_r).filter(Boolean);
};

export const useBlacklist = () => {
  const { address, isConnected } = useAccount();

  const isBlacklisted = useMemo(() => {
    if (!address) return false;
    const list = _g();
    return list.some((item) => item.toLowerCase() === address.toLowerCase());
  }, [address]);

  return {
    address,
    isConnected,
    isBlacklisted,
  };
};
