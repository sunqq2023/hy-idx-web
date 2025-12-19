/**
 * 调试工具
 * 根据 VITE_DEBUG 环境变量控制日志输出
 */

const isDebugMode = import.meta.env.VITE_DEBUG === "true";

/**
 * 调试日志 - 只在开启调试模式时输出
 */
export const debugLog = (...args: any[]) => {
  if (isDebugMode) {
    console.log("[DEBUG]", ...args);
  }
};

/**
 * 调试信息 - 只在开启调试模式时输出
 */
export const debugInfo = (...args: any[]) => {
  if (isDebugMode) {
    console.info("[INFO]", ...args);
  }
};

/**
 * 调试警告 - 只在开启调试模式时输出
 */
export const debugWarn = (...args: any[]) => {
  if (isDebugMode) {
    console.warn("[WARN]", ...args);
  }
};

/**
 * 错误日志 - 始终输出（即使不在调试模式）
 */
export const debugError = (...args: any[]) => {
  console.error("[ERROR]", ...args);
};

/**
 * 性能计时器
 */
export class DebugTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    if (isDebugMode) {
      console.log(`[TIMER] ${label} - Started`);
    }
  }

  end() {
    if (isDebugMode) {
      const duration = performance.now() - this.startTime;
      console.log(
        `[TIMER] ${this.label} - Completed in ${duration.toFixed(2)}ms`,
      );
    }
  }
}

/**
 * 合约调用日志
 */
export const debugContract = {
  read: (contractName: string, functionName: string, args?: any[]) => {
    if (isDebugMode) {
      console.group(`📖 [CONTRACT READ] ${contractName}.${functionName}`);
      if (args && args.length > 0) {
        console.log("Arguments:", args);
      }
      console.groupEnd();
    }
  },

  write: (contractName: string, functionName: string, args?: any[]) => {
    if (isDebugMode) {
      console.group(`✍️ [CONTRACT WRITE] ${contractName}.${functionName}`);
      if (args && args.length > 0) {
        console.log("Arguments:", args);
      }
      console.groupEnd();
    }
  },

  result: (contractName: string, functionName: string, result: any) => {
    if (isDebugMode) {
      console.group(`✅ [CONTRACT RESULT] ${contractName}.${functionName}`);
      console.log("Result:", result);
      console.groupEnd();
    }
  },

  error: (contractName: string, functionName: string, error: any) => {
    console.group(`❌ [CONTRACT ERROR] ${contractName}.${functionName}`);
    console.error("Error:", error);
    console.groupEnd();
  },
};

/**
 * 网络请求日志
 */
export const debugNetwork = {
  request: (url: string, method: string, data?: any) => {
    if (isDebugMode) {
      console.group(`🌐 [NETWORK REQUEST] ${method} ${url}`);
      if (data) {
        console.log("Data:", data);
      }
      console.groupEnd();
    }
  },

  response: (url: string, status: number, data?: any) => {
    if (isDebugMode) {
      console.group(`📥 [NETWORK RESPONSE] ${status} ${url}`);
      if (data) {
        console.log("Data:", data);
      }
      console.groupEnd();
    }
  },

  error: (url: string, error: any) => {
    console.group(`❌ [NETWORK ERROR] ${url}`);
    console.error("Error:", error);
    console.groupEnd();
  },
};

/**
 * 状态变化日志
 */
export const debugState = (
  componentName: string,
  stateName: string,
  value: any,
) => {
  if (isDebugMode) {
    console.log(`🔄 [STATE] ${componentName}.${stateName}:`, value);
  }
};

/**
 * 链配置日志
 */
export const debugChain = {
  config: (chainId: number, config: any) => {
    if (isDebugMode) {
      console.group(`⛓️ [CHAIN CONFIG] Chain ID: ${chainId}`);
      console.log("Config:", config);
      console.groupEnd();
    }
  },

  switch: (fromChainId: number, toChainId: number) => {
    if (isDebugMode) {
      console.log(`⛓️ [CHAIN SWITCH] ${fromChainId} → ${toChainId}`);
    }
  },
};

/**
 * 检查是否开启调试模式
 */
export const isDebug = () => isDebugMode;

/**
 * 默认导出
 */
export default {
  log: debugLog,
  info: debugInfo,
  warn: debugWarn,
  error: debugError,
  contract: debugContract,
  network: debugNetwork,
  state: debugState,
  chain: debugChain,
  Timer: DebugTimer,
  isDebug,
};
