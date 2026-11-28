// Run: node --test src/lib/clinics/clinic-settings-queries.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { QueryClient } from "@tanstack/react-query";
import {
  CLINIC_SETTINGS_QUERY_FAMILIES,
  refetchClinicSettingsQueries,
} from "./clinic-settings-queries.ts";

describe("refetchClinicSettingsQueries", () => {
  it("re-reads every clinic-settings family that is on screen", () => {
    const calls: Array<Record<string, unknown>> = [];
    const queryClient = {
      invalidateQueries: (filters: Record<string, unknown>) => {
        calls.push(filters);
        return Promise.resolve();
      },
    } as unknown as QueryClient;

    refetchClinicSettingsQueries(queryClient);

    assert.equal(calls.length, CLINIC_SETTINGS_QUERY_FAMILIES.length);
    for (const call of calls) {
      assert.equal(call.refetchType, "active");
      assert.equal(call.exact, false);
    }
    const keys = calls.map((call) => (call.queryKey as string[])[0]);
    for (const family of ["myClinic", "current-clinic", "doctorAvailability"]) {
      assert.ok(keys.includes(family), `missing ${family}`);
    }
  });
});
