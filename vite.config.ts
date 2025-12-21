import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  build: {
    // 增加 chunk 大小警告阈值，避免警告
    chunkSizeWarningLimit: 1000,
    // 优化构建性能
    target: "es2015", // 兼容更多设备
    rollupOptions: {
      // external: ['react', 'react-dom/client','mobx', 'mobx-react-lite'], // 指定不打包的库
      output: {
        // globals: {
        //   react: 'React',
        //   'react-dom/client': 'ReactDOMClient',
        //   mobx: 'mobx',
        //   'mobx-react-lite': 'mobxReactLite'
        // },
        chunkFileNames: "chunks/[name]-[hash].js",
        // 拆分更小的 chunks，避免单个文件过大导致 Android WebView 加载失败
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // 将大型库单独打包，避免 vendor 包过大
            // Web3 核心库
            if (id.includes("wagmi")) {
              return "wagmi";
            }
            if (id.includes("viem")) {
              return "viem";
            }
            // Web3 UI 库 - 进一步拆分
            if (id.includes("@rainbow-me/rainbowkit")) {
              return "rainbowkit";
            }
            if (id.includes("@ant-design/web3")) {
              return "ant-web3";
            }
            // React 相关
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("@tanstack/react-query")) {
              return "react-query";
            }
            // UI 库
            if (id.includes("antd-mobile")) {
              return "antd-mobile";
            }
            // 加密和工具库
            if (id.includes("ethers")) {
              return "ethers";
            }
            if (id.includes("crypto-js") || id.includes("@noble")) {
              return "crypto-libs";
            }
            // 其他大型库
            if (id.includes("lodash")) {
              return "lodash";
            }
            if (id.includes("dayjs")) {
              return "dayjs";
            }
            // if (id.includes('tronweb')) {
            //   return 'tronewb3'
            // }
            // if(id.includes('solana')){
            //   return 'solana'
            // }
            return "vendor";
          }
        },
      },
    },
  },
  plugins: [
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
        target: "http://localhost:8090",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/mix": {
        target: process.env.VITE_API_BASE_URL || "http://127.0.0.1:8090",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
