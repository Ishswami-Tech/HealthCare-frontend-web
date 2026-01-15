# System Architecture

## 1. System Overview

### Core Technologies
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: Zustand (Client) + TanStack Query (Server)
- **Real-time**: Socket.IO Client

### Directory Structure
```
src/
├── app/                  # Next.js App Router (File-based routing)
│   ├── (auth)/           # Authentication routes (login, register)
│   ├── (dashboard)/      # Protected, role-based dashboards
│   ├── (shared)/         # Features shared across roles (e.g., appointments)
│   └── api/              # Backend API proxies
├── components/           # React Components
│   ├── ui/               # Reusable primitives (buttons, inputs)
│   ├── global/           # App-wide widgets (Sidebar, Navbar)
│   └── [feature]/        # Domain-specific components
├── lib/
│   ├── actions/          # Server Actions (Data mutations)
│   ├── config/           # App configuration (routes, RBAC)
│   └── utils/            # Helper functions
├── stores/               # Global Client State (Zustand)
└── middleware.ts         # (OR proxy.ts) Global Request Interception
```

---

## 2. Authentication & Security

### Role-Based Access Control (RBAC)
The application enforces strict RBAC at multiple levels:
1.  **Middleware/Proxy Level**: `src/proxy.ts` (or `middleware.ts`) intercepts requests, verifies JWT tokens, and checks role permissions before rendering pages.
2.  **Layout Level**: `(dashboard)/layout.tsx` dynamically renders sidebar links based on the user's role.
3.  **Component Level**: `useAuth` and `usePermissions` hooks allow conditional rendering of UI elements.

### Authentication Flow
- **Token Management**: JWTs (Access/Refresh) are stored in HTTP-only cookies.
- **Session Handling**: `useAuth` hook synchronizes session state with the backend.
- **Route Protection**: Public routes (e.g., `/auth/*`) are explicitly allow-listed. All others require authentication.

---

## 3. Core Architecture Patterns

### State Management
We follow a strict separation of concerns:
- **Server State**: Managed by **TanStack Query**. Handles caching, invalidation, and prefetching of API data.
- **Client UI State**: Managed by **Zustand**. Handles global UI preferences (Sidebar toggle, Theme) and session data.
- **Form State**: Managed by **React Hook Form** + **Zod** for validation.

### Loading System (`docs/LOADING_ARCHITECTURE.md`)
The loading architecture uses a 3-tier approach:
1.  **Global App Loading**: `app.store.ts` manages app-wide blocking states (e.g., "Logging in...").
2.  **Route Transitions**: optimized `LoadingOverlay` prevents interaction during navigation.
3.  **Component Loading**: `Skeleton` loaders and `Suspense` boundaries provide instant feedback for async parts.

### Centralized Error Handling (`docs/CENTRALIZED_ERROR_HANDLING.md`)
All API and Application errors are routed through `src/lib/utils/error-handler.ts`.
- **User-Friendly Messages**: Technical errors (e.g., 500 Internal Server error) are mapped to friendly toasts.
- **Consistency**: `handleApiError` utility is used in both Server Actions and Client Components.

### Real-Time Updates
- **Socket.IO**: Used for live notifications (e.g., Queue updates, Appointment status).
- **Optimization**: Sockets are lazily connected. Auto-connect is **disabled** on Auth pages to prevent "Page Hanging" issues.

---

## 4. Key Configurations

### Environment Variables
The application requires specific environment variables for:
- API Base URLs
- WebSocket Endpoints
- Feature Flags (e.g., Enable/Disable specific health checks)

### Healthcare Compliance
- **Data Isolation**: All queries must include `clinicId` to ensure multi-tenant data isolation.
- **Audit Logging**: Use `auditLog` utility for critical write operations.
