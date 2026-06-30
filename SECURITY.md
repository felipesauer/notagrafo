# Política de Segurança

## Versões suportadas

O **notagrafo** está em desenvolvimento ativo (pré-1.0). Correções de segurança são
aplicadas sobre a branch `main`. Não há, por enquanto, manutenção de versões
anteriores — use sempre o código mais recente da `main`.

## Reportando uma vulnerabilidade

**Não abra uma issue pública** para vulnerabilidades de segurança.

Prefira o canal privado do GitHub:

1. Acesse a aba **Security** do repositório → **Report a vulnerability**
   ([GitHub Security Advisories](https://github.com/felipesauer/notagrafo/security/advisories/new)).
2. Descreva o problema com o máximo de detalhe possível.

### O que incluir no relato

- Tipo da vulnerabilidade e o componente afetado (`core`, `graph`, `api`,
  `worker`, `dashboard` ou infra).
- Passos para reproduzir (ou uma prova de conceito).
- Impacto potencial (ex.: vazamento de dados, RCE, bypass de autenticação).
- Qualquer sugestão de mitigação, se houver.

### O que esperar

- **Confirmação de recebimento** em até 5 dias úteis.
- Uma avaliação inicial e, quando confirmada, um plano de correção.
- Crédito ao relator na divulgação, salvo se você preferir anonimato.

Pedimos que dê um prazo razoável para a correção antes de qualquer divulgação
pública (divulgação responsável).

## Escopo

Este é um projeto open-source fornecido "como está" (ver [LICENSE](LICENSE)). Os
defaults do [`.env.example`](.env.example) — senhas, segredos — servem **apenas para
desenvolvimento local**. Operar o notagrafo em produção com esses valores é uma má
configuração do operador, não uma vulnerabilidade do projeto. Em produção, troque
todos os segredos (`NEO4J_PASSWORD`, `AUTH_SECRET`, credenciais de storage).
