---
mnema:
  key: NOTA-ADR-3
  kind: decision
  status: accepted
  title: MVP suporta apenas NFe v4.00 (v3.10 fora de escopo)
  context: >-
    A NOTA-9 (manual) pedia XSDs de v3.10 e v4.00. O pacote oficial fornecido
    pelo Felipe (PL_010d_NT2026.004, NT2026.004) traz apenas o leiaute v4.00;
    não há XSD v3.10 nele. Felipe decidiu que o MVP suporta somente v4.00 (3.10
    é legado e raro na emissão atual).
  decision: >-
    O MVP valida e processa apenas NFe versão 4.00. A versão 3.10, prevista no
    levantamento (e na NOTA-9), fica fora do escopo do MVP. O validador rejeita
    versões sem XSD presente em packages/core/src/schemas/xsd/ com mensagem
    clara (regra 3 da seção 6 do 01 schema dados.md), o que cobre naturalmente o
    3.10.
  rationale: >-
    v4.00 é a versão vigente da NFe; 3.10 foi desativada para emissão há anos.
    Suportar só v4.00 simplifica validador, parser e fixtures sem perda prática
    de cobertura para o MVP. O design de 'versão desconhecida → 422 com
    mensagem' já permite plugar 3.10 depois apenas adicionando o XSD, sem
    mudança de código.
  consequences: >-
    NOTA-9 reduz-se a v4.00 (5 XSDs interdependentes em xsd/v4.00/). O validador
    (NOTA-7) e o parser (NOTA-8) miram só v4.00. Fixtures de teste
    (nfe-valida-v4.00.xml etc.) já são v4.00. Não criar pasta xsd/v3.10/ nem
    fixtures 3.10. Para reabilitar 3.10 no futuro: adicionar o PL em xsd/v3.10/
    — sem alterar código.
  superseded_by: null
  authored_by: 019f03ba-735c-725c-b52a-22a88c9abe61
  impacts:
    - packages/core/src/schemas/xsd/v4.00
    - packages/core/src/schemas/xsd/PROVENANCE.md
    - NOTA-9
    - NOTA-7
    - NOTA-8
    - .plan/01 schema dados.md
    - .plan/04 infra testes.md
  metadata: {}
  at: '2026-06-26T15:38:33.768Z'
---
# MVP suporta apenas NFe v4.00 (v3.10 fora de escopo)
