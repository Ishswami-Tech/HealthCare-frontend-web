// ✅ Common Components - Shared UI components used across the application
// Barrel export for all common components

// Status Indicators
export {
  StatusIndicator,
  StatusDot,
  SystemStatusIndicator,
  ConnectionStatusIndicator,
  UserStatusIndicator,
  SessionStatusIndicator,
  SystemStatusBar,
  CompactStatusBar,
  LiveActivityIndicator,
  StatusSummary,
  type StatusType,
} from './StatusIndicator';

// Backend Status
export {
  BackendStatusIndicator,
  CompactBackendStatus,
  DetailedBackendStatus,
  BackendStatusWidget,
} from './BackendStatusIndicator';

// Error Boundaries
export {
  ErrorBoundary,
  WebSocketErrorBoundary,
  APIErrorBoundary,
  MinimalErrorBoundary,
} from './ErrorBoundary';

// Health Status
export { GlobalHealthStatusButton } from './GlobalHealthStatusButton';
