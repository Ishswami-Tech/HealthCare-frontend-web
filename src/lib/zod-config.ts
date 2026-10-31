/**
 * Global zod configuration. Import this module FIRST from every entry point
 * (src/instrumentation-client.ts for the browser, src/app/layout.tsx for the server).
 *
 * zod v4 compiles object parsers with `new Function` and probes for eval support the first
 * time a `z.object()` is constructed. Our CSP has no `'unsafe-eval'`, so the swallowed probe
 * still fires a `securitypolicyviolation` report on every page. `jitless` makes zod use its
 * interpreted parser and skip the probe entirely — the CSP stays strict.
 *
 * The setting is read when a schema is constructed, so it must run before any module that
 * builds schemas at import time; that is why the entry points import it first.
 */
import { z } from "zod";

z.config({ jitless: true });

export {};
