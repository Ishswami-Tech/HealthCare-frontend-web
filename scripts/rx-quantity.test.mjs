// Prescribe-time quantity: dose amount x doses a day x days for tablets / capsules, sale units
// (packs / bottles) for measured doses, and a soft warning for an implausible amount per dose.
// Run: node --test scripts/rx-quantity.test.mjs  (Node >= 23.6 strips the TS types)
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  doseAmountOf,
  doseAmountWarning,
  dosesPerDay,
  quantityBasisFor,
  quantityUnitLabel,
  suggestedQuantityFor,
} from '../src/components/doctor/rx/dose-units.logic.ts';

const qty = (dosage, frequency, days, dosageForm, saleUnit) =>
  suggestedQuantityFor({ dosage, frequency, days, dosageForm, saleUnit });

test('tablets count the dose amount (D3: 2 tablets twice a day for 5 days = 20, not 10)', () => {
  assert.equal(qty('2 tablets', 'Twice a day, after meal', '5', 'TABLET'), '20');
  assert.equal(qty('1 tablet', 'Twice a day, after meal', '5', 'TABLET'), '10');
  assert.equal(qty('1/2 tablet', 'Twice a day', '5', 'VATI'), '5');
  assert.equal(qty('1 1/2 tablets', 'Three times a day', '3', 'GUTIKA'), '14');
  assert.equal(qty('2 capsules', 'Once a day, at night', '7', 'CAPSULE'), '14');
  assert.equal(qty('1 tablet', 'Once a week', '28', 'TABLET'), '4');
  // A stock unit that is the tablet itself keeps counting tablets.
  assert.equal(qty('2 tabs', 'Twice a day', '5', 'TABLET', 'tablets'), '20');
});

test('quantity cannot be worked out: when needed, no days', () => {
  assert.equal(qty('1 tablet', 'When needed', '5', 'TABLET'), '');
  assert.equal(qty('1 tablet', 'Twice a day', '', 'TABLET'), '');
  assert.equal(qty('1 tablet', 'Twice a day', '0', 'TABLET'), '');
  assert.equal(dosesPerDay('Four times a day'), 4);
});

test('measured doses are sold by the pack / bottle: quantity starts at 1 sale unit', () => {
  // D3: churna 3 g twice a day for 7 days gave 14 (doses), billed as 14 packs.
  assert.equal(qty('3 g', 'Twice a day, after meal', '7', 'CHURNA'), '1');
  assert.equal(qty('1 teaspoon', 'Twice a day', '10', 'CHURNA', 'pack'), '1');
  assert.equal(qty('10 ml', 'Twice a day', '10', 'ARISHTA'), '1');
  assert.equal(qty('Apply as directed', 'Twice a day', '10', 'OINTMENT'), '1');
  // A tablet sold by the strip / bottle cannot be counted from the dose either.
  assert.equal(qty('2 tablets', 'Twice a day', '5', 'TABLET', 'strip'), '1');
  // Sold in the unit it is dosed in (a churna sold by the gram): counted out.
  assert.equal(qty('3 g', 'Twice a day', '7', 'CHURNA', 'g'), '42');
});

test('no recorded form: the typed dose unit decides; an older "1 dose" line counts doses', () => {
  assert.equal(quantityBasisFor('2 tablets', null), 'count');
  assert.equal(qty('2 tablets', 'Twice a day', '5', null), '20');
  assert.equal(quantityBasisFor('5 ml', ''), 'saleUnit');
  assert.equal(qty('5 ml', 'Twice a day', '5', ''), '1');
  assert.equal(quantityBasisFor('1 dose', undefined), 'doses');
  assert.equal(qty('1 dose', 'Twice a day', '5', undefined), '10');
});

test('the label next to Qty says what it counts', () => {
  assert.equal(quantityUnitLabel('2 tablets', 'TABLET', null, 20), 'tablets');
  assert.equal(quantityUnitLabel('1 tablet', 'TABLET', null, 1), 'tablet');
  assert.equal(quantityUnitLabel('1 capsule', 'CAPSULE', '', 10), 'capsules');
  assert.equal(quantityUnitLabel('3 g', 'CHURNA', null, 2), 'packs');
  assert.equal(quantityUnitLabel('3 g', 'CHURNA', 'pack', 1), 'pack');
  assert.equal(quantityUnitLabel('3 g', 'CHURNA', 'jar', 2), 'jars');
  assert.equal(quantityUnitLabel('3 g', 'CHURNA', '100 g pack', 2), '100 g pack');
  assert.equal(quantityUnitLabel('10 ml', 'ARISHTA', null, 1), 'bottle');
  assert.equal(quantityUnitLabel('10 ml', 'SYRUP', null, 3), 'bottles');
  assert.equal(quantityUnitLabel('3 g', 'CHURNA', 'g', 42), 'g');
  assert.equal(quantityUnitLabel('1 dose', null, null, 10), '');
});

test('soft warning for an implausible amount in one dose; normal doses are quiet', () => {
  assert.match(doseAmountWarning('20 tablets'), /20 tablets in one dose is more than usual \(up to 4 tablets\)/);
  assert.match(doseAmountWarning('12 g'), /up to 10 g/);
  assert.match(doseAmountWarning('40 ml'), /up to 30 ml/);
  assert.match(doseAmountWarning('6 capsules'), /up to 4 capsules/);
  for (const ok of ['1 tablet', '4 tablets', '1/2 tablet', '3 g', '10 g', '30 ml', '1 teaspoon', 'Apply as directed', '1 tsp with honey', '']) {
    assert.equal(doseAmountWarning(ok), null, ok);
  }
});

test('doseAmountOf reads amount + unit, nothing else', () => {
  assert.deepEqual(doseAmountOf('2 tablets'), { amount: 2, unit: 'tablet' });
  assert.deepEqual(doseAmountOf('1 1/2 tsp'), { amount: 1.5, unit: 'teaspoon' });
  assert.deepEqual(doseAmountOf('10ml'), { amount: 10, unit: 'ml' });
  assert.equal(doseAmountOf('1 tsp with honey'), null);
  assert.equal(doseAmountOf('two tablets'), null);
});
