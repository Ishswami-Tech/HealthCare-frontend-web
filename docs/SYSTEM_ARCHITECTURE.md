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
└── middleware.ts         # Global Request Interception
```

---

## 2. Authentication & Security

### Role-Based Access Control (RBAC)
The application enforces strict RBAC at multiple levels:
1.  **Middleware Level**: `middleware.ts` intercepts requests, verifies JWT tokens, and checks role permissions before rendering pages.
2.  **Layout Level**: `(dashboard)/layout.tsx` dynamically renders sidebar links based on the user's role.
3.  **Component Level**: `useAuth` and `usePermissions` hooks allow conditional rendering of UI elements.
4.  **Redirection Logic**: `src/lib/config/routes.ts` centralizes redirection logic via `getDashboardByRole(role)`.

### Authentication Flow
- **Token Management**: JWTs (Access/Refresh) are stored in HTTP-only cookies.
- **Session Handling**: `useAuth` hook synchronizes session state with the backend, leveraging core hooks for data fetching.
- **Route Protection**: Public routes (e.g., `/auth/*`) are explicitly allow-listed. All others require authentication.

---

## 3. Core Architecture Patterns

### Data Fetching & State Management
We utilize a unified **QueryClient Architecture**:
- **Single Source of Truth**: A single `QueryClient` instance is created in `QueryProvider.tsx` and shared via React Query's context.
- **Strict Separation**:
    - **Server State**: Managed by **TanStack Query** (via `useQueryData`, `useMutationOperation` core hooks). Handles caching, invalidation, and prefetching.
    - **Client UI State**: Managed by **Zustand**. Handles global UI preferences (Sidebar toggle, Theme) and session data.
- **Core Hooks Abstraction**: All application hooks (e.g., `useAuth`) import from `@/hooks/core` rather than `@tanstack/react-query` directly.

### Notification System
Consolidated into `src/hooks/query/useNotifications.ts`:
- **Unified Hook**: `useNotifications()` handles fetching, syncing to Zustand, and optimistic updates.
- **Communication Separated**: Sending logic (Email, SMS) is isolated in `useCommunication.ts`.
- **Integration**: `NotificationInitializer.tsx` bootstraps the system, and `useWebSocketIntegration` handles real-time updates.

### Loading System
The loading architecture uses a 3-tier approach:
1.  **Global App Loading**: `app.store.ts` manages app-wide blocking states (e.g., "Logging in...").
2.  **Route Transitions**: optimized `LoadingOverlay` prevents interaction during navigation.
3.  **Component Loading**: `Skeleton` loaders and `Suspense` boundaries provide instant feedback for async parts.

### Centralized Error Handling
All API and application errors are routed through `src/lib/utils/error-handler.ts`.
- **User-Friendly Messages**: Technical errors (e.g., 500 Internal Server error) are mapped to friendly toasts.
- **Consistency**: `handleApiError` utility is used in both Server Actions and Client Components.

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
