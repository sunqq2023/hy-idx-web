// 股权系统类型定义

export interface StockSystemConfig {
  maxStockSupply: bigint;
  totalStockIssued: bigint;
  mixToStockRate: bigint;
  exchangeEnabled: boolean;
  remainingStock: bigint;
}

export interface UserStockInfo {
  stockBalance: bigint;
  exchangeCount: number; // 需要通过事件查询
  exchangeIds: bigint[]; // 已废弃，使用事件
}

export interface ExchangePreview {
  stockAmount: bigint;
  isValid: boolean;
}

// 兑换事件类型（从区块链事件解析）
export interface ExchangeEvent {
  user: string;
  mixAmount: bigint;
  stockAmount: bigint;
  timestamp: bigint;
  transactionHash: string;
  blockNumber: bigint;
}
