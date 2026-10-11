import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../../lib/api.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('api.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.flatMap((node) => ts.isVariableStatement(node) ? [...node.declarationList.declarations] : [])
  .find((node) => node.name.getText(ast) === 'getMediaUrl');
const output = ts.transpileModule(`const ${declaration.getText(ast)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const getMediaUrl = new Function('SERVER_ORIGIN', `${output}; return getMediaUrl;`)('http://127.0.0.1:8006');
assert.equal(getMediaUrl('/static/product-images/cover.png'), 'http://127.0.0.1:8006/static/product-images/cover.png');
assert.equal(getMediaUrl('http://old-server:8000/static/uploads/legacy.jpg'), 'http://127.0.0.1:8006/static/uploads/legacy.jpg');
assert.equal(getMediaUrl('https://media.example.com/legacy.jpg'), 'https://media.example.com/legacy.jpg');
assert.equal(getMediaUrl(null), '');
console.log('Managed, legacy static and external media URL checks passed');
