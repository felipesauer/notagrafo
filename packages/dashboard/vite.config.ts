import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        // Alias usado pelos componentes gerados do shadcn/ui (espelha tsconfig paths).
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
        port: 5173,
        // Proxy para a API em dev — evita CORS.
        proxy: {
            '/api': { target: 'http://localhost:3000', changeOrigin: true },
        },
    },
    build: { outDir: 'dist' },
});
