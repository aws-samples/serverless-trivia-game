import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
		vue(),
		vuetify({ autoImport: true }),
	],
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        "process.env": "{}", 
        "process.env.MODE": "dev",
        "global": "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true,
        }),
    ],      
    },
  },
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})


      