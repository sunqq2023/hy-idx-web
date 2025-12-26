/**
 * 黑名单地址列表
 * 这些地址不允许绑定商城账号
 *
 * 注意：
 * 1. 地址会自动转换为小写进行比较
 * 2. 添加新地址时请确保格式正确（0x开头的以太坊地址）
 * 3. 可以添加注释说明为什么该地址被列入黑名单
 */

export const BOUND_BLACKLIST_ADDRESSES = [
  // 平台钱包地址
  "0x5cdd0bd68efbad927dd02e9cb354f4ec3b201476",

  // previous admin
  "0x8247bc1891c58b11677a199dc31e91f32758c462",

  // now admin
  "0x6ce34e9291374e11142c261996d048f56bfcae3c",

  // IDX_USDT Pair(PancakeSwap)
  "0xcc9a8c340d9c57e31b411dfdcc41e571f23b9bb8",

  // IDX 合约地址
  "0xc98f60b3f98e8bf860436746db637e13b0e17458",

  // USDT 合约地址
  "0x55d398326f99059ff775485246999027b3197955",

  // 历史记录合约地址
  "0x367f5fae08dc307b3ac8a9a7aa26ac3005c6b51f",

  // 扩展的历史合约地址
  "0x6e426afed0cf32d6e00b29c791199441658e4f73",

  // 节点合成合约地址
  "0xf080f93067f52843231b13ff5024d41767898bc8",

  // 生产合约地址
  "0x90531429c182707190de682ed345e3577d44c3d6",

  // 逻辑合约地址
  "0x895e8b68d93b2cd5ff4f2bf22ccb3697235c7afd",

  // 扩展的逻辑合约地址
  "0xfa5ea849e045520996725d13c3160d1d5420078e",

  // 数据存储合约地址
  "0xb256459d072a52e668b8a86a7cbff9c475ec98c2",

  // 扩展的数据存储合约地址
  "0xdc567714763206341ac1d90c0d2fc58c57739412",

  // 挂售合约
  "0x8e10b9ba4c78fe8d6a2ecf3fa6307f5e6c1ceebe",

  // Mix Operator
  "0x1cea1dc56Be6ab13Ad590Ff367c3Af375DA98A7d",
];

/**
 * 检查地址是否在黑名单中
 * @param address 要检查的地址
 * @returns 如果在黑名单中返回 true，否则返回 false
 */
export const isAddressBlacklisted = (address: string): boolean => {
  return BOUND_BLACKLIST_ADDRESSES.map((addr) => addr.toLowerCase()).includes(
    address.toLowerCase(),
  );
};
