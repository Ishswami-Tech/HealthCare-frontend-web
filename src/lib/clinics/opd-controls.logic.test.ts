// Run: node --test src/lib/clinics/opd-controls.logic.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOpdServiceTogglesPatch,
  isQrCheckInDisabledError,
  isQrCheckInEnabled,
  mergeOpdServiceToggles,
  readOpdServiceToggles,
  resolveConsultationModes,
} from "./opd-controls.logic.ts";

const clinicWith = (opdControls: unknown, doctorConsultationControls?: unknown) => ({
  id: "CL0002",
  settings: {
    appointmentSettings: {
      opdControls,
      ...(doctorConsultationControls ? { doctorConsultationControls } : {}),
    },
  },
});

describe("readOpdServiceToggles", () => {
  it("defaults every switch to on when nothing is stored", () => {
    for (const source of [undefined, null, {}, { settings: {} }, { settings: { appointmentSettings: {} } }]) {
      assert.deepEqual(readOpdServiceToggles(source), {
        qrCheckInEnabled: true,
        videoConsultationEnabled: true,
        generalConsultationEnabled: true,
      });
    }
  });

  it("only an explicit false turns a switch off", () => {
    assert.deepEqual(
      readOpdServiceToggles(
        clinicWith({ qrCheckInEnabled: false, videoConsultationEnabled: null, generalConsultationEnabled: "false" }),
      ),
      { qrCheckInEnabled: false, videoConsultationEnabled: true, generalConsultationEnabled: true },
    );
  });

  it("reads from a clinic, its settings, or appointmentSettings alike", () => {
    const appointmentSettings = { opdControls: { videoConsultationEnabled: false } };
    for (const source of [{ settings: { appointmentSettings } }, { appointmentSettings }, appointmentSettings]) {
      assert.equal(readOpdServiceToggles(source).videoConsultationEnabled, false);
    }
  });

  it("falls back to the legacy opdControl key", () => {
    const source = { settings: { appointmentSettings: { opdControl: { qrCheckInEnabled: false } } } };
    assert.equal(isQrCheckInEnabled(source), false);
  });
});

describe("resolveConsultationModes", () => {
  it("both modes open by default", () => {
    assert.deepEqual(resolveConsultationModes(clinicWith({}), "D1"), { video: true, inPerson: true });
  });

  it("follows the clinic switches", () => {
    assert.deepEqual(
      resolveConsultationModes(clinicWith({ videoConsultationEnabled: false }), "D1"),
      { video: false, inPerson: true },
    );
    assert.deepEqual(
      resolveConsultationModes(clinicWith({ generalConsultationEnabled: false })),
      { video: true, inPerson: false },
    );
  });

  it("a doctor override can further restrict", () => {
    const source = clinicWith({}, { D1: { videoConsultationEnabled: false }, D2: { generalConsultationEnabled: false } });
    assert.deepEqual(resolveConsultationModes(source, "D1"), { video: false, inPerson: true });
    assert.deepEqual(resolveConsultationModes(source, "D2"), { video: true, inPerson: false });
    assert.deepEqual(resolveConsultationModes(source, "D3"), { video: true, inPerson: true });
  });

  it("a doctor override never re-enables what the clinic turned off", () => {
    const source = clinicWith(
      { videoConsultationEnabled: false, generalConsultationEnabled: false },
      { D1: { videoConsultationEnabled: true, generalConsultationEnabled: true } },
    );
    assert.deepEqual(resolveConsultationModes(source, "D1"), { video: false, inPerson: false });
  });

  it("ignores doctor overrides when no doctor is chosen yet", () => {
    const source = clinicWith({}, { D1: { videoConsultationEnabled: false } });
    assert.deepEqual(resolveConsultationModes(source, ""), { video: true, inPerson: true });
  });
});

describe("isQrCheckInDisabledError", () => {
  it("recognises the backend refusal by code or message", () => {
    assert.equal(isQrCheckInDisabledError({ code: "QR_CHECK_IN_DISABLED" }), true);
    assert.equal(
      isQrCheckInDisabledError(
        new Error("QR check-in is turned off at this clinic. Please wait in the queue; reception will check you in."),
      ),
      true,
    );
    assert.equal(isQrCheckInDisabledError({ error: "QR check-in is off" }), true);
  });

  it("does not match other check-in failures", () => {
    assert.equal(isQrCheckInDisabledError(new Error("You are too far from the clinic")), false);
    assert.equal(isQrCheckInDisabledError({ code: "LOCATION_INACTIVE" }), false);
    assert.equal(isQrCheckInDisabledError(undefined), false);
  });
});

describe("mergeOpdServiceToggles", () => {
  it("writes the switches and keeps every other setting", () => {
    const settings = {
      paymentSettings: { autoBilling: true },
      appointmentSettings: {
        appointmentDuration: 15,
        doctorConsultationControls: { D1: { isPaused: true } },
        opdControls: {
          isOpdPaused: true,
          pauseReason: "Holiday",
          emergencyOnly: false,
          requireLocationForQrCheckIn: true,
          videoConsultationEnabled: true,
        },
      },
    };
    const merged = mergeOpdServiceToggles(settings, { qrCheckInEnabled: false, videoConsultationEnabled: false });
    assert.deepEqual(merged, {
      paymentSettings: { autoBilling: true },
      appointmentSettings: {
        appointmentDuration: 15,
        doctorConsultationControls: { D1: { isPaused: true } },
        opdControls: {
          isOpdPaused: true,
          pauseReason: "Holiday",
          emergencyOnly: false,
          requireLocationForQrCheckIn: true,
          videoConsultationEnabled: false,
          qrCheckInEnabled: false,
        },
      },
    });
    // The input is not mutated.
    assert.equal(settings.appointmentSettings.opdControls.videoConsultationEnabled, true);
  });

  it("buildOpdServiceTogglesPatch sends only the full opdControls block", () => {
    const settings = {
      paymentSettings: { autoBilling: true },
      appointmentSettings: {
        appointmentDuration: 15,
        opdControls: { isOpdPaused: false, requireLocationForQrCheckIn: true },
      },
    };
    assert.deepEqual(buildOpdServiceTogglesPatch(settings, { qrCheckInEnabled: false }), {
      appointmentSettings: {
        opdControls: { isOpdPaused: false, requireLocationForQrCheckIn: true, qrCheckInEnabled: false },
      },
    });
  });

  it("creates the blocks when the clinic has no settings yet", () => {
    assert.deepEqual(mergeOpdServiceToggles(null, { generalConsultationEnabled: false }), {
      appointmentSettings: { opdControls: { generalConsultationEnabled: false } },
    });
  });

  it("folds in the legacy opdControl block and drops non-boolean patch values", () => {
    const merged = mergeOpdServiceToggles(
      { appointmentSettings: { opdControl: { qrCheckInEnabled: false, emergencyOnly: true } } },
      { videoConsultationEnabled: undefined as unknown as boolean },
    );
    assert.deepEqual(
      (merged.appointmentSettings as Record<string, unknown>).opdControls,
      { qrCheckInEnabled: false, emergencyOnly: true },
    );
  });
});
