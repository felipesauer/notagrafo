/**
 * Catálogo NCM por capítulo (2 primeiros dígitos) — popula descricao/secao/capitulo
 * do nó NCM (seção 1.4 do 01 schema dados.md).
 *
 * A NCM (Nomenclatura Comum do Mercosul) tem 8 dígitos, mas a estrutura estável e
 * de baixo volume é o CAPÍTULO (os 2 primeiros dígitos do Sistema Harmonizado): 99
 * capítulos agrupados em 21 seções (algarismos romanos). Catalogar por capítulo dá
 * uma descrição útil para qualquer NCM sem precisar de uma tabela de ~10 mil linhas.
 *
 * Estático e versionado no repositório — sem fetch em runtime (mesma regra dos XSDs).
 */

/** Uma das 21 seções do Sistema Harmonizado (algarismo romano + título). */
interface Secao {
    secao: string; // algarismo romano (ex.: 'XVI')
    titulo: string;
}

/** Resultado de lookupNcm: descrição do capítulo + seção a que pertence. */
export interface NcmInfo {
    capitulo: string; // 2 dígitos (ex.: '84')
    descricao?: string; // descrição do capítulo, quando conhecido
    secao?: string; // título da seção, quando conhecido
}

/**
 * Mapa capítulo (2 dígitos) → { descrição do capítulo, seção romana }.
 * Cobre os capítulos usados no seed (61, 84, 85, 94) e os mais frequentes em NF-e.
 * A seção referencia SECOES abaixo.
 */
const CAPITULOS: Readonly<Record<string, { descricao: string; secao: string }>> = {
    '01': { descricao: 'Animais vivos', secao: 'I' },
    '02': { descricao: 'Carnes e miudezas comestíveis', secao: 'I' },
    '03': { descricao: 'Peixes e crustáceos', secao: 'I' },
    '04': { descricao: 'Leite, laticínios, ovos e mel', secao: 'I' },
    '07': { descricao: 'Produtos hortícolas, plantas e raízes', secao: 'II' },
    '08': { descricao: 'Frutas; cascas de cítricos e melões', secao: 'II' },
    '09': { descricao: 'Café, chá, mate e especiarias', secao: 'II' },
    '10': { descricao: 'Cereais', secao: 'II' },
    '15': { descricao: 'Gorduras e óleos animais ou vegetais', secao: 'III' },
    '16': { descricao: 'Preparações de carne, peixe ou crustáceos', secao: 'IV' },
    '17': { descricao: 'Açúcares e produtos de confeitaria', secao: 'IV' },
    '18': { descricao: 'Cacau e suas preparações', secao: 'IV' },
    '19': { descricao: 'Preparações à base de cereais, farinhas ou amidos', secao: 'IV' },
    '20': { descricao: 'Preparações de produtos hortícolas e frutas', secao: 'IV' },
    '21': { descricao: 'Preparações alimentícias diversas', secao: 'IV' },
    '22': { descricao: 'Bebidas, líquidos alcoólicos e vinagres', secao: 'IV' },
    '24': { descricao: 'Fumo (tabaco) e seus sucedâneos', secao: 'IV' },
    '25': { descricao: 'Sal; enxofre; terras e pedras; gesso, cal e cimento', secao: 'V' },
    '27': { descricao: 'Combustíveis minerais, óleos e ceras minerais', secao: 'V' },
    '28': { descricao: 'Produtos químicos inorgânicos', secao: 'VI' },
    '29': { descricao: 'Produtos químicos orgânicos', secao: 'VI' },
    '30': { descricao: 'Produtos farmacêuticos', secao: 'VI' },
    '31': { descricao: 'Adubos e fertilizantes', secao: 'VI' },
    '32': { descricao: 'Tintas, vernizes e pigmentos', secao: 'VI' },
    '33': { descricao: 'Óleos essenciais; perfumaria e cosméticos', secao: 'VI' },
    '34': { descricao: 'Sabões, agentes de limpeza e ceras', secao: 'VI' },
    '38': { descricao: 'Produtos diversos das indústrias químicas', secao: 'VI' },
    '39': { descricao: 'Plásticos e suas obras', secao: 'VII' },
    '40': { descricao: 'Borracha e suas obras', secao: 'VII' },
    '44': { descricao: 'Madeira, carvão vegetal e obras de madeira', secao: 'IX' },
    '48': { descricao: 'Papel e cartão; obras de pasta de celulose', secao: 'X' },
    '49': { descricao: 'Livros, jornais e produtos das artes gráficas', secao: 'X' },
    '61': { descricao: 'Vestuário e seus acessórios, de malha', secao: 'XI' },
    '62': { descricao: 'Vestuário e seus acessórios, exceto de malha', secao: 'XI' },
    '63': { descricao: 'Outros artigos têxteis confeccionados', secao: 'XI' },
    '64': { descricao: 'Calçados, polainas e artigos semelhantes', secao: 'XII' },
    '69': { descricao: 'Produtos cerâmicos', secao: 'XIII' },
    '70': { descricao: 'Vidro e suas obras', secao: 'XIII' },
    '72': { descricao: 'Ferro fundido, ferro e aço', secao: 'XV' },
    '73': { descricao: 'Obras de ferro fundido, ferro ou aço', secao: 'XV' },
    '76': { descricao: 'Alumínio e suas obras', secao: 'XV' },
    '82': { descricao: 'Ferramentas e artefatos de metais comuns', secao: 'XV' },
    '83': { descricao: 'Obras diversas de metais comuns', secao: 'XV' },
    '84': { descricao: 'Máquinas, aparelhos e equipamentos mecânicos', secao: 'XVI' },
    '85': { descricao: 'Máquinas, aparelhos e materiais elétricos', secao: 'XVI' },
    '87': { descricao: 'Veículos automóveis, tratores e suas partes', secao: 'XVII' },
    '90': { descricao: 'Instrumentos e aparelhos de óptica e precisão', secao: 'XVIII' },
    '94': { descricao: 'Móveis; mobiliário médico-cirúrgico; luminárias', secao: 'XX' },
    '95': { descricao: 'Brinquedos, jogos e artigos para esporte', secao: 'XX' },
    '96': { descricao: 'Obras diversas', secao: 'XX' },
};

/** Título de cada seção romana referenciada por CAPITULOS. */
const SECOES: Readonly<Record<string, Secao>> = {
    I: { secao: 'I', titulo: 'Animais vivos e produtos do reino animal' },
    II: { secao: 'II', titulo: 'Produtos do reino vegetal' },
    III: { secao: 'III', titulo: 'Gorduras e óleos; ceras' },
    IV: { secao: 'IV', titulo: 'Produtos das indústrias alimentares; bebidas; fumo' },
    V: { secao: 'V', titulo: 'Produtos minerais' },
    VI: { secao: 'VI', titulo: 'Produtos das indústrias químicas' },
    VII: { secao: 'VII', titulo: 'Plásticos e borracha' },
    IX: { secao: 'IX', titulo: 'Madeira, carvão vegetal e obras de madeira' },
    X: { secao: 'X', titulo: 'Pastas de madeira; papel e cartão' },
    XI: { secao: 'XI', titulo: 'Matérias têxteis e suas obras' },
    XII: { secao: 'XII', titulo: 'Calçados, chapéus e artigos semelhantes' },
    XIII: { secao: 'XIII', titulo: 'Obras de pedra, cerâmica e vidro' },
    XV: { secao: 'XV', titulo: 'Metais comuns e suas obras' },
    XVI: { secao: 'XVI', titulo: 'Máquinas e aparelhos; material elétrico' },
    XVII: { secao: 'XVII', titulo: 'Material de transporte' },
    XVIII: { secao: 'XVIII', titulo: 'Instrumentos de óptica, precisão e medicina' },
    XX: { secao: 'XX', titulo: 'Mercadorias e produtos diversos' },
};

/** Mantém só os dígitos do código (o XML pode trazer pontuação ou espaços). */
function onlyDigits(codigo: string): string {
    return codigo.replace(/\D/g, '');
}

/**
 * Resolve descrição e seção de uma NCM a partir do seu capítulo (2 primeiros dígitos).
 *
 * Sempre retorna `capitulo` (mesmo para NCM desconhecida, contanto que tenha ≥2 dígitos);
 * `descricao`/`secao` só vêm quando o capítulo está no catálogo. Capítulo indeterminável
 * (código com menos de 2 dígitos) retorna `{ capitulo: '' }`.
 */
export function lookupNcm(codigo: string): NcmInfo {
    const capitulo = onlyDigits(codigo).slice(0, 2);
    const cap = CAPITULOS[capitulo];
    if (!cap) return { capitulo };
    // Invariante: todo capítulo de CAPITULOS referencia uma seção existente em SECOES
    // (coberta pelo teste de consistência do catálogo). O `!` reflete essa garantia.
    return { capitulo, descricao: cap.descricao, secao: SECOES[cap.secao]!.titulo };
}

/** Lista os códigos de capítulo conhecidos (para validação/testes do catálogo). */
export function listNcmChapters(): string[] {
    return Object.keys(CAPITULOS);
}
