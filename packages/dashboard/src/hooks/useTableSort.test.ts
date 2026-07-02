import { describe, it, expect } from 'vitest';
import { sortRows, ariaSortFor, type SortState } from './useTableSort.js';

interface Row {
    nome: string;
    total: number | null;
}

const rows: Row[] = [
    { nome: 'Beta', total: 30 },
    { nome: 'Alpha', total: 10 },
    { nome: 'Gamma', total: null },
    { nome: 'delta', total: 200 },
];

const accessors = {
    nome: (r: Row) => r.nome,
    total: (r: Row) => r.total,
};

describe('sortRows (ordenação client-side, NOTA-87)', () => {
    it('sem coluna selecionada retorna a lista original inalterada', () => {
        const out = sortRows(rows, { key: null, direction: 'asc' }, accessors);
        expect(out).toBe(rows);
    });

    it('ordena números ascendente', () => {
        const out = sortRows(rows, { key: 'total', direction: 'asc' }, accessors);
        expect(out.map((r) => r.total)).toEqual([10, 30, 200, null]);
    });

    it('ordena números descendente com ausentes ainda no fim', () => {
        const out = sortRows(rows, { key: 'total', direction: 'desc' }, accessors);
        expect(out.map((r) => r.total)).toEqual([200, 30, 10, null]);
    });

    it('ordena strings com localeCompare pt-BR (case-insensitive por padrão do locale)', () => {
        const out = sortRows(rows, { key: 'nome', direction: 'asc' }, accessors);
        expect(out.map((r) => r.nome)).toEqual(['Alpha', 'Beta', 'delta', 'Gamma']);
    });

    it('não muta a lista de entrada', () => {
        const before = rows.map((r) => r.nome);
        sortRows(rows, { key: 'nome', direction: 'desc' }, accessors);
        expect(rows.map((r) => r.nome)).toEqual(before);
    });
});

describe('ariaSortFor', () => {
    it('none quando a coluna não é a ordenada', () => {
        const state: SortState<'nome' | 'total'> = { key: 'total', direction: 'asc' };
        expect(ariaSortFor(state, 'nome')).toBe('none');
    });

    it('ascending/descending para a coluna ativa', () => {
        expect(ariaSortFor({ key: 'total', direction: 'asc' }, 'total')).toBe('ascending');
        expect(ariaSortFor({ key: 'total', direction: 'desc' }, 'total')).toBe('descending');
    });
});
