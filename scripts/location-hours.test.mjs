// Location hours editor (N5/N6): read flat + per-day hours, write only changes, never wipe.
// Run: node --test scripts/location-hours.test.mjs  (Node >= 23.6 strips the TS types)
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  editDay,
  locationChanges,
  readWeekHours,
  weekHoursError,
  writeWeekHours,
} from '../src/components/clinic/location-hours.logic.ts';

const FLAT = '{"start":"00:00","end":"23:59"}';
const basics = { name: 'Main', phone: '+919876543210', address: '1 Road', city: 'Pune', zipCode: '' };

test('flat {start,end} (also as a JSON string) opens every day with those times', () => {
  for (const value of [FLAT, JSON.stringify(FLAT), { start: '00:00', end: '23:59' }]) {
    const week = readWeekHours(value);
    assert.equal(week.sunday.open, true);
    assert.equal(week.monday.start, '00:00');
    assert.equal(week.saturday.end, '23:59');
  }
});

test('an untouched flat value round-trips to the flat form', () => {
  assert.deepEqual(writeWeekHours(readWeekHours(FLAT)), { start: '00:00', end: '23:59' });
});

test('per-day hours: closed days stay closed, split sessions are kept until edited', () => {
  const week = readWeekHours({
    Monday: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
    tuesday: { start: '10:00', end: '18:00' },
    sunday: null,
  });
  assert.equal(week.sunday.open, false);
  assert.equal(week.wednesday.open, false);
  const out = writeWeekHours(week);
  assert.deepEqual(out.monday, [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }]);
  assert.deepEqual(out.tuesday, { start: '10:00', end: '18:00' });
  assert.equal(out.sunday, null);
  const edited = writeWeekHours(editDay(week, 'monday', { end: '19:00' }));
  assert.deepEqual(edited.monday, { start: '09:00', end: '19:00' });
});

test('nothing changed -> empty PATCH body (no phone:"" and no hours)', () => {
  const week = readWeekHours(FLAT);
  assert.deepEqual(locationChanges(basics, { ...basics }, week, readWeekHours(FLAT)), {});
});

test('only the edited field is sent', () => {
  const week = readWeekHours(FLAT);
  assert.deepEqual(locationChanges(basics, { ...basics, city: ' Mumbai ' }, week, week), { city: 'Mumbai' });
  const closedSunday = editDay(week, 'sunday', { open: false });
  const changes = locationChanges(basics, basics, week, closedSunday);
  assert.deepEqual(Object.keys(changes), ['workingHours']);
  assert.equal(changes.workingHours.sunday, null);
  assert.deepEqual(changes.workingHours.monday, { start: '00:00', end: '23:59' });
});

test('closing every day is refused (deactivate instead)', () => {
  let week = readWeekHours(FLAT);
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
    week = editDay(week, day, { open: false });
  }
  assert.match(weekHoursError(week), /at least one day open/);
  assert.equal(weekHoursError(readWeekHours(FLAT)), null);
});
