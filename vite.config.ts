import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const mapsKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      ...(mapsKey
        ? {
            'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(mapsKey),
          }
        : {}),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'next/link': path.resolve(__dirname, './src/shims/next-link.tsx'),
        'next/image': path.resolve(__dirname, './src/shims/next-image.tsx'),
        'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.ts'),
        'next/font/google': path.resolve(__dirname, './src/shims/next-font-google.ts'),
        'next': path.resolve(__dirname, './src/shims/next.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
