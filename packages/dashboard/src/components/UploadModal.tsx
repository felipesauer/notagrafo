import { type JSX, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/api.client.js';

const TOKEN_KEY = 'nfp_token';
const POLL_MS = 3000;

type UploadStatus = 'idle' | 'enviando' | 'processando' | 'concluido' | 'erro';

interface JobStatus {
    jobId: string;
    status: string; // waiting | active | completed | failed | ...
    progresso?: number;
    total?: number;
    resultado?: { processadas: number; duplicatas: number; erros: number };
    erro?: string;
}

/**
 * Modal de upload de NFe (XML ou ZIP) com drag-and-drop. Após o 202, faz polling
 * de GET /nf/jobs/:jobId a cada 3s e exibe o resumo (processadas/duplicatas/erros).
 */
export function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded?: () => void }): JSX.Element {
    const { t } = useTranslation();
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [mensagem, setMensagem] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [resultado, setResultado] = useState<JobStatus['resultado'] | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Polling do job enquanto status === 'processando'.
    useEffect(() => {
        if (status !== 'processando' || !jobId) return;
        let cancelado = false;
        const tick = async (): Promise<void> => {
            try {
                const job = await apiFetch<JobStatus>(`/nf/jobs/${jobId}`);
                if (cancelado) return;
                if (job.status === 'completed') {
                    setResultado(job.resultado ?? { processadas: job.total ?? 1, duplicatas: 0, erros: 0 });
                    setStatus('concluido');
                    setMensagem(t('nf.concluido'));
                    onUploaded?.();
                } else if (job.status === 'failed') {
                    setStatus('erro');
                    setMensagem(job.erro ?? t('nf.falhou'));
                }
                // demais estados (waiting/active): segue o polling
            } catch {
                // erro transitório de rede: tenta de novo no próximo tick
            }
        };
        const id = setInterval(() => void tick(), POLL_MS);
        void tick(); // dispara já na entrada
        return () => {
            cancelado = true;
            clearInterval(id);
        };
    }, [status, jobId, t, onUploaded]);

    async function enviar(): Promise<void> {
        if (!arquivo) return;
        setStatus('enviando');
        setMensagem(null);
        setResultado(null);
        try {
            const form = new FormData();
            form.append('file', arquivo);
            const token = localStorage.getItem(TOKEN_KEY);
            const res = await fetch('/api/v1/nf/upload', {
                method: 'POST',
                headers: token ? { authorization: `Bearer ${token}` } : {},
                body: form,
            });
            const body = (await res.json().catch(() => ({}))) as { jobId?: string; mensagem?: string; message?: string };
            if (res.status === 202 && body.jobId) {
                setJobId(body.jobId);
                setStatus('processando');
                setMensagem(body.mensagem ?? t('nf.processando'));
            } else {
                setStatus('erro');
                setMensagem(body.message ?? t('comum.erro'));
            }
        } catch {
            setStatus('erro');
            setMensagem(t('comum.erro'));
        }
    }

    const selecionar = useCallback((f: File | null): void => {
        setArquivo(f);
        setStatus('idle');
        setMensagem(null);
        setResultado(null);
    }, []);

    function onDrop(e: React.DragEvent): void {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && /\.(xml|zip)$/i.test(f.name)) selecionar(f);
    }

    const ocupado = status === 'enviando' || status === 'processando';

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
                <h3>{t('nf.uploadTitulo')}</h3>

                <div
                    className={`dropzone${dragOver ? ' dropzone--over' : ''}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xml,.zip"
                        hidden
                        onChange={(e) => selecionar(e.target.files?.[0] ?? null)}
                    />
                    <span>{arquivo ? arquivo.name : t('nf.dropAqui')}</span>
                </div>

                {status === 'processando' && <p>{t('nf.processando')}</p>}
                {resultado && (
                    <p className="upload-resumo">
                        {t('nf.resumo', { processadas: resultado.processadas, duplicatas: resultado.duplicatas, erros: resultado.erros })}
                    </p>
                )}
                {mensagem && <p className={status === 'erro' ? 'login__erro' : ''}>{mensagem}</p>}

                <div className="modal__actions">
                    <button type="button" onClick={onClose}>
                        {status === 'concluido' ? t('comum.fechar') : t('comum.cancelar')}
                    </button>
                    <button type="button" onClick={() => void enviar()} disabled={!arquivo || ocupado || status === 'concluido'}>
                        {status === 'enviando' || status === 'processando' ? t('comum.carregando') : t('nf.enviar')}
                    </button>
                </div>
            </div>
        </div>
    );
}
