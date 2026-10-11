import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run from frontend: node src/pages/admin/catalogWorkflow.check.mjs
const workflow = readFileSync(new URL('./catalogWorkflow.ts', import.meta.url), 'utf8');
const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const load = source => import(`data:text/javascript;base64,${Buffer.from(transpile(source)).toString('base64')}`);
const { readCatalogParams, updateCatalogParams, catalogFailure, boundedCatalogJson, specificationPayload } = await load(workflow);
const params = new URLSearchParams('q=helmet&category_id=cat&brand_id=brand&is_active=false&is_featured=true&is_new=false&low_stock=true&variant_mode=with&sort_by=stock_asc&page=3&limit=50');
assert.deepEqual(readCatalogParams(params), { page: 3, limit: 50, request: { skip: 100, limit: 50, sort_by: 'stock_asc', q: 'helmet', category_id: 'cat', brand_id: 'brand', is_active: false, is_featured: true, is_new: false, low_stock: true, variant_mode: 'with' } });
const filtered = updateCatalogParams(params, 'q', 'gloves');
assert.equal(filtered.has('page'), false);
assert.equal(filtered.get('low_stock'), 'true');
assert.equal(params.get('q'), 'helmet');
assert.equal(updateCatalogParams(params, 'page', '4').get('page'), '4');
assert.equal(updateCatalogParams(params, 'brand_id', '').has('brand_id'), false);
assert.deepEqual(readCatalogParams(new URLSearchParams(params.toString())), readCatalogParams(params));
for (const page of ['0', '-1', '1.5', 'Infinity', 'NaN', '999999999999999999']) assert.equal(readCatalogParams(new URLSearchParams(`page=${page}`)).page, 1);
assert.equal(readCatalogParams(new URLSearchParams('sort_by=__proto__&limit=999')).request.sort_by, 'newest');
assert.equal(readCatalogParams(new URLSearchParams('is_active=yes&variant_mode=no')).request.is_active, undefined);
assert.equal(catalogFailure({ status: 409, details: [{ loc: ['body', 'expected_version'], msg: 'Changed', type: 'stale_version' }] }).stale, true);
const cart = catalogFailure({ status: 409, details: [{ loc: ['body', 'confirm_cart_impact'], msg: 'Confirm', type: 'cart_impact' }] });
assert.equal(cart.cartImpact, true); assert.equal(cart.stale, false);
assert.equal(catalogFailure({ status: 409, details: [{ loc: ['body', 'sku'], msg: 'Duplicate', type: 'duplicate_sku' }] }).stale, false);
assert.deepEqual(catalogFailure({ status: 422, details: [{ loc: ['body', 'reason'], msg: 'Required' }] }).fields, { reason: 'Required' });
assert.equal(boundedCatalogJson(' '), null);
assert.equal(JSON.stringify(boundedCatalogJson('{" size ":" M ","number":3,"flag":false}')), '{"size":"M","number":3,"flag":false}');
assert.equal(boundedCatalogJson('{"__proto__":"retained"}').__proto__, 'retained');
for (const value of ['[]', 'null', '{"a":{}}', '{"a":[]}', '{"a":" "}', '{" A ":1,"a":2}', '{"a":1e100}', '{"a":"\\u0000"}', JSON.stringify({ a: 'x'.repeat(513) }), JSON.stringify(Object.fromEntries(Array.from({ length: 33 }, (_, i) => [String(i), true]))), JSON.stringify(Object.fromEntries(Array.from({ length: 32 }, (_, i) => [String(i), 'x'.repeat(512)])))]) assert.throws(() => boundedCatalogJson(value));

assert.equal(JSON.stringify(specificationPayload([{ key: ' QA note ', value: ' Administrator fact ' }, { key: 'count', value: 0 }])), '{"QA note":"Administrator fact","count":0}');
for (const rows of [[{ key: ' Fact ', value: 'one' }, { key: 'fact', value: 'two' }], [{ key: '', value: 'Missing key' }], [{ key: 'fact', value: '' }], Array.from({ length: 33 }, (_, i) => ({ key: String(i), value: 'value' }))]) assert.throws(() => specificationPayload(rows));
console.log('Catalog URL state, bounded specification rows/JSON and conflict classification checks passed');
