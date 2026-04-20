import assert from 'node:assert/strict';
import type { AppointmentFilters } from '../src/types/appointment.types.ts';
import {
  getAppointmentQueryKey,
  serializeAppointmentFilters,
  serializeAppointmentQueryKey,
  toAppointmentFilterParams,
} from '../src/lib/query/appointment-query-keys.ts';
import {
  getQueueListQueryKey,
  getQueueStatsQueryKey,
  serializeQueueFilters,
} from '../src/lib/queue/queue-cache.ts';

function main() {
  const appointmentFilters: {
    doctorId: string;
    status: NonNullable<AppointmentFilters['status']>;
    omitClinicId: boolean;
  } = {
    doctorId: 'doc-1',
    status: ['CONFIRMED', 'AWAITING_SLOT_CONFIRMATION'],
    omitClinicId: true,
  };

  assert.equal(
    serializeAppointmentFilters(appointmentFilters),
    'doctorId:doc-1|status:CONFIRMED,AWAITING_SLOT_CONFIRMATION'
  );
  assert.deepEqual(toAppointmentFilterParams(appointmentFilters), {
    doctorId: 'doc-1',
    status: 'CONFIRMED,AWAITING_SLOT_CONFIRMATION',
  });
  assert.deepEqual(serializeAppointmentQueryKey('clinic-a', appointmentFilters), [
    'appointments',
    'clinic-a',
    'doctorId:doc-1|status:CONFIRMED,AWAITING_SLOT_CONFIRMATION',
  ]);
  assert.deepEqual(getAppointmentQueryKey('clinic-a', appointmentFilters), [
    'appointments',
    'clinic-a',
    'doctorId:doc-1|status:CONFIRMED,AWAITING_SLOT_CONFIRMATION',
  ]);

  assert.equal(
    serializeQueueFilters({ doctorId: 'doc-1', status: 'WAITING', date: '2026-04-19' }),
    '{date:2026-04-19,doctorId:doc-1,status:WAITING}'
  );
  assert.deepEqual(getQueueListQueryKey('clinic-a', { doctorId: 'doc-1' }), [
    'queue',
    'clinic-a',
    '{doctorId:doc-1}',
  ]);
  assert.deepEqual(getQueueStatsQueryKey('location-a', 'clinic-a'), [
    'queue-status',
    'clinic-a',
    '__all__',
    'location-a',
  ]);

  console.log('Frontend production contract checks passed.');
}

main();
