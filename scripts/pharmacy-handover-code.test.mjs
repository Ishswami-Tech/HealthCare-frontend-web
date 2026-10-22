// Hand-over code parsing (N9): typed 6 digits, pasted / wedge-scanned QR text `TBD-HO:<id>:<code>`.
// Run: node --test scripts/pharmacy-handover-code.test.mjs  (Node >= 23.6 strips the TS types)
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HANDOVER_INPUT_MAX_LENGTH,
  normalizeHandoverInput,
  parseHandoverCode,
} from '../src/lib/pharmacy/pharmacy-ops.logic.ts';

const ID = '3f2b8c1e-5d4a-4b7e-9c2d-1a2b3c4d5e6f';

test('a typed 6-digit code is an OTP', () => {
  assert.deepEqual(parseHandoverCode('123456'), { code: '123456', method: 'OTP' });
  assert.deepEqual(parseHandoverCode(' 123 456 '), { code: '123456', method: 'OTP' });
});

test('the QR text is sent whole (prefix upper-cased, id lower-cased) as a QR', () => {
  assert.deepEqual(parseHandoverCode(`TBD-HO:${ID}:654321`), { code: `TBD-HO:${ID}:654321`, method: 'QR' });
  assert.deepEqual(parseHandoverCode(`tbd-ho:${ID.toUpperCase()}:654321`), {
    code: `TBD-HO:${ID}:654321`,
    method: 'QR',
  });
});

test('scanner / paste noise (line breaks, tabs, spaces) is dropped', () => {
  assert.deepEqual(parseHandoverCode(`\tTBD-HO:${ID}:654321\r\n`), { code: `TBD-HO:${ID}:654321`, method: 'QR' });
  assert.equal(normalizeHandoverInput(` TBD-HO:${ID}:654321\n`), `TBD-HO:${ID}:654321`);
});

test('anything else is rejected', () => {
  assert.equal(parseHandoverCode('12345'), null);
  assert.equal(parseHandoverCode('1234567'), null);
  assert.equal(parseHandoverCode('TBD-HO:not-a-uuid:123456'), null);
  assert.equal(parseHandoverCode(`TBD-HO:${ID}:12345`), null);
  assert.equal(parseHandoverCode(''), null);
});

test('the field is long enough for the QR text', () => {
  assert.ok(`TBD-HO:${ID}:654321`.length <= HANDOVER_INPUT_MAX_LENGTH);
  assert.equal(normalizeHandoverInput('9'.repeat(100)).length, HANDOVER_INPUT_MAX_LENGTH);
});
