import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Run from frontend: node src/pages/admin/orderWorkflow.check.mjs
const source = readFileSync(new URL('./orderWorkflow.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { readOrderParams, updateOrderParams, orderActionRequest, orderMutationFailure, actionImplications, formatShipmentEvidence, shipmentFields } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

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
assert.equal(orderActionRequest('note', 8, { note: ' \r\nDòng một\r\n\tDòng hai\n ' }).note, 'Dòng một\n\tDòng hai', 'Normalize CRLF without collapsing multiline/tab formatting');
assert.equal(orderActionRequest('note', 8, { note: ` \n${'a'.repeat(2000)}\t ` }).note.length, 2000, 'Limit applies after trimming');
assert.equal(orderActionRequest('note', 8, { note: `${'a'.repeat(1998)}\r\nb` }).note, `${'a'.repeat(1998)}\nb`, 'A CRLF note at the normalized 2000-character boundary remains valid');
assert.throws(() => orderActionRequest('note', 8, { note: `${'a'.repeat(1999)}\r\nb` }), (error) => error.status === 422, 'Normalized 2001-character notes are rejected');
assert.equal(Array.from(orderActionRequest('note', 8, { note: '😀'.repeat(2000) }).note).length, 2000, 'Unicode characters count like the server, not UTF-16 code units');
for (const note of ['', ' \n\t ', 'a'.repeat(2001), '😀'.repeat(2001)]) {
  assert.throws(() => orderActionRequest('note', 8, { note }), (error) => error.status === 422 && Boolean(orderMutationFailure(error).fields.note));
}
for (const unsafe of ['\r', '\0', '\x01', '\x7f', '\x85', '\u200b', '\u202e', '\u2066', '\ufeff', '\ud800', '\ue000', '\u0378']) {
  for (const note of [`a${unsafe}b`, `${unsafe}valid`, `valid${unsafe}`]) {
    assert.throws(() => orderActionRequest('note', 8, { note }), (error) => error.status === 422 && Boolean(orderMutationFailure(error).fields.note), 'Unsafe Unicode C characters must not disappear through trimming');
  }
}

const historical = { status: 'shipped', payment_status: 'unpaid', fulfillment_status: 'shipped' };
const previousShipment = { ...historical, carrier_name: 'Carrier A', tracking_number: 'OLD', shipped_at: '2026-01-02T03:04:05+00:00', delivered_at: null };
const newShipment = { ...previousShipment, carrier_name: 'Carrier B', tracking_number: 'NEW' };
assert.deepEqual(['carrier_name', 'tracking_number'].map((field) => [
  formatShipmentEvidence(previousShipment, field), formatShipmentEvidence(newShipment, field),
]), [['Carrier A', 'Carrier B'], ['OLD', 'NEW']], 'Tracking changes retain both sides, not the current order');
const clearedShipment = { ...newShipment, carrier_name: null, tracking_number: null };
assert.equal(formatShipmentEvidence(clearedShipment, 'carrier_name'), 'Không có');
assert.equal(formatShipmentEvidence(clearedShipment, 'tracking_number'), 'Không có', 'Removal is explicit evidence, not missing history');
const deliveredShipment = { ...clearedShipment, delivered_at: '2026-01-03T06:07:08Z' };
assert.equal(formatShipmentEvidence(previousShipment, 'shipped_at'), new Date(previousShipment.shipped_at).toLocaleString('vi-VN'));
assert.equal(formatShipmentEvidence(previousShipment, 'delivered_at'), 'Không có');
assert.equal(formatShipmentEvidence(deliveredShipment, 'delivered_at'), new Date(deliveredShipment.delivered_at).toLocaleString('vi-VN'));
assert.equal(formatShipmentEvidence({ ...historical, shipped_at: 'invalid' }, 'shipped_at'), 'Thời điểm chưa xác định');
for (const [field] of shipmentFields) {
  assert.equal(formatShipmentEvidence(historical, field), 'Chưa được lưu trong lịch sử');
  assert.equal(formatShipmentEvidence(null, field), 'Chưa được lưu trong lịch sử');
  assert.notEqual(formatShipmentEvidence(historical, field), formatShipmentEvidence({ ...historical, [field]: null }, field), 'Absent historical keys must never fabricate null evidence');
}
assert.deepEqual(orderActionRequest('tracking', 9, { carrier_name: '  Carrier  ', tracking_number: '  ' }), { action: 'tracking', expected_version: 9, carrier_name: 'Carrier', tracking_number: null });
assert.deepEqual(orderActionRequest('ship', 10), { action: 'ship', expected_version: 10, carrier_name: null, tracking_number: null });
assert.deepEqual(orderMutationFailure({ status: 409, details: { field: 'expected_version', message: 'Changed' } }).fields, { expected_version: 'Changed' });
assert.equal(orderMutationFailure({ status: 409 }).conflict, true, 'Stale and transition conflicts require reload, not replay');
assert.equal(orderMutationFailure({ status: 422 }).conflict, false);
assert.deepEqual(orderMutationFailure({ status: 422, details: [{ loc: ['body', 'note'], msg: 'Required' }] }).fields, { note: 'Required' });
console.log('Admin order URL, action payload, note validation, shipment evidence, and stale conflict checks passed');
