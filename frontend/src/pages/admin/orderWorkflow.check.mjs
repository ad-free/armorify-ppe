import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run from frontend: node src/pages/admin/orderWorkflow.check.mjs
const source = readFileSync(new URL('./orderWorkflow.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { readOrderParams, updateOrderParams, orderActionRequest, orderMutationFailure, actionImplications } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const params = new URLSearchParams('search=0901234567&status=confirmed&payment_status=unpaid&fulfillment_status=processing&from_date=2026-01-01&to_date=2026-02-01&sort_by=total_amount&sort_order=asc&page=3&page_size=50');
const changed = updateOrderParams(params, { status: 'shipped' });
assert.equal(changed.get('search'), '0901234567');
assert.equal(changed.get('sort_by'), 'total_amount');
assert.equal(changed.get('page_size'), '50');
assert.equal(changed.has('page'), false, 'A filter change starts from page one');
assert.equal(params.get('page'), '3', 'Do not mutate the URL snapshot');
const nextPage = updateOrderParams(params, { page: 4 });
assert.equal(nextPage.get('status'), 'confirmed');
assert.equal(nextPage.get('page'), '4');
const removed = updateOrderParams(params, { search: null });
assert.equal(removed.has('search'), false);
assert.equal(removed.get('payment_status'), 'unpaid');
const detailQuery = params.toString();
assert.deepEqual(readOrderParams(new URLSearchParams(detailQuery)), readOrderParams(params), 'List/detail/back preserve the URL request');
assert.deepEqual(readOrderParams(params).request, { search: '0901234567', status: 'confirmed', payment_status: 'unpaid', fulfillment_status: 'processing', from_date: '2026-01-01', to_date: '2026-02-01', sort_by: 'total_amount', sort_order: 'asc', page: 3, page_size: 50 });
for (const invalid of ['page=-1', 'page=1.5', 'page=Infinity', 'page=NaN', 'page=999999999999999999']) assert.equal(readOrderParams(new URLSearchParams(invalid)).request.page, 1);
for (const invalid of ['from_date=2026-02-30', 'from_date=no', 'from_date=2026-02-01&to_date=2026-01-01']) assert.ok(readOrderParams(new URLSearchParams(invalid)).error);
assert.equal(readOrderParams(new URLSearchParams('sort_by=__proto__&status=garbage&page_size=10000')).request.sort_by, 'created_at');
assert.equal(readOrderParams(new URLSearchParams('payment_status=unknown')).request.payment_status, 'unknown');
const cancelledFilters = readOrderParams(new URLSearchParams('payment_status=cancelled&fulfillment_status=cancelled')).request;
assert.equal(cancelledFilters.payment_status, 'cancelled');
assert.equal(cancelledFilters.fulfillment_status, 'cancelled');

for (const action of ['confirm', 'process', 'deliver', 'pay', 'cancel']) {
  assert.deepEqual(orderActionRequest(action, 7, { note: 'ignored', carrier_name: 'ignored', tracking_number: 'ignored' }), { action, expected_version: 7 }, 'Transition requests forbid unrelated fields');
  assert.ok(actionImplications[action]);
}
assert.deepEqual(orderActionRequest('note', 8, { note: '  internal note  ', tracking_number: 'ignored' }), { action: 'note', expected_version: 8, note: 'internal note' });
assert.deepEqual(orderActionRequest('tracking', 9, { carrier_name: '  Carrier  ', tracking_number: '  ' }), { action: 'tracking', expected_version: 9, carrier_name: 'Carrier', tracking_number: null });
assert.deepEqual(orderActionRequest('ship', 10), { action: 'ship', expected_version: 10, carrier_name: null, tracking_number: null });
assert.deepEqual(orderMutationFailure({ status: 409, details: { field: 'expected_version', message: 'Changed' } }).fields, { expected_version: 'Changed' });
assert.equal(orderMutationFailure({ status: 409 }).conflict, true, 'Stale and transition conflicts require reload, not replay');
assert.equal(orderMutationFailure({ status: 422 }).conflict, false);
assert.deepEqual(orderMutationFailure({ status: 422, details: [{ loc: ['body', 'note'], msg: 'Required' }] }).fields, { note: 'Required' });
console.log('Admin order URL, strict action payload, and stale conflict checks passed');
