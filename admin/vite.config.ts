import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/_/',
  build: {
    outDir: '../pb_public/admin',
    emptyOutDir: true,
  },
})
