// @notagrafo/core — public entrypoint.
// Tipos do schema de dados (seção 5 do 01 schema dados.md).
// Implementação real (parser, validator) chega ao longo da Sprint 2.
export * from './types/nf.types.js';
export * from './utils/product.utils.js';
export * from './utils/lgpd.utils.js';
export * from './catalog/ncm.catalog.js';
export * from './catalog/cfop.catalog.js';
export * from './parser/xsd.registry.js';
export * from './parser/nfe.validator.js';
export * from './parser/nfe.parser.js';
