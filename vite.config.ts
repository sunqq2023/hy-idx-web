import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // external: ['react', 'react-dom/client','mobx', 'mobx-react-lite'], // 指定不打包的库
      output: {
        // globals: {
        //   react: 'React',
        //   'react-dom/client': 'ReactDOMClient',
        //   mobx: 'mobx',
        //   'mobx-react-lite': 'mobxReactLite'
        // },
        chunkFileNames: 'chunks/[name]-[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // if (id.includes('tronweb')) {
            //   return 'tronewb3'
            // }
            // if(id.includes('solana')){
            //   return 'solana'
            // }
            return 'vendor'
          }
        }
      }
    }
  },
  plugins: [
    nodePolyfills({
      crypto: true,
      stream: true,
      buffer: true,
      process: true
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    svgr()
    // visualizer({
    //   filename: './dist/stats.html',
    //   open: true,
    //   template: 'treemap',
    //   gzipSize: true
    // })
  ],
  server: {
    port: 3001
  }
})
