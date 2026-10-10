import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run from frontend: node src/components/catalog/ProductCard.facts.check.mjs
const source = readFileSync(new URL('./ProductCard.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('ProductCard.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const helper = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'getCardFacts');
assert.ok(helper, 'The check must exercise the card’s real parser');
const { outputText } = ts.transpileModule(helper.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } });
const getCardFacts = new Function(`${outputText}; return getCardFacts;`)();

assert.deepEqual(getCardFacts(null), { unit: undefined, standards: [], details: [] });
const objectFacts = getCardFacts({ 'ĐƠN VỊ TÍNH': 'đôi', tieu_chuan: 'EN 388', material: 'Nitrile', nested: { unit: 'hộp' }, empty: '', missing: null });
assert.equal(objectFacts.unit, 'đôi');
assert.deepEqual(objectFacts.standards.map((row) => row.value), ['EN 388']);
assert.deepEqual(objectFacts.details.map((row) => row.value), ['Nitrile']);
const arrayFacts = getCardFacts([{ name: 'price_unit', value: 'cái' }, { name: 'Standards', value: 'ANSI Z87.1' }, { name: 'nested', value: ['EN 166'] }, { name: 'zero', value: 0 }, { name: 'flag', value: false }, { name: 'invalid', value: Infinity }, { name: {}, value: 'ignored' }]);
assert.equal(arrayFacts.unit, 'cái');
assert.deepEqual(arrayFacts.standards.map((row) => row.value), ['ANSI Z87.1']);
assert.deepEqual(arrayFacts.details.map((row) => row.value), ['0', 'false']);
assert.equal(getCardFacts({ category: 'Safety shoes', name: 'EN 20345 pair' }).unit, undefined);
assert.deepEqual(getCardFacts({ category: 'Safety shoes', name: 'EN 20345 pair' }).standards, []);
console.log('ProductCard scalar facts regression check passed');
