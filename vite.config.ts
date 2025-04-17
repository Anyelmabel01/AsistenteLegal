import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path' // No longer needed for explicit config

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // css: { // Remove explicit postcss config, Vite should detect automatically
  //   postcss: {
  //     config: path.resolve(__dirname, 'postcss.config.js'),
  //   },
  // },
  // Ensure Tailwind config is implicitly picked up or explicitly required if needed
  // Optional: Configure server port, base path etc. if needed
  // server: {
  //   port: 3000
  // },
  // base: '/'
}) 