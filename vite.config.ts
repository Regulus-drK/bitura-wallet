import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
    nodePolyfills()
  ],
  base: "./",
  build: {
    outDir: 'dist-react',
    target: 'esnext',
    // minify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('secp256k1')) {
            return 'crypto-lib';
          }
          if (id.includes('bitcoinjs-lib')) {
            return 'btc-lib';
          }
          if (id.includes('ethers')) {
            return 'eths';
          }
          if (id.includes('react-router-dom')) {
            return 'rct-dom';
          }
          // if (id.includes('node_modules')) {
          //   return 'vendor';
          // }
        }
      }
    }
  },
  server: {
    port: 5123,
    strictPort: true,
  }
})
