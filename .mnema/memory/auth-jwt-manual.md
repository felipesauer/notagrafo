---
title: "Auth do MVP é JWT manual, não Better Auth (ADR NOTA-ADR-1)"
topics: ["decision","auth","architecture","nf-processor"]
created_at: 2026-06-26T01:01:29.623Z
updated_at: 2026-06-26T01:01:29.623Z
---
A autenticação do MVP NF Processor usa JWT manual com @fastify/jwt, persistindo usuários como nós no Neo4j — divergindo do levantamento (02 contratos api.md / 00 visao geral.md), que especificava Better Auth.

Por quê: Better Auth exige um banco relacional dedicado (usuários/sessões/magic links) não previsto na stack (só Neo4j + Redis). JWT manual entrega o mesmo contrato externo (/auth/login → token+expiresAt+user; rotas protegidas via Authorization: Bearer) sem adicionar um serviço de banco, mantendo o quickstart de 5 min enxuto.

Como aplicar: implementar conforme o ADR NOTA-ADR-1 (registrado no mnema com contexto/consequências). O contrato dos endpoints /auth/* permanece idêntico ao levantamento — só a implementação interna muda. SMTP/magic-link ficam fora do MVP (marcar como futuras no .env.example). É a task NOTA-17. Ver memória planning-map-mvp.
