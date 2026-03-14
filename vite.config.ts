import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";
import { loadEnv } from "vite";

/**
 * 🔐 RSA私钥验证插件
 * 验证私钥环境变量是否正确设置，避免在代码中硬编码
 * 开发环境：验证环境变量
 * 生产环境：验证环境变量
 */
function rsaPrivateKeyPlugin(): Plugin {
  return {
    name: "rsa-private-key-validator",
    config(config, { mode }) {
      // 手动加载环境变量
      const env = loadEnv(mode, process.cwd(), "");

      // 验证环境变量
      const privateKey = env.VITE_RSA_PRIVATE_KEY;

      if (privateKey) {
        console.log("✅ VITE_RSA_PRIVATE_KEY 环境变量已设置");
        console.log(`🔑 私钥长度: ${privateKey.length} 字符`);

        // 验证私钥格式
        if (
          !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
          !privateKey.includes("-----END PRIVATE KEY-----")
        ) {
          console.error("❌ 私钥格式不正确，请确保包含完整的 PEM 格式");
          throw new Error("私钥格式不正确");
        }
      } else {
        console.warn("⚠️ 警告: 未设置 VITE_RSA_PRIVATE_KEY 环境变量");
        console.warn(
          "💡 提示: 开发环境请在 .env 文件中设置 VITE_RSA_PRIVATE_KEY",
        );
        if (mode === "production") {
          console.error(
            "❌ 生产环境构建必须设置 VITE_RSA_PRIVATE_KEY 环境变量",
          );
          throw new Error("生产环境构建需要设置 VITE_RSA_PRIVATE_KEY 环境变量");
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    // 增加 chunk 大小警告阈值，避免警告
    chunkSizeWarningLimit: 1000,
    // 优化构建性能
    // 使用 es2020 以更好地支持 BigInt 和现代 JavaScript 特性
    target: "es2020", // 支持 BigInt 和现代特性，同时保持较好的兼容性
    // 确保模块顺序正确，避免初始化错误
    modulePreload: {
      polyfill: true,
    },
    // 优化依赖预构建，确保正确的加载顺序
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // external: ['react', 'react-dom/client','mobx', 'mobx-react-lite'], // 指定不打包的库
      output: {
        // globals: {
        //   react: 'React',
        //   'react-dom/client': 'ReactDOMClient',
        //   mobx: 'mobx',
        //   'mobx-react-lite': 'mobxReactLite'
        // },
        chunkFileNames: (chunkInfo) => {
          // 确保 react-vendor chunk 有固定的名称前缀，便于识别和优先加载
          if (chunkInfo.name === "react-vendor") {
            return "chunks/react-vendor-[hash].js";
          }
          return "chunks/[name]-[hash].js";
        },
        // 暂时将所有依赖合并到一个 vendor chunk，确保 React 正确加载
        // 这样可以避免代码分割导致的加载顺序问题
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // 将所有 node_modules 合并到一个 vendor chunk
            // 这样可以确保所有依赖按正确的顺序加载，避免 React 相关错误
            return "vendor";
          }
        },
      },
    },
    // 生成 manifest.json 用于版本控制
    manifest: true,
  },
  resolve: {
    // 确保只有一个 React 实例
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    // 确保 React 相关库按正确顺序预构建
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "wagmi",
      "viem",
      "@rainbow-me/rainbowkit",
      "antd-mobile",
    ],
  },
  plugins: [
    rsaPrivateKeyPlugin(), // 🔐 RSA私钥注入插件
    nodePolyfills({
      include: ["crypto", "stream", "buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    svgr(),
    // visualizer({
    //   filename: './dist/stats.html',
    //   open: true,
    //   template: 'treemap',
    //   gzipSize: true
    // })
  ],
  server: {
    host: "0.0.0.0", // 监听所有网络接口
    port: 3001,
    proxy: {
      "/api": {
        target: "http://192.168.1.173:20699",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // 保持 /api 前缀，让服务端收到 /api/xxx
      },
      "/mix": {
        target: process.env.VITE_API_BASE_URL || "https://www.ihealth.vip/api",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // 保持 /mix 路径
        configure: (proxy, _options) => {
          proxy.on("proxyRes", (proxyRes) => {
            // 移除后端返回的重复 CORS 头
            delete proxyRes.headers["access-control-allow-origin"];
            delete proxyRes.headers["access-control-allow-credentials"];
            delete proxyRes.headers["access-control-allow-methods"];
            delete proxyRes.headers["access-control-allow-headers"];
          });
        },
      },
    },
  },
});
