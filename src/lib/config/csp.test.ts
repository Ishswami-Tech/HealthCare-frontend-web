// Run: node --test src/lib/config/csp.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContentSecurityPolicy } from "./csp.ts";

const directive = (csp: string, name: string): string[] =>
  (csp.split(";").find((part) => part.trim().startsWith(`${name} `)) ?? "")
    .trim()
    .split(/\s+/)
    .slice(1);

describe("buildContentSecurityPolicy analytics origin", () => {
  it("allows the analytics origin in connect-src only", () => {
    const csp = buildContentSecurityPolicy({
      analyticsUrl: "https://eu.i.posthog.com/",
      isDevelopment: false,
      enforceHttps: true,
    });
    assert.ok(
      directive(csp, "connect-src").includes("https://eu.i.posthog.com"),
    );
    assert.ok(
      !directive(csp, "script-src").includes("https://eu.i.posthog.com"),
    );
  });

  it("adds nothing when no analytics origin is configured", () => {
    const csp = buildContentSecurityPolicy({
      isDevelopment: false,
      enforceHttps: true,
    });
    assert.ok(!csp.includes("posthog"));
  });
});
