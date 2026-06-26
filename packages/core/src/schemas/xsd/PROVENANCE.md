# Procedência dos XSDs

Schemas oficiais da SEFAZ versionados no repositório (não baixados em runtime).

## NFe v4.00

- **Origem:** Pacote de Liberação **PL_010d_NT2026.004** (NT 2026.004 v1.01 — CNPJ Alfanumérico).
- **Portal:** Portal Nacional da NF-e — https://www.nfe.fazenda.gov.br (seção *Documentos › Esquemas XML*).
- **Obtido em:** 2026-06-26 (por felipesauer).
- **Pasta destino:** `packages/core/src/schemas/xsd/v4.00/`

### Arquivos (conjunto interdependente)

| Arquivo | Papel |
|---|---|
| `nfe_v4.00.xsd` | Raiz — referencia o leiaute |
| `leiauteNFe_v4.00.xsd` | Leiaute completo da NFe |
| `tiposBasico_v4.00.xsd` | Tipos básicos da NFe |
| `DFeTiposBasicos_v1.00.xsd` | Tipos básicos DF-e (incluído pelo leiaute) |
| `xmldsig-core-schema_v1.01.xsd` | Assinatura digital (W3C XML-DSig) |

O grafo de `<xs:include>` é fechado: validar contra `nfe_v4.00.xsd` resolve todas
as dependências localmente, sem acesso à rede.

## Versões NÃO suportadas

- **v3.10:** fora do escopo do MVP — ver ADR `NOTA-ADR-3`. Para habilitar, adicionar
  o respectivo PL em `packages/core/src/schemas/xsd/v3.10/`.
