import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  base: '/IL_NOME_DEL_REPOSITORY/', // IMPORTANTE: Metti il nome esatto del tuo repo tra due barre
})
