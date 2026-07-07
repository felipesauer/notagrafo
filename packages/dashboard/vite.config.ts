import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        // Alias usado pelos componentes gerados do shadcn/ui (espelha tsconfig paths).
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
        // dedupe: força UMA única instância de react/react-dom. Sem isso, num
        // monorepo pnpm (symlinks) uma lib pode resolver o React por outro caminho
        // e o dev acaba com duas cópias do runtime → "Cannot read properties of
        // null (reading 'useContext')" intermitente (some ao recarregar a página).
        dedupe: ['react', 'react-dom'],
    },
    // Pré-bundla o React (e libs que fazem require de forma incompatível) numa
    // única cópia, evitando o mesmo problema de instância dupla no dev.
    // reagraph: forçar o pré-bundle com esbuild evita que o transform on-the-fly
    // do Vite dev corrompa o `import()` dinâmico de classe do graphology (que o
    // reagraph usa internamente) — aparecia como "Unexpected token '('" ao abrir
    // a Rede/Full network, só no dev; o build de produção (Rolldown) nunca teve o
    // problema. Pré-bundlar reagraph arrasta o graphology transitivo junto.
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'reagraph'],
    },
    server: {
        port: 5173,
        // Proxy para a API em dev — evita CORS. /health fica FORA do prefixo
        // /api/v1 (usado por Docker/orquestradores); espelha o location /health
        // do nginx (prod) para o card Sistema funcionar também no dev.
        proxy: {
            '/api': { target: 'http://localhost:3000', changeOrigin: true },
            '/health': { target: 'http://localhost:3000', changeOrigin: true },
        },
    },
    build: { outDir: 'dist' },
});
