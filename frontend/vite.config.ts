import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 웹 배포 모드일 경우 /interior/, 일렉트론 데스크톱 앱 빌드일 경우 ./ 적용
  base: process.env.VITE_DEPLOY_TARGET === 'web' ? '/interior/' : './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:38080',
        changeOrigin: true,
      }
    }
  }
})
