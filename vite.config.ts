import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || /[\\/]react[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) return 'vendor-firebase-firestore';
          if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase-app';
          if (id.includes('lucide-react')) return 'vendor-icons';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
