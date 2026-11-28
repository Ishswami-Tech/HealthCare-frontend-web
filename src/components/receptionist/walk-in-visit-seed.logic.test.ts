// Run: node --test src/components/receptionist/walk-in-visit-seed.logic.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  overlayWalkInVisit,
  rememberWalkInVisit,
  serverShowsCheckIn,
  walkInVisitSeedKey,
  walkInVisitSeedOf,
  type WalkInVisitSeed,
} from "./walk-in-visit-seed.logic.ts";

const response = {
  appointmentId: "appt-203",
  appointmentStatus: "CONFIRMED",
  checkedInAt: "2026-11-01T09:50:00.000Z",
  token: "A-003",
  position: 1,
};
const seed = walkInVisitSeedOf(response) as WalkInVisitSeed;

describe("walk-in visit seed (D12)", () => {
  it("is built only from a checked-in response", () => {
    assert.deepEqual(seed, response);
    assert.equal(walkInVisitSeedOf({ ...response, checkedInAt: null }), null);
    assert.equal(walkInVisitSeedOf(null), null);
  });

  it("a record read that lags the walk-in shows the walk-in's check-in and token", () => {
    const stale = { id: "appt-203", status: "SCHEDULED", checkedInAt: null };
    assert.equal(serverShowsCheckIn(stale), false);
    const shown = overlayWalkInVisit(stale, seed);
    assert.equal(shown?.checkedInAt, "2026-11-01T09:50:00.000Z");
    assert.equal(shown?.status, "CONFIRMED");
    assert.equal(shown?.tokenLabel, "A-003");
    assert.equal(shown?.queuePosition, 1);
    assert.equal(serverShowsCheckIn(shown), true);
  });

  it("the server's record wins once it has the check-in or has moved on", () => {
    const fresh = { id: "appt-203", status: "CONFIRMED", checkedInAt: "2026-11-01T09:50:01.000Z", tokenLabel: "A-003" };
    assert.equal(overlayWalkInVisit(fresh, seed), fresh);
    for (const status of ["IN_PROGRESS", "COMPLETED", "CANCELLED"]) {
      const row = { id: "appt-203", status, checkedInAt: null };
      assert.equal(overlayWalkInVisit(row, seed), row);
    }
  });

  it("never lays a seed over another appointment, or invents a record", () => {
    const other = { id: "appt-999", status: "SCHEDULED" };
    assert.equal(overlayWalkInVisit(other, seed), other);
    assert.equal(overlayWalkInVisit(null, seed), null);
    const row = { id: "appt-203", status: "SCHEDULED" };
    assert.equal(overlayWalkInVisit(row, undefined), row);
  });

  it("the walk-in remembers its response under the appointment", () => {
    const written: Array<[unknown, unknown]> = [];
    rememberWalkInVisit({ setQueryData: ((key: unknown, value: unknown) => written.push([key, value])) as never }, response);
    assert.deepEqual(written, [[walkInVisitSeedKey("appt-203"), seed]]);
    rememberWalkInVisit({ setQueryData: (() => assert.fail("no seed without a check-in")) as never }, { ...response, checkedInAt: null });
  });
});
