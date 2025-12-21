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
  },
  resolve: {
    // 确保只有一个 React 实例
    dedupe: ["react", "react-dom"],
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
    // 强制预构建，避免运行时错误
    force: false,
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
