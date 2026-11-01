// Run: node --test src/components/billing/plan-desk-path.logic.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  payAtClinicText,
  planCycleNoun,
  resolveWalkInPlanSettings,
  walkInFallbackText,
} from "./plan-desk-path.logic.ts";

describe("resolveWalkInPlanSettings", () => {
  it("reads the rule and desk fee from appointmentSettings", () => {
    assert.deepEqual(
      resolveWalkInPlanSettings({ appointmentSettings: { walkInWithoutPlan: "allow_with_desk_fee", walkInDeskFee: "300" } }),
      { policy: "ALLOW_WITH_DESK_FEE", deskFee: 300, consultationFee: null },
    );
  });
  it("defaults to REQUIRE_PLAN like the backend", () => {
    assert.deepEqual(resolveWalkInPlanSettings({ appointmentSettings: {} }), { policy: "REQUIRE_PLAN", deskFee: null, consultationFee: null });
  });
  it("reads the clinic consultation fee the desk bills when the desk fee is blank", () => {
    const rule = resolveWalkInPlanSettings({
      appointmentSettings: { walkInWithoutPlan: "ALLOW_WITH_DESK_FEE", walkInDeskFee: "" },
      billingSettings: { opdConsultationFee: 500 },
    });
    assert.deepEqual(rule, { policy: "ALLOW_WITH_DESK_FEE", deskFee: null, consultationFee: 500 });
  });
  it("is null when no settings came back", () => {
    assert.equal(resolveWalkInPlanSettings(undefined), null);
  });
  it("drops nonsense fees", () => {
    assert.equal(resolveWalkInPlanSettings({ walkInWithoutPlan: "ALLOW_WITH_DESK_FEE", walkInDeskFee: -5 })?.deskFee, null);
  });
});

describe("walkInFallbackText (same words as mobile)", () => {
  it("shows the clinic's desk fee", () => {
    assert.equal(
      walkInFallbackText({ policy: "ALLOW_WITH_DESK_FEE", deskFee: 300 }),
      "No plan? Walk in — the reception desk will check you in (desk fee ₹300, pay at the desk).",
    );
  });
  it("says no desk fee for a free walk-in", () => {
    assert.match(walkInFallbackText({ policy: "ALLOW_FREE", deskFee: null }), /no desk fee/);
  });
  it("offers a plan at the desk when a plan is required", () => {
    assert.match(walkInFallbackText({ policy: "REQUIRE_PLAN", deskFee: null }), /set up a plan/);
  });
  it("shows the consultation fee when the clinic left the desk fee blank (D9)", () => {
    assert.equal(
      walkInFallbackText({ policy: "ALLOW_WITH_DESK_FEE", deskFee: null, consultationFee: 500 }),
      "No plan? Walk in — the reception desk will check you in (consultation fee ₹500, pay at the desk).",
    );
    assert.match(walkInFallbackText({ policy: "ALLOW_WITH_DESK_FEE", deskFee: 300, consultationFee: 500 }), /desk fee ₹300/);
    assert.match(walkInFallbackText({ policy: "ALLOW_WITH_DESK_FEE", deskFee: null, consultationFee: null }), /as per clinic/);
  });
  it("stays neutral when the rule is unknown", () => {
    assert.match(walkInFallbackText(null), /as per clinic/);
  });
});

describe("payAtClinicText", () => {
  it("uses the plan's own price and cycle and keeps video per appointment", () => {
    const text = payAtClinicText({ name: "Ayurveda Care Plan", priceLabel: "₹999", cycle: "month" });
    assert.match(text, /Buy Ayurveda Care Plan at the reception desk: ₹999 per month, by cash, UPI or card/);
    assert.match(text, /as soon as the payment is recorded/);
    assert.match(text, /video consultations are paid per appointment/);
  });
  it("omits 'per' for an unknown cycle", () => {
    assert.doesNotMatch(payAtClinicText({ name: "P", priceLabel: "₹1", cycle: planCycleNoun("ODD") }), /₹1 per/);
  });
});
