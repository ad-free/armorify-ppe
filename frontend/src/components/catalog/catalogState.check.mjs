import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run from frontend: node src/components/catalog/catalogState.check.mjs
const source = readFileSync(new URL('./catalogState.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { readCatalogState, clearCatalogFilters, updateCatalogParams } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const params = new URLSearchParams('q=gloves&brand_id=brand&price_min=0&price_max=500&page=3&limit=12&sort_by=price_asc');
const cleared = clearCatalogFilters(params);
assert.equal(cleared.get('q'), 'gloves', 'Reset must preserve the search term');
assert.equal(cleared.get('sort_by'), 'price_asc', 'Reset must preserve sort');
assert.equal(cleared.get('limit'), '12');
assert.equal(cleared.has('brand_id'), false);
assert.equal(cleared.has('price_min'), false);
assert.equal(cleared.has('page'), false, 'Changed filters must restart pagination');
const changed = updateCatalogParams(params, { brand_id: 'other' });
assert.equal(changed.get('q'), 'gloves');
assert.equal(changed.has('page'), false);
assert.equal(params.get('page'), '3', 'URL snapshots must not be mutated');
const state = readCatalogState(params);
assert.equal(state.request.skip, 24);
assert.equal(state.request.price_min, 0);
assert.equal(state.request.sort_by, 'price_asc');
for (const invalid of ['price_min=-1', 'price_max=NaN', 'price_min=10&price_max=5', 'rating_min=6']) {
  assert.ok(readCatalogState(new URLSearchParams(invalid)).error, invalid);
}
for (const invalidPage of ['NaN', '-1', '1.5', 'Infinity', '999999999999999999999']) {
  assert.equal(readCatalogState(new URLSearchParams(`page=${invalidPage}`)).request.skip, 0);
}
console.log('Catalog URL preservation and boundary regression check passed');
