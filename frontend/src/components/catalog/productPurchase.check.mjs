import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run from frontend: node src/components/catalog/productPurchase.check.mjs
const source = readFileSync(new URL('./productPurchase.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { purchaseState, variantLabel } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const product = { id: 'p', price: 100, stock: 999, available_stock: 10, has_variants: false, is_flash_deal: false };
const variants = [
  { id: 'm-blue', product_id: 'p', sku: 'M-BLUE', size: 'M', color: 'Blue', attributes: { material: 'Nitrile' }, price_override: '120', stock: 3, available_stock: 3, is_active: true },
  { id: 'l-red', product_id: 'p', sku: 'L-RED', size: 'L', color: 'Red', stock: 0, available_stock: 0, is_active: true },
  { id: 'inactive', product_id: 'p', stock: 5, available_stock: 5, is_active: false },
  { id: 'foreign', product_id: 'other', stock: 5, available_stock: 5, is_active: true },
];
const state = (options, id = '', quantity = 1, inCart = 0) => purchaseState({ ...product, has_variants: !!options?.length }, options, id, quantity, inCart, 0);
for (const id of ['', 'missing', 'inactive', 'foreign', 'l-red']) assert.equal(state(variants, id).canPurchase, false, `Reject ${id || 'incomplete'} selection`);
assert.equal(state(undefined).canPurchase, false, 'Do not treat unknown options as a variant-free product');
assert.equal(state([]).canPurchase, true, 'Variant-free product remains purchasable');
assert.equal(state(variants, 'm-blue').price, 120);
assert.equal(state(variants, 'm-blue').stock, 3);
assert.equal(state(variants, 'm-blue').variant.sku, 'M-BLUE');
assert.equal(state(variants, 'm-blue', 3).canPurchase, true);
for (const quantity of [0, -1, 1.5, NaN, Infinity, 4]) assert.equal(state(variants, 'm-blue', quantity).canPurchase, false);
assert.equal(state(variants, 'm-blue', 1, 3).canPurchase, false, 'Repeated additions cannot exceed stock');
assert.equal(state(variants, 'm-blue', 1, 2).canPurchase, true);
assert.equal(purchaseState({ ...product, available_stock: 0 }, [], '', 1, 0, 0).canPurchase, false);
assert.equal(purchaseState({ ...product, has_variants: true }, [], '', 1, 0, 0).canPurchase, false, 'An empty or stale variant response must not sell base stock');
assert.equal(purchaseState(product, [], 'stale-selection', 1, 0, 0).canPurchase, false);
assert.equal(purchaseState({ ...product, has_variants: true }, [{ ...variants[0], price_override: '-1' }], 'm-blue', 1, 0, 0).canPurchase, false);
assert.equal(purchaseState({ ...product, has_variants: true }, [{ ...variants[0], price_override: '0' }], 'm-blue', 1, 0, 0).price, 0);
const sale = { ...product, has_variants: true, is_flash_deal: true, flash_deal_end: '2030-01-01', flash_sale_price: '90', flash_sale_discount: 10 };
assert.equal(purchaseState(sale, variants, 'm-blue', 1, 0, 0).price, 108, 'API base sale price must not replace the discounted variant override');
assert.equal(purchaseState({ ...sale, has_variants: false }, [], '', 1, 0, 0).price, 90);
assert.equal(purchaseState({ ...sale, flash_sale_discount: 0, flash_sale_price: '70' }, variants, 'm-blue', 1, 0, 0).price, 70, 'Fixed-price campaign without percentage');
assert.equal(purchaseState(sale, variants, 'm-blue', 1, 0, Date.parse('2031-01-01')).price, 120, 'Expired promotions do not enter cart');
assert.equal(variantLabel(variants[0]), 'M · Blue · material: Nitrile · M-BLUE');
const factsSource = readFileSync(new URL('./productFacts.ts', import.meta.url), 'utf8');
const factsCode = ts.transpileModule(factsSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { normalizeSpecs } = await import(`data:text/javascript;base64,${Buffer.from(factsCode).toString('base64')}`);
assert.deepEqual(normalizeSpecs(null), []);
assert.deepEqual(normalizeSpecs({ standards: ['EN 388', 'EN 420'], count: 0, empty: '', bad: Infinity }), [
  { label: 'standards', value: 'EN 388, EN 420' }, { label: 'count', value: '0' },
]);
assert.deepEqual(normalizeSpecs([{ name: 'material', value: ' Nitrile ' }, { name: {}, value: 'invalid' }, { name: 'empty', value: null }]), [{ label: 'material', value: 'Nitrile' }]);
console.log('Product purchase selection, stock, quantity and price checks passed');
