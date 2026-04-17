# Development Standards & Guidelines

## 1. Coding Standards

### File Naming
- **Components**: PascalCase (e.g., `PatientCard.tsx`)
- **Hooks**: camelCase with prefix (e.g., `usePatientData.ts`)
- **Utilities**: kebab-case (e.g., `date-formatter.ts`)
- **Constants/Types**: kebab-case or camelCase (e.g., `auth.types.ts`)

### Component Structure
Follow the "Co-location" principle. Keep related styles, tests, and sub-components close to the main component.
```typescript
// ✅ Good: Typed props, early returns
interface Props {
  data: Patient;
}

export const PatientCard = ({ data }: Props) => {
  if (!data) return null;
  
  return (
    <Card>
      <CardHeader>{data.name}</CardHeader>
    </Card>
  );
};
```

### Hook Refactoring & Abstraction
- **Core Hooks First**: ALWAYS use `@/hooks/core` (e.g., `useQueryData`, `useMutationOperation`) instead of direct `useQuery`/`useMutation` imports.
- **Mutation Pattern**: Use `useMutationOperation` for consistent error handling and toast notifications.
- **No Direct Query Client**: Use `useQueryClient` from `@/hooks/core`.

---

## 2. Redirection & Navigation

### Centralized Redirection
- **Never Hardcode Paths**: Use `ROUTES` or `getDashboardByRole()` from `@/lib/config/routes`.
- **Profile Redirection**: Use `getProfileCompletionRedirectUrl()` from `@/lib/config/profile`.
- **Common Flows**:
    - **Login**: Redirects to `profile-completion` if incomplete, or `dashboard` if complete.
    - **Logout**: Redirects to `/auth/login`.
    - **Unauthorized**: Redirects to user's dashboard with `?unauthorized=true`.

---

## 3. Performance Best Practices

### Image Optimization
- Always use `next/image` instead of `<img>` tags.
- Specify `width` and `height` to prevent Layout Shift (CLS).

### Lazy Loading
- Use `next/dynamic` for heavy components (charts, maps).
- Ensure Critical Rendering Path is not blocked.

### Health Checks & Sockets
- **No Sync Health Checks**: Do NOT perform synchronous health checks on mount.
- **No Auth Page Sockets**: Do NOT auto-connect WebSockets on public/auth pages.

---

## 4. Type Safety
- **Strict Mode**: `strict: true` is enabled in `tsconfig.json`.
- **No `any`**: Avoid `any`. Use `unknown` or define specific interfaces.
- **Zod Validation**: Use Zod schemas for all API inputs and Form data.

---

## 5. Troubleshooting & Common Fixes

### "Page Hanging" on Login
- **Cause**: Blocking network requests or infinite loops in `useEffect`.
- **Fix**: Ensure `useAuth` session checks have `refetchOnWindowFocus: false` during login.

### Build Errors (Circular Dependencies)
- **Cause**: Files importing each other (e.g., `config.ts` <-> `routes.ts`).
- **Fix**: Move shared constants to a dedicated "leaf" file (e.g., `constants.ts`).

---

## 6. Workflow
1.  **Linting**: Run `npm run lint` before committing.
2.  **Building**: Run `npm run build` locally.
3.  **Commit Messages**: Use semantic commits (e.g., `feat: add user profile`).
