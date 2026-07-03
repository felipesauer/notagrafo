import { type JSX, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { apiFetch } from '../api/api.client.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog.js';
import { Button } from './ui/button.js';
import { Progress } from './ui/progress.js';

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
 * Modal de upload de NFe (XML ou ZIP) com drag-and-drop, sobre o Dialog do
 * shadcn (ESC / clique-fora / focus-trap de graça). Após o 202, faz polling de
 * GET /nf/jobs/:jobId a cada 3s, mostra a barra de progresso (progresso/total) e
 * o resumo (processadas/duplicatas/erros) + toast no sucesso.
 */
export function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded?: () => void }): JSX.Element {
    const { t } = useTranslation();
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [mensagem, setMensagem] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [progresso, setProgresso] = useState<{ done: number; total: number } | null>(null);
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
                if (job.total) setProgresso({ done: job.progresso ?? 0, total: job.total });
                if (job.status === 'completed') {
                    const r = job.resultado ?? { processadas: job.total ?? 1, duplicatas: 0, erros: 0 };
                    setResultado(r);
                    setStatus('concluido');
                    setMensagem(t('nf.concluido'));
                    toast.success(t('nf.resumo', { processadas: r.processadas, duplicatas: r.duplicatas, erros: r.erros }));
                    onUploaded?.();
                } else if (job.status === 'failed') {
                    setStatus('erro');
                    setMensagem(job.erro ?? t('nf.falhou'));
                }
            } catch {
                // erro transitório de rede: tenta de novo no próximo tick
            }
        };
        const id = setInterval(() => void tick(), POLL_MS);
        void tick();
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
        setProgresso(null);
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
        setProgresso(null);
    }, []);

    function onDrop(e: React.DragEvent): void {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && /\.(xml|zip)$/i.test(f.name)) selecionar(f);
    }

    const ocupado = status === 'enviando' || status === 'processando';
    const pct = progresso && progresso.total > 0 ? Math.round((progresso.done / progresso.total) * 100) : null;

    return (
        <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('nf.uploadTitulo')}</DialogTitle>
                    <DialogDescription>{t('nf.dropAqui')}</DialogDescription>
                </DialogHeader>

                <div
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center text-sm transition-colors ${
                        dragOver ? 'border-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                >
                    <UploadCloud className="size-6" />
                    <span className={arquivo ? 'font-medium text-foreground' : ''}>{arquivo ? arquivo.name : t('nf.dropAqui')}</span>
                    <input ref={inputRef} type="file" accept=".xml,.zip" hidden onChange={(e) => selecionar(e.target.files?.[0] ?? null)} />
                </div>

                {status === 'processando' && (
                    <div className="space-y-1.5">
                        <p className="text-sm text-muted-foreground">{t('nf.processando')}</p>
                        <Progress value={pct ?? undefined} />
                    </div>
                )}
                {resultado && (
                    <p className="text-sm font-medium">
                        {t('nf.resumo', { processadas: resultado.processadas, duplicatas: resultado.duplicatas, erros: resultado.erros })}
                    </p>
                )}
                {mensagem && status === 'erro' && <p className="text-sm text-destructive">{mensagem}</p>}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        {status === 'concluido' ? t('comum.fechar') : t('comum.cancelar')}
                    </Button>
                    <Button type="button" onClick={() => void enviar()} disabled={!arquivo || ocupado || status === 'concluido'}>
                        {ocupado ? t('comum.carregando') : t('nf.enviar')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
