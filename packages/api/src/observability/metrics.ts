import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

/** Registro Prometheus com as métricas nfp_* (tabela da seção 4 do 04 infra-testes.md). */
export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const nfProcessedTotal = new Counter({
    name: 'nfp_nf_processed_total',
    help: 'Total de NFes processadas',
    labelNames: ['status'],
    registers: [registry],
});

export const nfProcessingDuration = new Histogram({
    name: 'nfp_nf_processing_duration_seconds',
    help: 'Tempo de processamento por NF',
    registers: [registry],
});

export const queueDepth = new Gauge({
    name: 'nfp_queue_depth',
    help: 'Jobs pendentes na fila BullMQ',
    registers: [registry],
});

export const queueFailedTotal = new Counter({
    name: 'nfp_queue_failed_total',
    help: 'Jobs que foram para a DLQ',
    registers: [registry],
});

export const exportGeneratedTotal = new Counter({
    name: 'nfp_export_generated_total',
    help: 'Exportações geradas',
    labelNames: ['formato'],
    registers: [registry],
});

export const neo4jQueryDuration = new Histogram({
    name: 'nfp_neo4j_query_duration_seconds',
    help: 'Duração de queries Neo4j',
    labelNames: ['query_name'],
    registers: [registry],
});

export const graphNodesTotal = new Gauge({
    name: 'nfp_graph_nodes_total',
    help: 'Total de nós no grafo',
    labelNames: ['label'],
    registers: [registry],
});
