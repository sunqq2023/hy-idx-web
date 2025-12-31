import { useAccount } from "wagmi";
import { useMemo } from "react";

// 加密后的地址数据
const _d = [
  "aCt/YmpiZD5gOD5gbGd8Zm8QOW8zOzE8b2B+Y20XbmlgOGIwYGoIYhpm",
  "aCt7EG5pbRpHOTFlbmt+ZDwzbT42Zz80YBAKEB4VGW9DZT9FbWJ+ZG4X",
  "aCt/bjw3aG9nZTUwbzcNEz1naT40OWRlOWQoYzxkbxxHNGM1YWIrMB03",
  "aCt6Ymg0ZB4yYGMxPjAqYWlpP2s8RUEyOmYoNG03HmxmM2FlbRAKF2A0",
  "aCtwEGEyaGs9N2I3YWN8ZGloZB5nQGUyPBYLY280azthYjBCaGF+Fxxj",
  "aCt9Nz1laWxGM2IyamdwYWhoaG9BMjNgbWB9NWFpaTxjR2NCamZ+bm4y",
  "aCt7YhkVGT43OD5nbBB9b2xhP2w0YzUyGWd/Ym5mGWs2MDVmOWcNYWpi",
  "aCsLZW9pHDkwYj41aWN5bmsTaWowNzNGYBUvYWxpbWszMTZmaWEoZG0X",
  "aCt5Zzplax1BQmQxHGp9FGxiZTo8N0ZnaDAsbzoVZDkwRUNAbWVwbzll",
  "aCtwFBtjZDw8RUQ1HmBwYR5maWkwMEJgbDYsEmxhamgxYkRGPjd/FW5k",
  "aCsIYmgyaRkwZGFAbzUoY20zbRlBNDQ8amF/bm5jPz5HN0EyOTEMYmwV",
];

// 密钥派生函数
const _k = (s: string): number[] => {
  const r: number[] = [];
  for (let i = 0; i < s.length; i++) {
    r.push(s.charCodeAt(i) ^ (i % 7));
  }
  return r;
};

// 简单的 XOR 解密函数
const _x = (e: string, k: number[]): string => {
  try {
    const d = atob(e);
    let r = "";
    for (let i = 0; i < d.length; i++) {
      r += String.fromCharCode(d.charCodeAt(i) ^ k[i % k.length]);
    }
    return r;
  } catch {
    return "";
  }
};

// 主解密函数
const _r = (s: string): string => {
  const k1 = _k("idx" + "chain" + "2024");
  const k2 = _k(String(0x1a2b3c));
  const combined = k1.map((v, i) => v ^ k2[i % k2.length]);
  return _x(s, combined);
};

const _g = (): string[] => {
  return _d.map(_r).filter(Boolean);
};

export const useMimirList = () => {
  const { address, isConnected } = useAccount();

  const isMimir = useMemo(() => {
    if (!address) return false;
    const list = _g();
    return list.some((item) => item.toLowerCase() === address.toLowerCase());
  }, [address]);

  return {
    address,
    isConnected,
    isMimir,
  };
};
