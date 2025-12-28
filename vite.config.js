import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do diretório atual.
  // O terceiro argumento '' permite carregar variáveis sem o prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      allowedHosts: env.ALLOWED_HOSTS ? [env.ALLOWED_HOSTS] : [],
    },
  }
})