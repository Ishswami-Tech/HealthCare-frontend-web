// Session-failure classifier: which failed requests end the session (logout) and which keep it.
// Run: node --test scripts/session-failure.test.mjs  (Node >= 23.6 strips the TS types)
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifySessionFailure,
  isSessionEndedMessage,
  SESSION_ENDED_MESSAGE,
  toSessionFailureInput,
} from '../src/lib/utils/session-failure.ts';

const USER = '373418a0-368b-458d-8bb9-bf155ca56e82';
const CLINIC = '6fd5490c-f2b2-4bde-aafa-d58f2ada5d71';
const OTHER_CLINIC = '11111111-2222-4333-8444-555555555555';
const GUARD_403 = `Clinic access denied: User ${USER} does not have access to clinic ${CLINIC}`;

test('ClinicGuard 403 for the session clinic (user deleted / removed) ends the session', () => {
  // Shape seen in production logs: statusCode 403, backendCode "Forbidden".
  assert.equal(
    classifySessionFailure({ status: 403, code: 'Forbidden', message: GUARD_403, sessionClinicId: CLINIC }),
    'session-ended'
  );
  // Clinic comparison is case-insensitive; an unknown session clinic still ends it.
  assert.equal(
    classifySessionFailure({ status: 403, message: GUARD_403, sessionClinicId: CLINIC.toUpperCase() }),
    'session-ended'
  );
  assert.equal(classifySessionFailure({ status: 403, message: GUARD_403 }), 'session-ended');
});

test('ClinicGuard 403 for a clinic other than the session one is a permission error', () => {
  assert.equal(
    classifySessionFailure({ status: 403, message: GUARD_403, sessionClinicId: OTHER_CLINIC }),
    'other'
  );
});

test('other session-shaped 403s end the session', () => {
  for (const message of [
    'Clinic authentication mismatch. Please re-login.',
    'User ID missing from token',
    'Session has been revoked',
  ]) {
    assert.equal(classifySessionFailure({ status: 403, message }), 'session-ended', message);
  }
});

test('RBAC / business 403s never end the session', () => {
  for (const message of [
    `Access denied for clinic: ${CLINIC}`,
    'Forbidden',
    'You do not have permission to cancel this appointment',
    'Please complete your profile',
  ]) {
    assert.equal(classifySessionFailure({ status: 403, code: 'Forbidden', message }), 'other', message);
  }
  assert.equal(classifySessionFailure({ status: 403, code: 'CLINIC_ACCESS_DENIED', message: 'Access denied' }), 'other');
});

test('transient failures never end the session, whatever the message says', () => {
  for (const status of [0, 408, 425, 429, 500, 502, 503, 504]) {
    assert.equal(
      classifySessionFailure({ status, code: 'AUTH_TOKEN_INVALID', message: GUARD_403 }),
      'transient',
      String(status)
    );
  }
});

test('401 ends the session unless it answers a credential check', () => {
  assert.equal(classifySessionFailure({ status: 401, message: 'Unauthorized' }), 'session-ended');
  assert.equal(classifySessionFailure({ status: 401, message: 'Session expired. Please log in again.' }), 'session-ended');
  assert.equal(classifySessionFailure({ status: 401, code: 'AUTH_INVALID_CREDENTIALS', message: 'x' }), 'other');
  assert.equal(classifySessionFailure({ status: 401, message: 'Current password is incorrect' }), 'other');
  assert.equal(classifySessionFailure({ status: 401, code: 'AUTH_OTP_INVALID' }), 'other');
});

test('structured dead-session codes end the session regardless of status', () => {
  for (const code of ['AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_INVALID', 'AUTH_SESSION_EXPIRED', 'auth-account-disabled']) {
    assert.equal(classifySessionFailure({ status: 403, code }), 'session-ended', code);
  }
});

test('user-not-found ends the session only on the caller own profile endpoint', () => {
  assert.equal(
    classifySessionFailure({ status: 404, code: 'USER_NOT_FOUND', endpoint: 'http://api/api/v1/user/profile' }),
    'session-ended'
  );
  assert.equal(
    classifySessionFailure({ status: 404, message: 'User not found', endpoint: '/user/profile?x=1' }),
    'session-ended'
  );
  assert.equal(
    classifySessionFailure({ status: 404, code: 'USER_NOT_FOUND', endpoint: `/user/${USER}` }),
    'other'
  );
  assert.equal(classifySessionFailure({ status: 404, message: 'Appointment not found', endpoint: '/user/profile' }), 'other');
  assert.equal(classifySessionFailure({ status: 400, message: 'Validation failed' }), 'other');
});

test('toSessionFailureInput reads ApiError, axios-style and string errors', () => {
  const apiError = Object.assign(new Error(GUARD_403), { statusCode: 403, code: 'Forbidden', backendCode: 'Forbidden' });
  assert.deepEqual(toSessionFailureInput(apiError, { sessionClinicId: CLINIC }), {
    sessionClinicId: CLINIC,
    status: 403,
    code: 'Forbidden',
    message: GUARD_403,
  });
  const axiosLike = { response: { status: 404, data: { code: 'USER_NOT_FOUND', message: 'User not found' } } };
  assert.equal(
    classifySessionFailure(toSessionFailureInput(axiosLike, { endpoint: '/user/profile' })),
    'session-ended'
  );
  assert.equal(toSessionFailureInput('boom').message, 'boom');
  assert.deepEqual(toSessionFailureInput(null), {});
});

test('the session-ended sentinel survives a wrapped server-action message', () => {
  assert.equal(isSessionEndedMessage(SESSION_ENDED_MESSAGE), true);
  assert.equal(isSessionEndedMessage(`Error: ${SESSION_ENDED_MESSAGE}`), true);
  assert.equal(isSessionEndedMessage('Your session has expired. Please log in again.'), false);
  assert.equal(isSessionEndedMessage(undefined), false);
});
