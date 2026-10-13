import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
// Render the real card with inert app dependencies; inventory must come from the API balance.
const card = ast.statements.find((node) => ts.isVariableStatement(node) && node.declarationList.declarations.some((declaration) => declaration.name.getText(ast) === 'ProductCard'));
assert.ok(card, 'The check must exercise the real card component');
const cardCode = ts.transpileModule(`${helper.getText(ast)}\n${card.getText(ast)}`, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText.replace(/^export /gm, '');
const Button = ({ children, ...props }) => React.createElement('button', props, children);
const Link = ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children);
const ProductCard = new Function('React', 'Link', 'Button', 'useTranslation', 'useAuthStore', 'useWishlistStore', 'formatCurrency', 'getMediaUrl', 'StarRating', 'Heart', 'Eye', `${cardCode}; return ProductCard;`)(
  React, Link, Button, () => ({ i18n: { language: 'vi' } }), () => ({ user: null }),
  () => ({ toggleItem() {}, isInWishlist: () => false }), String, (url) => url, () => null, () => null, () => null,
);
const product = { id: 'p', slug: 'hidden-options', name: 'Hidden options', price: 100, stock: 999, available_stock: 0, has_variants: true, specifications: null };
const unavailable = renderToStaticMarkup(React.createElement(ProductCard, { product }));
assert.match(unavailable, /<button[^>]*disabled=""[^>]*aria-label="Hết hàng: Hidden options"[^>]*>Hết hàng<\/button>/);
assert.doesNotMatch(unavailable, /aria-label="Xem lựa chọn:/, 'Historical base stock cannot enable the purchase action');
assert.doesNotMatch(unavailable, /Còn hàng/);
const available = renderToStaticMarkup(React.createElement(ProductCard, { product: { ...product, stock: 0, available_stock: 3 } }));
assert.match(available, /Còn hàng \(3\)/);
assert.match(available, /aria-label="Xem lựa chọn: Hidden options"/);
console.log('ProductCard scalar facts and authoritative out-of-stock rendering checks passed');
