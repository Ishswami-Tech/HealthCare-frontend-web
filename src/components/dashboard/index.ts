// ✅ Dashboard Components - Dashboard-specific UI components
// Barrel export for all dashboard components

// Layout
export { DashboardLayout } from './DashboardLayout';

// Cards
export {
  ModernDashboardCard,
  StatCard,
  ProgressCard,
  ActionCard,
  QuickStats,
  DashboardHeader as DashboardHeaderCard,
} from './ModernDashboardCard';

// Appointments
export { AppointmentCard, AppointmentList } from './AppointmentCard';

// Status Bar (moved from layout/)
export {
  DashboardStatusBar,
  DashboardHeader,
  FloatingStatusWidget,
  DashboardFooter,
} from './DashboardStatusBar';

// Enhanced Dashboard
export { default as EnhancedDoctorDashboard } from './enhanced-doctor-dashboard';
