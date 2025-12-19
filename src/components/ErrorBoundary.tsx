import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "antd-mobile";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 用于捕获和处理 Android WebView 中的连接错误
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // 检测是否是连接重置错误
    if (
      error.message.includes("ERR_CONNECTION_RESET") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed")
    ) {
      console.warn("检测到网络连接问题，可能是 Android WebView 兼容性问题");
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">
                页面加载出错
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                抱歉，页面遇到了一些问题
              </p>
            </div>

            {this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-semibold text-red-800 mb-1">
                  错误信息：
                </p>
                <p className="text-xs text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="!bg-blue-600 !text-white !rounded-lg !w-full"
                onClick={this.handleReload}
              >
                🔄 重新加载页面
              </Button>

              <div className="text-xs text-gray-500 text-center">
                <p>如果问题持续存在，请尝试：</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• 清除浏览器缓存</li>
                  <li>• 检查网络连接</li>
                  <li>• 使用其他浏览器打开</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
