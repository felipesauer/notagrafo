import type { Queue } from 'bullmq';

export interface QueueMetrics {
    /** Jobs aguardando + ativos + atrasados (profundidade da fila). */
    depth: number;
    waiting: number;
    active: number;
    delayed: number;
    /** Jobs que falharam (foram para a DLQ após esgotar retries). */
    failed: number;
    completed: number;
}

/** Coleta métricas de profundidade e falhas da fila (para Prometheus). */
export async function collectQueueMetrics(queue: Queue): Promise<QueueMetrics> {
    const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'delayed',
        'failed',
        'completed',
    );
    const waiting = counts.waiting ?? 0;
    const active = counts.active ?? 0;
    const delayed = counts.delayed ?? 0;
    return {
        depth: waiting + active + delayed,
        waiting,
        active,
        delayed,
        failed: counts.failed ?? 0,
        completed: counts.completed ?? 0,
    };
}
