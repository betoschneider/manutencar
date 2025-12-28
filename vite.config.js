import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const allowedHosts = env.ALLOWED_HOSTS
    ? env.ALLOWED_HOSTS.split(',').map(h => h.trim())
    : []

  return {
    plugins: [react()],

    server: {
      host: true,
      port: 5173,
      allowedHosts,
    },

    preview: {
      host: true,
      port: 5173,
      allowedHosts,
    },
  }
})
