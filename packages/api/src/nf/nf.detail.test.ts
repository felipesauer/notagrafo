import { describe, it, expect } from 'vitest';
import { formatInvoiceDetail } from './nf.detail.js';

/** Objeto cru no formato que getInvoice (graph) devolve. */
function rawDetail(): Record<string, unknown> {
    return {
        chaveAcesso: 'CHAVE',
        numero: '8',
        status: 'ativa',
        valorTotal: 1373.5,
        total_vNF: 1373.5,
        total_vICMS: 180,
        total_vIPI: 50,
        total_vDesc: 0,
        emitente: { cnpj: '14200166000187', razaoSocial: 'Alpha' },
        destinatario: { cnpj: '99999999000191' },
        cfop: { codigo: '6102', descricao: 'Venda interestadual', tipo: 'saida' },
        itens: [
            {
                numeroItem: 1,
                quantidade: 2,
                valorUnitario: 500,
                valorTotal: 1000,
                cst: '10',
                cest: '2104700',
                vICMS: 180,
                vBCICMS: 1000,
                pICMS: 18,
                vICMSST: 72,
                vFCP: 20,
                vIPI: 50,
                vPIS: 16.5,
                vCOFINS: 76,
                produto: { idUnico: '789', codigo: 'PROD010', descricao: 'Produto' },
                ncm: { codigo: '84713012', descricao: 'Máquinas' },
            },
        ],
    };
}

describe('formatInvoiceDetail', () => {
    it('agrupa os tributos do item em `tributos`', () => {
        const out = formatInvoiceDetail(rawDetail());
        const item = (out.itens as Array<Record<string, unknown>>)[0]!;
        expect(item.tributos).toEqual({ vICMS: 180, vBCICMS: 1000, pICMS: 18, vICMSST: 72, vFCP: 20, vIPI: 50, vPIS: 16.5, vCOFINS: 76 });
        // os tributos NÃO ficam soltos no item
        expect(item).not.toHaveProperty('vICMS');
        expect(item).not.toHaveProperty('vIPI');
    });

    it('mantém os campos core do item e o CST/CEST fora de tributos', () => {
        const item = (formatInvoiceDetail(rawDetail()).itens as Array<Record<string, unknown>>)[0]!;
        expect(item).toMatchObject({ numeroItem: 1, quantidade: 2, valorUnitario: 500, valorTotal: 1000, cst: '10', cest: '2104700' });
    });

    it('aninha o NCM dentro de produto', () => {
        const item = (formatInvoiceDetail(rawDetail()).itens as Array<Record<string, unknown>>)[0]!;
        expect(item.produto).toMatchObject({ idUnico: '789', ncm: { codigo: '84713012', descricao: 'Máquinas' } });
        // ncm não fica solto no item
        expect(item).not.toHaveProperty('ncm');
    });

    it('extrai os total_* da NF para o bloco `totais` (sem prefixo)', () => {
        const out = formatInvoiceDetail(rawDetail());
        expect(out.totais).toEqual({ vNF: 1373.5, vICMS: 180, vIPI: 50, vDesc: 0 });
        // os total_* não vazam para o topo
        expect(out).not.toHaveProperty('total_vNF');
        expect(out).not.toHaveProperty('total_vICMS');
    });

    it('expõe cfop {codigo, descricao} no topo', () => {
        const out = formatInvoiceDetail(rawDetail());
        expect(out.cfop).toEqual({ codigo: '6102', descricao: 'Venda interestadual' });
    });

    it('preserva os campos de topo (chave, status, emitente, destinatário)', () => {
        const out = formatInvoiceDetail(rawDetail());
        expect(out).toMatchObject({ chaveAcesso: 'CHAVE', numero: '8', status: 'ativa', valorTotal: 1373.5 });
        expect(out.emitente).toMatchObject({ cnpj: '14200166000187' });
        expect(out.destinatario).toMatchObject({ cnpj: '99999999000191' });
    });

    it('lida com NF sem cfop, sem itens e sem totais', () => {
        const out = formatInvoiceDetail({ chaveAcesso: 'X', status: 'ativa' });
        expect(out).not.toHaveProperty('cfop');
        expect(out.itens).toEqual([]);
        expect(out.totais).toEqual({});
    });
});
