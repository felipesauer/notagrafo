---
title: "Não usar trailer Co-Authored-By do Claude/Claude Code em commits nem PRs"
topics: ["git","convention","preference","commits"]
created_at: 2026-06-30T18:40:50.210Z
updated_at: 2026-06-30T18:40:50.210Z
---
NÃO adicionar a linha `Co-Authored-By: Claude ...` nem o rodapé `🤖 Generated with Claude Code` em mensagens de commit ou descrições de PR. O Felipe pediu explicitamente para não usar essas referências de co-autoria (preferência reiterada — já havia pedido antes).

Aplicar: ao commitar, omitir o trailer de co-author que o harness sugere por padrão; ao abrir PR, não incluir o rodapé "Generated with Claude Code". Se um commit já criado com o trailer ainda não foi mergeado/compartilhado, reescrever a mensagem para removê-lo.
