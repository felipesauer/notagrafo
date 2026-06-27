import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, type SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { trace, type Span } from '@opentelemetry/api';

/** Nomes dos spans customizados (seção 4 do 04 infra-testes.md). */
export type SpanName =
    | 'nf.parse'
    | 'nf.validate'
    | 'nf.graph.merge'
    | 'job.process'
    | 'export.generate';

let sdk: NodeSDK | undefined;

/** Seleciona o exporter por OTEL_EXPORTER (console | otlp | none). */
function pickExporter(env: NodeJS.ProcessEnv): SpanExporter | undefined {
    switch (env.OTEL_EXPORTER ?? 'none') {
        case 'console':
            return new ConsoleSpanExporter();
        case 'otlp':
            return new OTLPTraceExporter({ url: env.OTEL_ENDPOINT ?? 'http://localhost:4317' });
        default:
            return undefined; // 'none' → desabilitado
    }
}

/**
 * Inicializa o OpenTelemetry SDK. DEVE ser chamado ANTES de montar o Fastify.
 * Retorna true se habilitado (exporter != none).
 */
export function startTelemetry(env: NodeJS.ProcessEnv = process.env): boolean {
    const exporter = pickExporter(env);
    if (!exporter) return false;

    sdk = new NodeSDK({
        resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'notagrafo-api' }),
        traceExporter: exporter,
    });
    sdk.start();
    return true;
}

/** Encerra o SDK (flush dos spans) — usar no shutdown. */
export async function stopTelemetry(): Promise<void> {
    await sdk?.shutdown();
    sdk = undefined;
}

const tracer = trace.getTracer('notagrafo');

/**
 * Executa `fn` dentro de um span customizado. Marca erro e re-lança.
 * No-op de overhead quando a telemetria está desabilitada (tracer noop).
 */
export async function withSpan<T>(
    name: SpanName,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
): Promise<T> {
    return tracer.startActiveSpan(name, async (span) => {
        if (attributes) span.setAttributes(attributes);
        try {
            return await fn(span);
        } catch (err) {
            span.recordException(err as Error);
            span.setStatus({ code: 2 }); // ERROR
            throw err;
        } finally {
            span.end();
        }
    });
}
