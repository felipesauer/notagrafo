---
mnema:
  key: NOTA-127
  state: DRAFT
  title: >-
    BUG: export não preenche cnpjEmitente/cnpjDestinatario (colunas vazias) +
    XLSX é CSV disfarçado
  description: >-
    Usuário: 'exportar não extrai e não exporta todos os dados selecionados'.
    Causa raiz (subagente, H1 confirmada): dos 6 campos selecionáveis,
    cnpjEmitente e cnpjDestinatario saem SEMPRE vazios (CSV/XLSX) ou ausentes
    (JSON) porque as linhas de listInvoices têm o CNPJ ANINHADO (emitente.cnpj /
    destinatario.cnpj), não como chave plana. serialize() faz l['cnpjEmitente']
    → undefined (export.service.ts:190) e pick() descarta chave inexistente
    (:197). Os outros 4 campos funcionam → 'parece incompleto'. Bug secundário:
    XLSX é servido como CSV puro (export.service.ts:188) → abre em 1 coluna no
    Excel. H2 (teto de linhas) REFUTADA: pagina até o fim via nextCursor.
    Correção: normalizar as linhas antes de serializar (mapear
    emitente.cnpj→cnpjEmitente, destinatario.cnpj→cnpjDestinatario, e demais
    derivados) em generate()/serialize(); gerar XLSX real; adicionar teste com
    campos:['cnpjEmitente','cnpjDestinatario'] sobre o shape real de NFListItem
    (lacuna que deixou passar).
  acceptance_criteria: []
  labels:
    - area:api
    - sev:alta
    - tipo:bug
  estimate: 3
  priority: 1
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-19
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-06T16:18:30.276Z'
---
# BUG: export não preenche cnpjEmitente/cnpjDestinatario (colunas vazias) + XLSX é CSV disfarçado
