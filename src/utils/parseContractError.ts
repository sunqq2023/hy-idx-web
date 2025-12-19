import { BaseError } from "viem";

/**
 * 自定义错误类型映射（中文错误信息）
 */
const ERROR_MESSAGES: Record<string, string> = {
  PhoneEmpty: "手机号不能为空",
  UserAddressEmpty: "用户地址不能为空",
  PhoneAlreadyBound: "手机号已被绑定",
  AddressAlreadyBound: "地址已被绑定",
  PhoneNotBound: "手机号未绑定",
  NewPhoneAlreadyBound: "新手机号已被绑定",
  SameAddress: "地址相同，无法操作",
  ZeroAddress: "地址不能为零地址",
  InvalidAmount: "金额必须大于0",
  InsufficientBalance: "余额不足",
};

/**
 * 解析合约自定义错误
 * @param error 错误对象
 * @returns 解析后的错误信息
 */
type ErrorArg = string | bigint | `0x${string}`;

export function parseContractError(error: unknown): {
  errorName: string | null;
  errorMessage: string;
  errorArgs?: ErrorArg[];
} {
  // 处理 viem 错误
  if (error instanceof BaseError) {
    // 尝试从 shortMessage 中提取错误信息
    const shortMessage = error.shortMessage || "";

    // 检查是否是自定义错误
    // viem 会将自定义错误包装在错误消息中，格式通常是 "execution reverted: ErrorName(...)"
    const customErrorMatch = shortMessage.match(
      /execution reverted: (\w+)(?:\((.*?)\))?/
    );

    if (customErrorMatch) {
      const errorName = customErrorMatch[1];
      const argsString = customErrorMatch[2];

      // 解析参数（如果有）
      let errorArgs: ErrorArg[] = [];
      if (argsString) {
        try {
          // 尝试解析参数（可能是地址、字符串等）
          errorArgs = parseErrorArgs(argsString);
        } catch (e) {
          console.warn("Failed to parse error args:", e);
        }
      }

      // 获取中文错误信息
      const errorMessage = ERROR_MESSAGES[errorName] || errorName;

      // 如果有参数，添加到错误信息中
      let finalMessage = errorMessage;
      if (errorArgs.length > 0) {
        if (
          errorName === "PhoneAlreadyBound" ||
          errorName === "NewPhoneAlreadyBound"
        ) {
          finalMessage = `${errorMessage}: ${errorArgs[0]}`;
        } else if (errorName === "AddressAlreadyBound") {
          finalMessage = `${errorMessage}: ${errorArgs[0]}`;
        } else if (errorName === "PhoneNotBound") {
          finalMessage = `${errorMessage}: ${errorArgs[0]}`;
        } else if (errorName === "InsufficientBalance") {
          finalMessage = `${errorMessage} (账户: ${errorArgs[0]}, 需要: ${errorArgs[1]}, 可用: ${errorArgs[2]})`;
        }
      }

      return {
        errorName,
        errorMessage: finalMessage,
        errorArgs,
      };
    }

    // 如果不是自定义错误，返回原始错误消息
    return {
      errorName: null,
      errorMessage: shortMessage || error.message || "未知错误",
    };
  }

  // 处理普通 Error 对象
  if (error instanceof Error) {
    // 尝试从消息中提取错误信息
    const message = error.message || "";
    const customErrorMatch = message.match(
      /execution reverted: (\w+)(?:\((.*?)\))?/
    );

    if (customErrorMatch) {
      const errorName = customErrorMatch[1];
      const errorMessage = ERROR_MESSAGES[errorName] || errorName;
      return {
        errorName,
        errorMessage,
      };
    }

    return {
      errorName: null,
      errorMessage: message,
    };
  }

  // 处理其他类型的错误
  return {
    errorName: null,
    errorMessage: String(error),
  };
}

/**
 * 解析错误参数
 */
function parseErrorArgs(argsString: string): ErrorArg[] {
  const args: ErrorArg[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      continue;
    }

    if (inString && char === stringChar) {
      inString = false;
      args.push(current);
      current = "";
      continue;
    }

    if (inString) {
      current += char;
      continue;
    }

    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      if (current.trim()) {
        args.push(parseValue(current.trim()));
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(parseValue(current.trim()));
  }

  return args;
}

/**
 * 解析单个值
 */
function parseValue(value: string): ErrorArg {
  // 地址
  if (value.startsWith("0x") && value.length === 42) {
    return value;
  }

  // 数字
  if (/^\d+$/.test(value)) {
    return BigInt(value);
  }

  // 字符串（去掉引号）
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

/**
 * 获取用户友好的错误消息
 */
export function getFriendlyErrorMessage(error: unknown): string {
  const parsed = parseContractError(error);
  return parsed.errorMessage;
}
