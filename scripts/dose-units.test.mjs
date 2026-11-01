// Prescribe-time dose units: amount + a unit valid for the medicine's dosage form.
// Run: node --test scripts/dose-units.test.mjs  (Node >= 23.6 strips the TS types)
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AS_DIRECTED_DOSE,
  defaultDoseForForm,
  doseConflictWarning,
  doseFormOf,
  doseRuleFor,
  formatDose,
  parseAmount,
  parseDose,
  unitsNamedIn,
} from '../src/components/doctor/rx/dose-units.logic.ts';

test('forms map to the units the prompt asks for', () => {
  assert.deepEqual(doseRuleFor('CHURNA').units, ['g', 'teaspoon', 'pinch']);
  for (const form of ['VATI', 'GUTIKA', 'TABLET']) assert.deepEqual(doseRuleFor(form).units, ['tablet']);
  assert.deepEqual(doseRuleFor('CAPSULE').units, ['capsule']);
  for (const form of ['ARISHTA', 'ASAVA', 'SYRUP']) assert.deepEqual(doseRuleFor(form).units, ['ml', 'teaspoon', 'tablespoon']);
  assert.ok(doseRuleFor('YAVKUT_KWATH').units.includes('ml'));
  assert.deepEqual(doseRuleFor('GHRITA').units, ['teaspoon', 'g']);
  assert.ok(doseRuleFor('AVALEHA').units.includes('g'));
  assert.deepEqual(doseRuleFor('OIL').units.slice(0, 2), ['drop', 'ml']);
});

test('form spellings normalise; unknown / blank / OTHER keep free text', () => {
  assert.equal(doseFormOf('Yavkut Kwath'), 'YAVKUT_KWATH');
  assert.equal(doseFormOf('yavkut-kwath'), 'YAVKUT_KWATH');
  assert.equal(doseFormOf('kwath'), 'YAVKUT_KWATH');
  assert.equal(doseFormOf('taila'), 'OIL');
  assert.equal(doseFormOf('churna'), 'CHURNA');
  for (const value of ['OTHER', '', 'Units', 'General', null, undefined, 42]) assert.equal(doseFormOf(value), null);
  assert.equal(defaultDoseForForm('OTHER'), null);
});

test('amounts: whole, decimal, fraction, mixed, unicode; never zero or text', () => {
  assert.equal(parseAmount('2'), 2);
  assert.equal(parseAmount('2.5'), 2.5);
  assert.equal(parseAmount('1/2'), 0.5);
  assert.equal(parseAmount('1 1/2'), 1.5);
  assert.equal(parseAmount('½'), 0.5);
  assert.equal(parseAmount('1½'), 1.5);
  for (const bad of ['', '0', '0/2', '1/0', 'two', '-1', '1/', '2 tabs']) assert.equal(parseAmount(bad), null, bad);
});

test('formatDose writes a clean string with the right plural', () => {
  assert.equal(formatDose('2', 'g'), '2 g');
  assert.equal(formatDose('1', 'tablet'), '1 tablet');
  assert.equal(formatDose('2', 'tablet'), '2 tablets');
  assert.equal(formatDose('1/2', 'tablet'), '1/2 tablet');
  assert.equal(formatDose('1 1/2', 'teaspoon'), '1 1/2 teaspoons');
  assert.equal(formatDose('2', 'pinch'), '2 pinches');
  assert.equal(formatDose('10', 'ml'), '10 ml');
  assert.equal(formatDose('', 'ml'), '');
  assert.equal(formatDose('abc', 'ml'), '');
});

test('parseDose reads saved doses back into amount + unit when they fit the form', () => {
  assert.deepEqual(parseDose('1 tablet', 'TABLET'), { mode: 'units', amount: '1', unit: 'tablet' });
  assert.deepEqual(parseDose('1 tab', 'VATI'), { mode: 'units', amount: '1', unit: 'tablet' });
  assert.deepEqual(parseDose('3 gm', 'CHURNA'), { mode: 'units', amount: '3', unit: 'g' });
  assert.deepEqual(parseDose('10ml', 'ARISHTA'), { mode: 'units', amount: '10', unit: 'ml' });
  assert.deepEqual(parseDose('1/2 tsp', 'CHURNA'), { mode: 'units', amount: '1/2', unit: 'teaspoon' });
  assert.deepEqual(parseDose(AS_DIRECTED_DOSE, 'OINTMENT'), { mode: 'asDirected' });
  // A conflicting unit or extra words stay as typed; no form means free text.
  assert.deepEqual(parseDose('2 tablets', 'CHURNA'), { mode: 'other', text: '2 tablets' });
  assert.deepEqual(parseDose('1 tsp with honey', 'CHURNA'), { mode: 'other', text: '1 tsp with honey' });
  assert.deepEqual(parseDose('1 tablet', 'OTHER'), { mode: 'other', text: '1 tablet' });
});

test('conflict warning: the two reported cases, and no false alarms', () => {
  assert.match(doseConflictWarning('2 tablets', 'CHURNA'), /"tablet" does not fit Churna\. Usual units: g, teaspoons, pinches/);
  assert.match(doseConflictWarning('1 capsule', 'TABLET'), /"capsule" does not fit Tablet/);
  assert.match(doseConflictWarning('2tabs', 'ARISHTA'), /"tablet"/);
  assert.match(doseConflictWarning('5 ml', 'OINTMENT'), /as directed/);
  assert.equal(doseConflictWarning('1 tsp with warm water', 'CHURNA'), null);
  assert.equal(doseConflictWarning('2 g', 'CHURNA'), null);
  assert.equal(doseConflictWarning('As per chart', 'CHURNA'), null);
  assert.equal(doseConflictWarning('2 tablets', 'OTHER'), null);
  assert.equal(doseConflictWarning('2 tablets', ''), null);
  assert.deepEqual(unitsNamedIn('e.g. 2 tabs'), ['tablet']);
});

test('defaults per form; bhasma no longer defaults to a teaspoon; injection asks for the amount', () => {
  assert.equal(defaultDoseForForm('CHURNA'), '1 teaspoon');
  assert.equal(defaultDoseForForm('VATI'), '1 tablet');
  assert.equal(defaultDoseForForm('CAPSULE'), '1 capsule');
  assert.equal(defaultDoseForForm('ARISHTA'), '10 ml');
  assert.equal(defaultDoseForForm('GHRITA'), '1 teaspoon');
  assert.equal(defaultDoseForForm('BHASMA'), '1 pinch');
  assert.equal(defaultDoseForForm('DROPS'), '1 drop');
  assert.equal(defaultDoseForForm('OIL'), AS_DIRECTED_DOSE);
  assert.equal(defaultDoseForForm('INJECTION'), '');
  // Every default is itself a valid dose for its form.
  for (const form of ['CHURNA', 'VATI', 'CAPSULE', 'ARISHTA', 'GHRITA', 'BHASMA', 'DROPS', 'OIL', 'CREAM']) {
    assert.notEqual(parseDose(defaultDoseForForm(form), form).mode, 'other', form);
  }
});
