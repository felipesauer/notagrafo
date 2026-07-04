---
title: "React Flow no notagrafo: drag exige estado controlado; radial exige handles dinâmicos; Tooltip exige Provider"
topics: ["react-flow","graph","reagraph","shadcn","dashboard","gotcha"]
created_at: 2026-07-03T23:49:47.496Z
updated_at: 2026-07-03T23:49:47.496Z
---
Três gotchas do grafo/UI (Graph.tsx / CustomNode.tsx / layout.ts / AppShell), aprendidos na NOTA-114:

1. **Nós não arrastam se passados como prop computada (useMemo).** O React Flow só persiste o drag com estado CONTROLADO: useNodesState/useEdgesState + onNodesChange/onEdgesChange ligados no <ReactFlow>. Padrão: um useEffect ressincroniza rfNodes quando o GRAFO muda (fetch/merge); outro atualiza só `dimmed` no hover (sem mexer em posição, preservando o drag). O fitView reage a rfNodes.length (não ao fetch), setTimeout ~180ms, p/ enquadrar após os nós entrarem no estado do RF — nunca no drag (arrastar não muda a contagem).

2. **Layout radial precisa de handles dinâmicos, senão as arestas fazem laço.** O ego-graph (1 raiz + vizinhos diretos) usa layout RADIAL próprio (raiz no centro, vizinhos em círculo) — melhor que dagre LR (empilha, espaço morto, cruza cards). MAS o CustomNode tinha Handle fixo Left(target)/Right(source) → no radial as arestas curvam em laço. Correção: o layout define sourcePosition/targetPosition por nó (Position pelo ângulo: Math.abs(dx)>=Math.abs(dy) ? Left/Right : Top/Bottom) e o CustomNode respeita (position={targetPosition ?? Left}). Grafo em cruz limpo. Depth>1 cai no dagre LR (nodesep 80, ranksep 240). Rede completa (Reagraph) usa layoutOverrides linkDistance 180/nodeStrength -650 p/ espaçar.

3. **shadcn Tooltip exige TooltipProvider ancestral** — <Tooltip> sem <TooltipProvider> CRASHA ('Tooltip must be used within TooltipProvider') e derruba a tela toda. Montar um TooltipProvider no AppShell cobre o app. Pego pelo e2e (a listagem sumia).
