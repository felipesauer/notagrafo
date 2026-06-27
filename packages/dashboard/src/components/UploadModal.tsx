import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TOKEN_KEY = 'nfp_token';

type UploadStatus = 'idle' | 'enviando' | 'enfileirado' | 'erro';

/**
 * Modal de upload de NFe (XML ou ZIP). Envia multipart para /nf/upload e mostra
 * o jobId; o acompanhamento detalhado do job fica no GET /nf/jobs/:jobId.
 */
export function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded?: () => void }): JSX.Element {
    const { t } = useTranslation();
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [mensagem, setMensagem] = useState<string | null>(null);

    async function enviar(): Promise<void> {
        if (!arquivo) return;
        setStatus('enviando');
        setMensagem(null);
        try {
            const form = new FormData();
            form.append('file', arquivo);
            const token = localStorage.getItem(TOKEN_KEY);
            const res = await fetch('/api/v1/nf/upload', {
                method: 'POST',
                headers: token ? { authorization: `Bearer ${token}` } : {},
                body: form,
            });
            const body = (await res.json().catch(() => ({}))) as { mensagem?: string; message?: string };
            if (res.status === 202) {
                setStatus('enfileirado');
                setMensagem(body.mensagem ?? t('nf.uploadOk'));
                onUploaded?.();
            } else {
                setStatus('erro');
                setMensagem(body.message ?? t('comum.erro'));
            }
        } catch {
            setStatus('erro');
            setMensagem(t('comum.erro'));
        }
    }

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
                <h3>{t('nf.uploadTitulo')}</h3>
                <input type="file" accept=".xml,.zip" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
                {mensagem && <p className={status === 'erro' ? 'login__erro' : ''}>{mensagem}</p>}
                <div className="modal__actions">
                    <button type="button" onClick={onClose}>{t('comum.cancelar')}</button>
                    <button type="button" onClick={() => void enviar()} disabled={!arquivo || status === 'enviando'}>
                        {status === 'enviando' ? t('comum.carregando') : t('nf.enviar')}
                    </button>
                </div>
            </div>
        </div>
    );
}
