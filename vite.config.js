import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/tools/',   // <-- aquí defines el subdirectorio donde se servirá la app
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@c': path.resolve(__dirname, 'src/components'),
      '@a': path.resolve(__dirname, 'src/assets'),
      '@hk': path.resolve(__dirname, 'src/hooks'),
      '@u': path.resolve(__dirname, 'src/utils'),
      // puedes agregar más alias aquí
    }
  }
})
