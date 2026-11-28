// Run: node --test src/components/billing/plan-desk-path.logic.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  payAtClinicText,
  planCycleNoun,
  resolveExpectedWalkInFee,
  resolveWalkInPlanSettings,
  walkInFeePhrase,
  walkInFallbackText,
} from "./plan-desk-path.logic.ts";

describe("resolveWalkInPlanSettings", () => {
  it("reads the rule and desk fee from appointmentSettings", () => {
    assert.deepEqual(
      resolveWalkInPlanSettings({ appointmentSettings: { walkInWithoutPlan: "allow_with_desk_fee", walkInDeskFee: "300" } }),
      { policy: "ALLOW_WITH_DESK_FEE", deskFee: 300, consultationFee: null, expectedFee: null },
    );
  });
  it("defaults to REQUIRE_PLAN like the backend", () => {
    assert.deepEqual(resolveWalkInPlanSettings({ appointmentSettings: {} }), { policy: "REQUIRE_PLAN", deskFee: null, consultationFee: null, expectedFee: null });
  });
  it("reads the clinic consultation fee the desk bills when the desk fee is blank", () => {
    const rule = resolveWalkInPlanSettings({
      appointmentSettings: { walkInWithoutPlan: "ALLOW_WITH_DESK_FEE", walkInDeskFee: "" },
      billingSettings: { opdConsultationFee: 500 },
    });
    assert.deepEqual(rule, { policy: "ALLOW_WITH_DESK_FEE", deskFee: null, consultationFee: 500, expectedFee: null });
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
    assert.match(walkInFallbackText({ policy: "ALLOW_WITH_DESK_FEE", deskFee: null, consultationFee: null, expectedFee: null }), /as per clinic/);
  });
  it("stays neutral when the rule is unknown", () => {
    assert.match(walkInFallbackText(null), /as per clinic/);
  });
});

describe("backend expectedWalkInFee (D9b: desk billed the doctor fee)", () => {
  const settings = { appointmentSettings: { walkInWithoutPlan: "ALLOW_WITH_DESK_FEE" } };
  const doctorFee = { basis: "doctor_fee", amount: 500, minAmount: 500, maxAmount: 500 };

  it("shows the doctor fee the desk will bill when the clinic fees are blank", () => {
    const rule = resolveWalkInPlanSettings(settings, doctorFee);
    assert.deepEqual(rule?.expectedFee, doctorFee);
    assert.equal(
      walkInFallbackText(rule),
      "No plan? Walk in — the reception desk will check you in (consultation fee ₹500, pay at the desk).",
    );
  });
  it("shows a range when the clinic doctors charge differently", () => {
    const rule = resolveWalkInPlanSettings(settings, { basis: "doctor_fee_range", amount: null, minAmount: 400, maxAmount: 600 });
    assert.equal(walkInFeePhrase(rule), "consultation fee ₹400–₹600 depending on the doctor");
    assert.equal(
      walkInFallbackText(rule),
      "No plan? Walk in — the reception desk will check you in (consultation fee ₹400–₹600 depending on the doctor, pay at the desk).",
    );
  });
  it("a desk fee basis reads as the desk fee and wins over the settings guess", () => {
    const rule = resolveWalkInPlanSettings(
      { ...settings, billingSettings: { opdConsultationFee: 900 } },
      { basis: "desk_fee", amount: 300, minAmount: 300, maxAmount: 300 },
    );
    assert.equal(walkInFeePhrase(rule), "desk fee ₹300");
  });
  it("ignores an unknown or malformed fee (older backend, nothing configured)", () => {
    assert.equal(resolveExpectedWalkInFee({ basis: null, amount: null, minAmount: null, maxAmount: null }), null);
    assert.equal(resolveExpectedWalkInFee({ basis: "doctor_fee", amount: 0 }), null);
    assert.equal(resolveExpectedWalkInFee({ basis: "doctor_fee_range", minAmount: 400 }), null);
    assert.equal(resolveExpectedWalkInFee(undefined), null);
    assert.match(walkInFallbackText(resolveWalkInPlanSettings(settings, undefined)), /as per clinic/);
  });
  it("never shows a fee when the clinic does not bill plan-less walk-ins", () => {
    const rule = resolveWalkInPlanSettings({ appointmentSettings: { walkInWithoutPlan: "REQUIRE_PLAN" } }, doctorFee);
    assert.equal(walkInFeePhrase(rule), null);
    assert.doesNotMatch(walkInFallbackText(rule), /₹/);
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
