export type RecordOfUnknown = Record<string, unknown>;

export interface ClinicLocationHeadDashboardStats {
  totalToday: number;
  completed: number;
  waiting: number;
  inProgress: number;
}
