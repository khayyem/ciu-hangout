import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Firebase SDK сам по себе ~450 КБ; бандл одной страницы, предупреждение не нужно.
  build: { chunkSizeWarningLimit: 800 },
})
