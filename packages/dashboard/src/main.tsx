import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/index.js';
import { queryClient } from './api/query.client.js';
import { router } from './router.js';
import './stores/theme.store.js'; // inicializa o tema (aplica data-theme)
import '@fontsource-variable/inter/index.css';
import './styles/globals.css';
// CSS legado por último e sem layer: vence as layers do Tailwind até a
// migração terminar (NOTA-95 o deleta).
import './index.css';

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(
        <StrictMode>
            <I18nextProvider i18n={i18n}>
                <QueryClientProvider client={queryClient}>
                    <RouterProvider router={router} />
                </QueryClientProvider>
            </I18nextProvider>
        </StrictMode>,
    );
}
