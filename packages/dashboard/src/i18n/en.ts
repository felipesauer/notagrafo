/** English translations. Keys in the pagina.secao.elemento pattern. */
export const en = {
    comum: {
        carregando: 'Loading…',
        erro: 'An error occurred.',
        tentarNovamente: 'Try again',
        salvar: 'Save',
        cancelar: 'Cancel',
    },
    login: {
        titulo: 'Sign in',
        email: 'E-mail',
        senha: 'Password',
        entrar: 'Sign in',
        erroCredenciais: 'Invalid e-mail or password.',
    },
    sidebar: {
        overview: 'Overview',
        nfs: 'Invoices',
        empresas: 'Companies',
        produtos: 'Products',
        grafo: 'Graph',
        exportacoes: 'Exports',
        configuracoes: 'Settings',
        sair: 'Sign out',
    },
    overview: {
        titulo: 'Overview',
        totalNFs: 'Total invoices',
        totalEmpresas: 'Companies',
        totalProdutos: 'Products',
        valorTotal: 'Processed value',
    },
    header: {
        alternarTema: 'Toggle theme',
        alternarIdioma: 'Toggle language',
        notificacoes: 'Notifications',
    },
    export: {
        pronta: 'Your export is ready.',
        baixar: 'Download file',
        fechar: 'Dismiss',
    },
} as const;
