import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { viteMockServe } from 'vite-plugin-mock'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE=1 时构建为单文件 index.html（JS/CSS 全内联），可直接 file:// 双击打开
const singleFile = process.env.SINGLEFILE === '1'

export default defineConfig({
  // 相对路径：让 build 产物能 file:// 双击或部署到任意子路径都工作
  base: './',
  plugins: [
    vue(),
    viteMockServe({
      prefix: '/api',
      mockPath: 'src/mock'
    }),
    ...(singleFile ? [viteSingleFile()] : [])
  ],
  build: singleFile
    ? { assetsInlineLimit: 100 * 1024 * 1024, chunkSizeWarningLimit: 100 * 1024 * 1024 }
    : undefined,
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      {
        find: /^react\/compiler-runtime$/,
        replacement: '@assistant-ui/tap/standalone-shim/compiler-runtime'
      },
      { find: /^react$/, replacement: '@assistant-ui/tap/standalone-shim' }
    ]
  },
  server: {
    port: 5173,
    open: true
  }
})
