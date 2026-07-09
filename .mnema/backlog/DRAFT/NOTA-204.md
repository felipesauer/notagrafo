---
mnema:
  key: NOTA-204
  state: DRAFT
  title: 'Harden: opções explícitas de segurança no parseXml do validador (XXE/DTD)'
  description: >-
    validateNFe (nfe.validator.ts:53) chama libxmljs2 parseXml(xml) sobre input
    do usuário sem opções explícitas. VERIFICADO em runtime que a versão atual
    JÁ é segura: billion-laughs recursivo dá 'entity reference loop', quadratic
    blowup (~1500MB) não expandiu (0.2MB/46ms), DTD/entidade externa não é
    buscada. NÃO é vulnerabilidade ativa — é defesa-em-profundidade: passar {
    nonet:true, dtdload:false, dtdvalid:false, doctype:false/noent:false } deixa
    explícito e imune a mudança de default da lib. Adicionar teste com payload
    de entity-bomb e DTD externo assegurando que não expande/não busca rede.
    NF-e não usa DTD/entidades, então desabilitar é seguro.
  acceptance_criteria:
    - >-
      parseXml do input do usuário recebe opções explícitas desabilitando DTD
      load/net
    - teste com billion-laughs e DTD externo confirmando rejeição/não-expansão
    - validação de XML legítimo (fixtures) continua passando
  labels:
    - area:core
    - dim:seguranca
  estimate: 2
  priority: 3
  assignee: null
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: NOTA-EPIC-31
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-09T18:24:09.545Z'
---
# Harden: opções explícitas de segurança no parseXml do validador (XXE/DTD)
