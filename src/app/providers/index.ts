// ✅ Providers - All application providers consolidated here
// Main barrel export for all providers

export { AppProvider } from './AppProvider';
export { default as QueryProvider } from './QueryProvider';
export {
  LoadingOverlayProvider,
  useLoadingOverlay,
  GlobalLoadingOverlayListener,
} from './LoadingOverlayContext';
export {
  WebSocketProvider,
  useWebSocketContext,
  useWebSocketStatus,
  useWebSocketEmit,
  useWebSocketSubscription,
  WebSocketStatusBar,
  withWebSocket,
} from './WebSocketProvider';
export { PushNotificationProvider } from './PushNotificationProvider';
export { HealthStatusProvider } from './HealthStatusProvider';
export {
  PerformanceProvider,
  WebVitalsTracker,
  ResourcePerformanceTracker,
  NavigationPerformanceTracker,
  MemoryPerformanceTracker,
  PerformanceBudgetMonitor,
  PerformanceDebugger,
} from './PerformanceProvider';
