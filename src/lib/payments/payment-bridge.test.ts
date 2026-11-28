// Run: node --test src/lib/payments/payment-bridge.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPaymentBridgeLaunchUrl,
  readIntentCashfreeMode,
  resolvePaymentBridgeBaseUrl,
  sanitizeBridgePayload,
} from "./payment-bridge.ts";

describe("resolvePaymentBridgeBaseUrl", () => {
  it("is off when the bridge URL is not configured", () => {
    assert.equal(resolvePaymentBridgeBaseUrl(undefined, "https://api.example.com"), "");
    assert.equal(resolvePaymentBridgeBaseUrl("   ", "https://api.example.com"), "");
  });

  it("is off for a local backend with a public bridge", () => {
    assert.equal(
      resolvePaymentBridgeBaseUrl("https://www.ishswami.in/payments/start", "http://localhost:8088/api/v1"),
      "",
    );
    assert.equal(resolvePaymentBridgeBaseUrl("https://ishswami.in", "http://127.0.0.1:8088"), "");
  });

  it("allows a local bridge with a local backend", () => {
    assert.equal(
      resolvePaymentBridgeBaseUrl("http://localhost:3100/payments/start", "http://localhost:8088"),
      "http://localhost:3100/payments/start",
    );
  });

  it("allows an explicit public bridge with a public backend", () => {
    assert.equal(
      resolvePaymentBridgeBaseUrl("https://ishswami.in/payments/start/", "https://backend.example.com"),
      "https://ishswami.in/payments/start",
    );
  });

  it("rejects non-http schemes", () => {
    assert.equal(resolvePaymentBridgeBaseUrl("javascript:alert(1)", "https://api.example.com"), "");
  });
});

describe("buildPaymentBridgeLaunchUrl", () => {
  it("puts the payload only in the fragment", () => {
    const url = new URL(buildPaymentBridgeLaunchUrl("https://ishswami.in/payments/start?payload=old", "abc"));
    assert.equal(url.search, "");
    assert.equal(url.hash, "#payload=abc");
    assert.equal(url.pathname, "/payments/start");
  });

  it("defaults the path", () => {
    assert.equal(
      buildPaymentBridgeLaunchUrl("https://ishswami.in", "abc"),
      "https://ishswami.in/payments/start#payload=abc",
    );
  });

  it("returns empty for a missing base or payload", () => {
    assert.equal(buildPaymentBridgeLaunchUrl("", "abc"), "");
    assert.equal(buildPaymentBridgeLaunchUrl("https://ishswami.in", ""), "");
  });
});

describe("readIntentCashfreeMode", () => {
  it("reads metadata.environment first", () => {
    assert.equal(readIntentCashfreeMode({ metadata: { environment: "sandbox" }, environment: "production" }), "sandbox");
  });
  it("falls back to the top-level environment", () => {
    assert.equal(readIntentCashfreeMode({ environment: "production" }), "production");
  });
  it("ignores unknown values", () => {
    assert.equal(readIntentCashfreeMode({ metadata: { environment: "TEST" } }), undefined);
    assert.equal(readIntentCashfreeMode(undefined), undefined);
  });
});

describe("sanitizeBridgePayload", () => {
  it("drops empty values and customer contact fields", () => {
    const result = sanitizeBridgePayload({
      clinicId: "c1",
      amount: 100,
      appointmentId: "",
      email: "a@b.c",
      customerPhone: "+910000000000",
      environment: undefined,
    });
    assert.deepEqual(result, { clinicId: "c1", amount: 100 });
  });
});
