---
mnema:
  key: NOTA-202
  state: DRAFT
  title: 'Fix: parser aceita chaveAcesso malformada; DV mod-11 nunca conferido'
  description: >-
    extractAccessKey (nfe.parser.ts:105-109) faz apenas id.replace(/^NFe/,'') —
    não valida 44 dígitos, não valida que são dígitos, não confere o DV mod-11
    (cDV). CONFIRMADO em runtime: @Id='NFeABC' vira chaveAcesso='ABC' (3 chars)
    aceito; @Id com 44 noves (DV inválido) aceito. Na ingestão via upload o XSD
    barra o pattern do @Id ANTES do parse, mas parseNFe é exportado como API
    pública do core e usável sem validação prévia; a chave vira identidade da
    NF, chave de dedup (MERGE) e base das arestas DEVOLVE. Adicionar validação
    de estrutura (44 dígitos) e do DV mod-11, lançando NFeParseError com
    mensagem acionável. Verificar impacto nas fixtures (chaves devem ter DV
    coerente).
  acceptance_criteria:
    - >-
      parseNFe lança NFeParseError para @Id sem 44 dígitos ou com dígitos
      inválidos
    - DV mod-11 conferido; chave com DV incorreto é rejeitada
    - mensagem de erro acionável (aponta o que está errado)
    - >-
      testes unit cobrindo chave curta, não-numérica e DV inválido (falhariam
      sem o fix)
    - fixtures existentes continuam válidas (DV recalculado se necessário)
  labels:
    - area:core
    - dim:correcao
    - tipo:bug
  estimate: 3
  priority: 2
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:05.008Z'
---
# Fix: parser aceita chaveAcesso malformada; DV mod-11 nunca conferido
