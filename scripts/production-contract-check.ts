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
  const appointmentMatrix = [
    {
      clinicId: 'clinic-a',
      doctorId: 'doc-1',
      patientId: 'patient-1',
      locationId: 'location-a',
    },
    {
      clinicId: 'clinic-b',
      doctorId: 'doc-2',
      patientId: 'patient-2',
      locationId: 'location-b',
    },
    {
      clinicId: 'clinic-c',
      doctorId: 'doc-3',
      patientId: 'patient-3',
      locationId: 'location-c',
    },
  ] as const;

  const appointmentStatuses: NonNullable<AppointmentFilters['status']> = [
    'CONFIRMED',
    'SCHEDULED',
  ];

  for (const scenario of appointmentMatrix) {
    const filters: AppointmentFilters & { omitClinicId?: boolean } = {
      doctorId: scenario.doctorId,
      patientId: scenario.patientId,
      locationId: scenario.locationId,
      status: appointmentStatuses,
      omitClinicId: true,
    };

    const serializedFilters = `doctorId:${scenario.doctorId}|locationId:${scenario.locationId}|patientId:${scenario.patientId}|status:CONFIRMED,SCHEDULED`;

    assert.equal(serializeAppointmentFilters(filters), serializedFilters);
    assert.deepEqual(toAppointmentFilterParams(filters), {
      doctorId: scenario.doctorId,
      locationId: scenario.locationId,
      patientId: scenario.patientId,
      status: 'CONFIRMED,SCHEDULED',
    });
    assert.deepEqual(serializeAppointmentQueryKey(scenario.clinicId, filters), [
      'appointments',
      scenario.clinicId,
      serializedFilters,
    ]);
    assert.deepEqual(getAppointmentQueryKey(scenario.clinicId, filters), [
      'appointments',
      scenario.clinicId,
      serializedFilters,
    ]);
  }

  const queueMatrix = [
    { clinicId: 'clinic-a', locationId: 'location-a', doctorId: 'doc-1' },
    { clinicId: 'clinic-b', locationId: 'location-b', doctorId: 'doc-2' },
    { clinicId: 'clinic-c', locationId: 'location-c', doctorId: 'doc-3' },
  ] as const;

  for (const scenario of queueMatrix) {
    const queueFilters = {
      doctorId: scenario.doctorId,
      status: 'WAITING',
      date: '2026-04-19',
    } as const;

    assert.equal(
      serializeQueueFilters(queueFilters),
      `{date:2026-04-19,doctorId:${scenario.doctorId},status:WAITING}`
    );
    assert.deepEqual(getQueueListQueryKey(scenario.clinicId, { doctorId: scenario.doctorId }), [
      'queue',
      scenario.clinicId,
      `{doctorId:${scenario.doctorId}}`,
    ]);
    assert.deepEqual(getQueueStatsQueryKey(scenario.locationId, scenario.clinicId), [
      'queue-status',
      scenario.clinicId,
      '__all__',
      scenario.locationId,
    ]);
  }

  assert.deepEqual(
    serializeAppointmentQueryKey(undefined, {
      doctorId: 'doc-global',
      status: ['SCHEDULED'],
    }),
    ['appointments', '__all__', 'doctorId:doc-global|status:SCHEDULED']
  );

  console.log('Frontend production contract checks passed.');
}

main();
