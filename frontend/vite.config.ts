import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'               // ← add this

export default defineConfig(() => ({
  plugins: [react()],
  base: '/armorify-ppe/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),   // ← add this
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.name ?? '').split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
      },
    },
  },
}))
