import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente (sem exigir prefixo VITE_)
  const env = loadEnv(mode, process.cwd(), '')

  // Permite múltiplos hosts separados por vírgula no .env
  const allowedHosts = env.ALLOWED_HOSTS
    ? env.ALLOWED_HOSTS.split(',').map(h => h.trim())
    : []

  return {
    plugins: [react()],

    // Vite DEV
    server: {
      host: true, // 0.0.0.0
      allowedHosts,
    },

    // Vite PREVIEW (produção via npm run preview)
    preview: {
      host: true, // 0.0.0.0
      allowedHosts,
      port: 5173,
    },
  }
})
