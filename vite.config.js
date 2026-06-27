import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react()
  ],
  base: '/',
  assetsInclude: ['**/*.svg'],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      external(id) {
        return id.includes('environment')
      },
      output: {
        format: 'es',
        paths(id) {
          if (id.includes('environment')) {
            return '/environment.js'
          }

          return id
        },
        entryFileNames: 'source/[name].js',
        chunkFileNames: 'source/[name].js',
        assetFileNames: 'source/[name].[ext]'
      }
    }
  }
})