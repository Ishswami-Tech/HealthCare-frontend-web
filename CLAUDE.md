# Frontend Repository Guidelines

## Project Scope
- This repository is the Next.js 16 frontend for the healthcare platform.
- Main responsibilities:
  - patient, doctor, clinic admin, receptionist, and super-admin UI
  - auth and session handling
  - dashboard routing and role-based redirects
  - API integration with the NestJS backend

## Source Layout
- `src/app/`: App Router routes, layouts, and server/client entry points.
- `src/components/`: shared UI and feature components.
- `src/hooks/`: reusable hooks, including auth and query hooks.
- `src/lib/`: config, API clients, utilities, schemas, and server actions.
- `src/stores/`: Zustand state containers.
- `src/contexts/`: cross-cutting React providers.
- `src/types/`: shared TypeScript types.
- `proxy.ts`: route protection and redirect logic.

## Build And Validation
- Development:
  - `cd healthcarefrontend-web && npm run dev`
  - `cd healthcarefrontend-web && npm run dev:turbo`
  - `cd healthcarefrontend-web && npm run dev:local`
- Validation:
  - `cd healthcarefrontend-web && npm run type-check`
  - `cd healthcarefrontend-web && npm run lint`
  - `cd healthcarefrontend-web && npm run contract:check`
- Production:
  - `cd healthcarefrontend-web && npm run build`
  - `cd healthcarefrontend-web && npm run start`

## Architecture Rules
- Use TypeScript everywhere.
- Prefer React Server Components by default.
- Add `"use client"` only when the component truly needs browser-only behavior.
- Keep auth/session state centralized; do not duplicate session logic in multiple hooks or providers.
- Reuse existing utilities before creating new abstractions.
- Keep route guards, redirects, and session normalization aligned across `proxy.ts`, `src/lib/actions/auth.server.ts`, `src/hooks/auth/useAuth.ts`, and `src/stores/auth.store.ts`.

## Auth And Session Handling
- Use the existing auth flow instead of inventing a parallel one.
- Login and registration may share the same UI, but backend intent must remain explicit.
- Do not assume `otp` alone identifies the login source.
- Prefer explicit values such as:
  - `phone_otp`
  - `email_otp`
  - `google_oauth`
  - `password`
- Do not mark non-patient roles as profile-completion candidates unless the backend contract changes.
- Keep profile-completion logic consistent with backend payloads and role checks.
- When changing auth flows, verify:
  - login form
  - OTP verify form
  - profile completion dialog
  - session restore
  - route protection

## Frontend Data Flow
- Use `src/lib/api/client` and existing server actions before adding new fetch paths.
- Use React Query for remote data that needs caching, invalidation, or synchronization.
- Use Zustand only for client state that benefits from local reactive sharing.
- Keep server actions and client hooks consistent in naming, request shape, and error handling.
- Prefer stable, explicit response shapes over ad hoc object spreading.

## Forms And Validation
- Use `zod` schemas for form input validation.
- Prefer `react-hook-form` helpers already present in the repo.
- Keep error messages specific and user-facing.
- Do not normalize all failures into one generic OTP message.
- Preserve backend error meaning when possible; map only known cases to friendlier UI text.

## UI And Component Conventions
- Components use `PascalCase`.
- Hooks use `use*`.
- Prefer composition over large monolithic components.
- Reuse existing UI primitives from the component library before adding new patterns.
- Keep dashboard and auth screens visually consistent with the current design language.
- Avoid duplicating form, modal, toast, or loading-state patterns.

## Routing And Redirects
- Keep redirect logic centralized.
- If route protection changes, update the relevant auth utilities and proxy logic together.
- Make sure patient-only flows do not leak into doctor or admin screens.
- Keep clinic selection, clinic IDs, and session-derived routing consistent.

## Security And Configuration
- Never commit real secrets.
- Keep frontend env values aligned with backend contracts.
- Do not introduce hardcoded fallback clinic identifiers.
- Treat API, auth, and payment settings as environment-driven.
- Validate any payment, webhook, or token-related change carefully before rollout.

## Graphify
- This project uses a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.
- When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists.
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when `query`, `path`, or `explain` do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current when graphify is available.

## AI Rules Bundle
- The `healthcarefrontend-web/.ai-rules/` directory is the detailed policy bundle for this frontend.
- Treat `.ai-rules/index.md` as the top-level index and the canonical entry point for rule navigation.
- Treat these files as the source of detailed implementation guidance:
  - `.ai-rules/architecture.md`
  - `.ai-rules/security.md`
  - `.ai-rules/coding-standards.md`
  - `.ai-rules/nextjs-specific.md`
  - `.ai-rules/user-rules.md`
- If a rule in this file conflicts with a deeper rule file, the deeper rule file wins.
- If `.ai-rules` says one thing and code in the repo does another, prefer the rule bundle unless the user explicitly asks to preserve existing behavior.
- Use `.ai-rules` when making decisions about:
  - route structure
  - server vs client component boundaries
  - clinic-scoped data access
  - RBAC and permission checks
  - error handling
  - medical workflow UI
  - security and privacy
  - performance and caching
  - session and auth handling
  - internationalization
  - accessibility

## Mandatory Rules-First Workflow
- Before any frontend change, read `healthcarefrontend-web/.ai-rules/index.md`.
- Before changing auth, read:
  - `.ai-rules/architecture.md`
  - `.ai-rules/security.md`
  - `.ai-rules/user-rules.md`
- Before changing routing, server components, layouts, or server actions, read:
  - `.ai-rules/architecture.md`
  - `.ai-rules/nextjs-specific.md`
- Before changing forms, shared components, hooks, state, validation, or UI patterns, read:
  - `.ai-rules/coding-standards.md`
- If the task touches permissions, clinic scoping, profile completion, medical workflows, or role-specific UI, read the matching `.ai-rules/*.md` file first.
- If a rule file exists for the area you are touching, consult it before editing code.
- If there is a conflict between a rule file and the current implementation, prefer the rule file unless the user explicitly requests otherwise.
- If a file is missing from `.ai-rules`, fall back to the nearest applicable rule file and the top-level index.

## Detailed Frontend Operating Rules

### App Router
- This repository uses the Next.js App Router only.
- Prefer server components for route-level data fetching and layout composition.
- Use client components only when interactivity, browser APIs, local state, or event handlers require it.
- Keep route groups meaningful:
  - `(auth)` for login, registration, OTP, and recovery flows
  - `(dashboard)` for protected application surfaces
  - public pages separate from authenticated pages
- Use `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` intentionally.

### Auth Flow
- The frontend auth flow must align with backend behavior.
- Same screen may handle login and registration, but the UI should never guess user intent from a brittle string alone.
- Always keep these distinctions clear:
  - unauthenticated visitor
  - returning user logging in
  - brand-new user registering
  - authenticated user completing a profile step
  - authenticated user verifying phone or email
- If backend returns explicit login source metadata, preserve it through the frontend session model.
- Do not infer `email_verified` or `phone_verified` from unrelated fields unless the payload is a legacy fallback.
- Keep login, OTP request, OTP verify, and session refresh flows consistent across:
  - `src/app/(auth)/auth/login/page.tsx`
  - `src/app/(auth)/auth/verify-otp/page.tsx`
  - `src/hooks/auth/useAuth.ts`
  - `src/lib/actions/auth.server.ts`
  - `src/stores/auth.store.ts`
  - `proxy.ts`

### Session Rules
- Session state must be derived from one authoritative source whenever possible.
- If the session is refreshed or normalized, update all downstream consumers together.
- Do not let a generic failure path clear the session if only profile lookup or auxiliary data retrieval failed.
- Preserve explicit metadata in the session:
  - `loginMethod`
  - `profileComplete`
  - `requiresProfileCompletion`
  - `phoneVerified`
  - `emailVerified`
  - `clinicId`
  - `primaryClinicId`
- For legacy sessions, prefer a compatibility fallback over breaking users, but keep the fallback narrow.

### Profile Completion
- Profile completion is patient-only unless the backend contract explicitly changes.
- Do not force doctors, clinic admins, receptionists, pharmacists, or super admins through patient profile completion screens.
- Profile-completion state must be read from the same authority in:
  - server actions
  - Zustand stores
  - route guards
  - dashboard layouts
  - protected route wrappers
- Avoid duplicate heuristics for the same completion state.
- If the backend returns `requiresProfileCompletion`, `profileComplete`, or `isProfileComplete`, normalize them once and reuse the normalized value.

### Login Source Semantics
- Track and preserve explicit login source values.
- Supported frontend-visible values should include:
  - `phone_otp`
  - `email_otp`
  - `google_oauth`
  - `password`
- Treat old `otp` payloads as legacy-only.
- Do not treat `otp` as a source of truth when explicit loginMethod is available.
- Do not convert every OTP-related error into the same generic message.

### Error Handling
- Preserve backend meaning wherever possible.
- Only map known, explicit backend messages to polished UI copy.
- Do not collapse unrelated failures into:
  - `Invalid OTP`
  - `Session expired`
  - `User not found`
  - `Clinic not found`
- Unknown failures should usually keep the original message or be routed through a generic fallback that does not hide the root cause.
- Prefer error handling keyed by structured codes when available.

### Query and Data Fetching
- Use React Query for remote data and shared cache state.
- Reuse established query keys; do not invent parallel naming schemes.
- Make query keys clinic-aware when the data is tenant-scoped.
- Prefer server actions or existing API clients over ad hoc `fetch` calls.
- Invalidate caches after mutations with the smallest safe scope.

### Zustand Stores
- Use Zustand only for UI state, shared client state, and cross-component session mirrors.
- Do not duplicate server data in Zustand if React Query already manages it.
- Avoid storing large or sensitive PHI values in client stores unless the UI absolutely needs them.

### Forms
- Use `zod` plus `react-hook-form`.
- Keep form schemas close to the feature they validate.
- Input validation should be strict enough to protect the backend but not so strict it prevents legitimate clinical data entry.
- Reuse the existing `useZodForm` pattern when present.

### UI System
- Reuse existing UI primitives before creating new ones.
- Prefer composition and variants over one-off components.
- Keep the design system consistent across auth, dashboard, and workflow screens.
- Use accessible labels, focus states, keyboard navigation, and loading skeletons.
- Do not introduce inaccessible clickable icons or unlabeled controls.

### Dashboard And Role Screens
- Keep role-specific views aligned with the backend role model.
- Typical role surfaces include:
  - patient
  - doctor
  - nurse
  - receptionist
  - pharmacist
  - clinic admin
  - super admin
- Use role-aware components and route guards.
- Do not leak patient-only logic into staff flows.
- Do not force staff into patient onboarding, patient profile completion, or patient-only redirects.

### Security
- Never commit secrets.
- Never hardcode a fallback clinic identifier for production logic.
- Keep session cookies, token refresh, and redirect logic secure and consistent.
- Protect sensitive screens with both route-level and component-level checks when appropriate.
- Treat file upload, payment, and medical record flows as high-risk surfaces.

### Accessibility
- Keep healthcare UIs readable and fast to operate.
- Use plain, explicit labels.
- Make touch targets large enough for clinical environments.
- Provide keyboard navigation and screen-reader support.
- Do not rely on color alone to communicate status.

### Performance
- Avoid unnecessary client bundles.
- Prefer server rendering for read-heavy pages.
- Use dynamic imports for heavy charts, editors, or media components.
- Keep image loading optimized.
- Minimize rerenders in dashboards and tables.

### Integration With Backend
- Frontend behavior must match backend contracts.
- If backend introduces a new response field, update the frontend normalization layer before relying on it in the UI.
- If backend changes role semantics, revisit route guards and profile completion in the same change set.
- If backend changes auth or session behavior, update:
  - server actions
  - stores
  - proxy
  - login page
  - OTP page
  - dashboards

### Working Style
- Before making a change, inspect the existing flow end-to-end.
- Prefer modifying existing files and existing hooks over creating duplicates.
- Keep changes small, local, and reversible when possible.
- Verify the impact in auth, routing, and state synchronization before declaring a fix complete.
