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

---

## 2. Performance Best Practices

### Image Optimization
- Always use `next/image` instead of `<img>` tags.
- Specify `width` and `height` to prevent Layout Shift (CLS).
```typescript
import Image from "next/image";
// ...
<Image src="/logo.png" width={100} height={50} alt="Logo" />
```

### Lazy Loading & Code Splitting
- Use `next/dynamic` for heavy components (charts, maps, rich text editors).
- Ensure Critical Rendering Path is not blocked by non-essential scripts.

### Health Checks & Sockets
- **Do NOT** perform synchronous health checks on page mount.
- **Do NOT** auto-connect WebSockets on public/auth pages.
- Use `requestIdleCallback` or `setTimeout` to defer non-critical initialization.

---

## 3. Type Safety
- **Strict Mode**: `strict: true` is enabled in `tsconfig.json`.
- **No `any`**: Avoid `any`. Use `unknown` or define specific interfaces.
- **Zod Validation**: Use Zod schemas for all API inputs and Form data.

---

## 4. Troubleshooting & Common Fixes

### "Page Hanging" on Login
- **Cause**: Blocking network requests or infinite loops in `useEffect`.
- **Fix**: Ensure `useAuth` session checks have `refetchOnWindowFocus: false` during login. Verify WebSocket is not trying to connect without a token.

### Build Errors (Circular Dependencies)
- **Cause**: Files importing each other (e.g., `config.ts` <-> `routes.ts`).
- **Fix**: Move shared constants to a dedicated "leaf" file (e.g., `constants.ts`) that imports nothing.

---

## 5. Workflow
1.  **Linting**: Run `npm run lint` before committing.
2.  **Building**: Run `npm run build` locally to verify type safety.
3.  **Commit Messages**: Use semantic commits (e.g., `feat: add user profile`, `fix: resolve middleware conflict`).
