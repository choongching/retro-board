import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // The app, plus the standalone design-system styleguide page.
        // styleguide.html links src/styles.css, so Vite bundles the real
        // stylesheet into it and the page can't drift from production.
        main: resolve(import.meta.dirname, 'index.html'),
        styleguide: resolve(import.meta.dirname, 'styleguide.html'),
      },
    },
  },
})
