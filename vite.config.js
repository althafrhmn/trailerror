import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          
          // React Router
          if (id.includes('node_modules/react-router') || 
              id.includes('node_modules/@remix-run')) {
            return 'router';
          }
          
          // MUI core
          if (id.includes('node_modules/@mui/material') || 
              id.includes('node_modules/@emotion/')) {
            return 'mui-core';
          }
          
          // MUI icons
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'mui-icons';
          }
          
          // Date related
          if (id.includes('node_modules/date-fns') || 
              id.includes('node_modules/@mui/x-date-pickers')) {
            return 'date-utils';
          }
          
          // Other utilities
          if (id.includes('node_modules/') && 
              !id.includes('.css')) {
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/AdapterDateFns',
      '@mui/x-date-pickers/DateCalendar',
      'date-fns',
      'react-hot-toast',
      'framer-motion',
      'recharts',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      overlay: true,
    },
  },
})
