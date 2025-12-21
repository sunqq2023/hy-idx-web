import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Suspense } from "react";
import { PageLoading } from "./components/PageLoading";
import ErrorBoundary from "./components/ErrorBoundary";

// 全局错误处理：静默处理 WalletConnect 和 TokenPocket 相关的常见警告
const setupGlobalErrorHandlers = () => {
  // 处理未捕获的 Promise rejection（WalletConnect 相关）
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const error = event.reason;
      const errorMessage = error?.message || error?.toString() || String(error);
      const errorName = error?.name || "";
      const errorStack = error?.stack || "";

      // 静默处理 WalletConnect 跨域安全错误
      if (
        errorName === "SecurityError" ||
        errorMessage.includes("SecurityError") ||
        errorMessage.includes("verify.walletconnect.org") ||
        errorMessage.includes(
          "Failed to read a named property 'origin' from 'Location'"
        ) ||
        errorMessage.includes("Blocked a frame with origin") ||
        errorMessage.includes("cross-origin") ||
        errorStack.includes("verify.walletconnect.org")
      ) {
        event.preventDefault();
        event.stopPropagation();
        // 可选：在开发环境下记录
        if (import.meta.env.DEV) {
          console.debug(
            "[WalletConnect] Cross-origin security warning (safe to ignore):",
            errorMessage
          );
        }
        return;
      }

      // 静默处理 TokenPocket 深度链接错误（仅限深度链接，不影响连接错误）
      if (
        errorMessage.includes("Failed to launch") &&
        (errorMessage.includes("tpoutside://") ||
          errorMessage.includes("scheme does not have a registered handler"))
      ) {
        event.preventDefault();
        event.stopPropagation();
        // 可选：在开发环境下记录
        if (import.meta.env.DEV) {
          console.debug(
            "[TokenPocket] Deep link error (safe to ignore if not using TokenPocket):",
            errorMessage
          );
        }
        return;
      }

      // 不要静默其他 TokenPocket 相关错误，让它们正常显示以便调试
      // 这样可以发现连接问题
    },
    true
  ); // 使用捕获阶段，确保优先处理

  // 处理全局错误（包括 TypeError 和 SecurityError）
  window.addEventListener(
    "error",
    (event) => {
      const errorMessage = event.message || String(event.error || "");
      const errorName = event.error?.name || "";
      const errorStack = event.error?.stack || "";
      const filename = event.filename || "";

      // 静默处理 TokenPocket 扩展尝试设置只读属性的错误
      if (
        errorName === "TypeError" &&
        (errorMessage.includes("Cannot assign to read only property") ||
          errorMessage.includes("Cannot redefine property")) &&
        (errorMessage.includes("solana") ||
          errorMessage.includes("ethereum") ||
          errorMessage.includes("tokenpocket") ||
          errorMessage.includes("tp"))
      ) {
        event.preventDefault();
        event.stopPropagation();
        // 可选：在开发环境下记录
        if (import.meta.env.DEV) {
          console.debug(
            "[TokenPocket] Property assignment warning (safe to ignore):",
            errorMessage
          );
        }
        return false;
      }

      // 静默处理 WalletConnect 跨域安全错误
      if (
        errorName === "SecurityError" ||
        errorMessage.includes("SecurityError") ||
        errorMessage.includes("verify.walletconnect.org") ||
        errorMessage.includes(
          "Failed to read a named property 'origin' from 'Location'"
        ) ||
        errorMessage.includes("Blocked a frame with origin") ||
        errorMessage.includes("cross-origin") ||
        filename.includes("verify.walletconnect.org") ||
        errorStack.includes("verify.walletconnect.org")
      ) {
        event.preventDefault();
        event.stopPropagation();
        // 可选：在开发环境下记录
        if (import.meta.env.DEV) {
          console.debug(
            "[WalletConnect] Cross-origin security warning (safe to ignore):",
            errorMessage
          );
        }
        return false;
      }
    },
    true
  ); // 使用捕获阶段，确保优先处理

  // 处理控制台错误（某些错误可能通过 console.error 输出）
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const errorString = args.map((arg) => String(arg)).join(" ");

    // 过滤掉 WalletConnect 和 TokenPocket 的已知错误
    if (
      errorString.includes("SecurityError") &&
      (errorString.includes("verify.walletconnect.org") ||
        errorString.includes("Blocked a frame") ||
        errorString.includes("cross-origin"))
    ) {
      if (import.meta.env.DEV) {
        console.debug("[WalletConnect] Filtered console error:", errorString);
      }
      return;
    }

    if (
      errorString.includes("Failed to launch") &&
      errorString.includes("tpoutside://")
    ) {
      if (import.meta.env.DEV) {
        console.debug("[TokenPocket] Filtered console error:", errorString);
      }
      return;
    }

    // 其他错误正常输出
    originalConsoleError.apply(console, args);
  };
};

// 初始化全局错误处理
setupGlobalErrorHandlers();

const container = document.getElementById("root") as HTMLDivElement;
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <Suspense fallback={<PageLoading />}>
      <App />
    </Suspense>
  </ErrorBoundary>
);
