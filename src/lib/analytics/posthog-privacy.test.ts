// Run: node --test src/lib/analytics/posthog-privacy.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sanitizeAnalyticsEvent,
  sanitizeAnalyticsPath,
  sanitizeAnalyticsUrl,
} from "./posthog-privacy.ts";

describe("sanitizeAnalyticsPath", () => {
  it("keeps plain route segments", () => {
    assert.equal(
      sanitizeAnalyticsPath("/patient/appointments"),
      "/patient/appointments",
    );
    assert.equal(
      sanitizeAnalyticsPath("/treatments/panchakarma-therapy"),
      "/treatments/panchakarma-therapy",
    );
    assert.equal(sanitizeAnalyticsPath("/"), "/");
  });

  it("replaces ids, codes, tokens, emails and phones with :id", () => {
    assert.equal(
      sanitizeAnalyticsPath(
        "/doctor/patients/2f1c9a7e-1b2c-4d5e-8f90-123456789abc/records",
      ),
      "/doctor/patients/:id/records",
    );
    assert.equal(
      sanitizeAnalyticsPath("/clinic/CL0002/invoices/104233"),
      "/clinic/:id/invoices/:id",
    );
    assert.equal(
      sanitizeAnalyticsPath("/share/aZ3kP9qL2mN8vB7xC1dE4f"),
      "/share/:id",
    );
    assert.equal(sanitizeAnalyticsPath("/u/someone@example.com"), "/u/:id");
    assert.equal(sanitizeAnalyticsPath("/call/+919876543210"), "/call/:id");
  });

  it("keeps short numbers such as wizard steps", () => {
    assert.equal(
      sanitizeAnalyticsPath("/onboarding/step/2"),
      "/onboarding/step/2",
    );
  });
});

describe("sanitizeAnalyticsUrl", () => {
  it("drops query string and hash and scrubs the path", () => {
    assert.equal(
      sanitizeAnalyticsUrl(
        "https://app.example.com/patient/appointments/2f1c9a7e-1b2c-4d5e-8f90-123456789abc?phone=9876543210&openBooking=1#notes",
      ),
      "https://app.example.com/patient/appointments/:id",
    );
  });

  it("returns path-only input as a scrubbed path", () => {
    assert.equal(
      sanitizeAnalyticsUrl("/doctor/queue?token=abc"),
      "/doctor/queue",
    );
  });

  it("leaves non-URL markers untouched", () => {
    assert.equal(sanitizeAnalyticsUrl("$direct"), "$direct");
    assert.equal(sanitizeAnalyticsUrl(""), "");
  });
});

describe("sanitizeAnalyticsEvent", () => {
  it("scrubs every url, path and referrer property without mutating the input", () => {
    const event = {
      uuid: "u1",
      event: "$pageview",
      properties: {
        $current_url: "https://app.example.com/patient/records/104233?x=1",
        $pathname: "/patient/records/104233",
        $referrer: "https://mail.example.com/inbox?thread=someone@example.com",
        $prev_pageview_pathname:
          "/doctor/patients/2f1c9a7e-1b2c-4d5e-8f90-123456789abc",
        $referring_domain: "mail.example.com",
        role: "PATIENT",
      },
      $set_once: {
        $initial_current_url:
          "https://app.example.com/invite/aZ3kP9qL2mN8vB7xC1dE4f",
      },
    };
    const snapshot = JSON.stringify(event);
    const out = sanitizeAnalyticsEvent(event);

    assert.equal(JSON.stringify(event), snapshot);
    assert.deepEqual(out.properties, {
      $current_url: "https://app.example.com/patient/records/:id",
      $pathname: "/patient/records/:id",
      $referrer: "https://mail.example.com/inbox",
      $prev_pageview_pathname: "/doctor/patients/:id",
      $referring_domain: "mail.example.com",
      role: "PATIENT",
    });
    assert.deepEqual(out.$set_once, {
      $initial_current_url: "https://app.example.com/invite/:id",
    });
  });
});
