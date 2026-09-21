import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  base: '/joker-80/', // <--- IMPORTANTE: Metti il nome del tuo repository tra le due barre
})
