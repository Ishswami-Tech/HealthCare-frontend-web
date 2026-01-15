/**
 * ✅ Consolidated Appointments Store
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for appointment state management
 * Uses types from @/types/appointment.types.ts
 */

"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
// ✅ Consolidated: Import types from @/types/appointment.types.ts (single source of truth)
import type { 
  Appointment,
  AppointmentStatus,
  AppointmentFilters,
} from "@/types/appointment.types";
// AppointmentType can be imported directly from @/types/appointment.types if needed

// Store-specific types (extended for denormalized data)
export interface StoreAppointment extends Appointment {
  // Denormalized for performance (optional, populated when needed)
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  isActive?: boolean;
  lastSync?: string;
  // Store-specific fields for compatibility
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// ✅ Consolidated: AppointmentStats in types has different structure, so we keep store-specific version
// Store-specific AppointmentStats (more detailed than types version)
export interface AppointmentStats {
  total: number;
  byStatus: Partial<Record<AppointmentStatus, number>>;
  byType: Partial<Record<string, number>>;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  averageWaitTime: number;
  completionRate: number;
  noShowRate: number;
}

// Store-specific TimeSlot type (not in types, specific to store usage)
export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  doctorId: string;
  reason?: string;
}

export interface AppointmentsState {
  // Data
  appointments: Record<string, StoreAppointment>;
  appointmentIds: string[];
  
  // UI State
  selectedAppointment: StoreAppointment | null;
  selectedDate: string;
  currentView: 'day' | 'week' | 'month' | 'list';
  filters: AppointmentFilters;
  
  // Stats & Analytics
  stats: AppointmentStats | null;
  availableSlots: TimeSlot[];
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Real-time Updates
  pendingUpdates: Record<string, Partial<StoreAppointment>>;
  lastSync: Date | null;
  
  // Error Handling
  error: string | null;
  validationErrors: Record<string, string>;
  
  // Actions
  setAppointments: (appointments: StoreAppointment[]) => void;
  addAppointment: (appointment: StoreAppointment) => void;
  updateAppointment: (id: string, updates: Partial<StoreAppointment>) => void;
  removeAppointment: (id: string) => void;
  
  setSelectedAppointment: (appointment: StoreAppointment | null) => void;
  setSelectedDate: (date: string) => void;
  setCurrentView: (view: 'day' | 'week' | 'month' | 'list') => void;
  setFilters: (filters: Partial<AppointmentFilters>) => void;
  
  setStats: (stats: AppointmentStats) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  
  addPendingUpdate: (id: string, updates: Partial<StoreAppointment>) => void;
  applyPendingUpdates: () => void;
  clearPendingUpdates: () => void;
  
  setError: (error: string | null) => void;
  setValidationError: (field: string, error: string) => void;
  clearValidationErrors: () => void;
  
  // Derived State Getters
  getAppointmentsByDate: (date: string) => StoreAppointment[];
  getAppointmentsByDoctor: (doctorId: string) => StoreAppointment[];
  getAppointmentsByPatient: (patientId: string) => StoreAppointment[];
  getFilteredAppointments: () => StoreAppointment[];
  getTodayAppointments: () => StoreAppointment[];
  getUpcomingAppointments: (limit?: number) => StoreAppointment[];
  
  // Utility Actions
  markAsCompleted: (id: string) => void;
  markAsNoShow: (id: string) => void;
  checkInPatient: (id: string) => void;
  cancelAppointment: (id: string, reason?: string) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  
  updateLastSync: () => void;
  reset: () => void;
}

const initialState: Omit<AppointmentsState, 
  'getAppointmentsByDate' | 'getAppointmentsByDoctor' | 'getAppointmentsByPatient' | 
  'getFilteredAppointments' | 'getTodayAppointments' | 'getUpcomingAppointments' | 
  'markAsCompleted' | 'markAsNoShow' | 'checkInPatient' | 'cancelAppointment' | 
  'rescheduleAppointment' | 'updateLastSync' | 'reset' | 'setAppointments' | 
  'addAppointment' | 'updateAppointment' | 'removeAppointment' | 'setSelectedAppointment' |
  'setSelectedDate' | 'setCurrentView' | 'setFilters' | 'setStats' | 'setAvailableSlots' |
  'setLoading' | 'setCreating' | 'setUpdating' | 'setDeleting' | 'addPendingUpdate' |
  'applyPendingUpdates' | 'clearPendingUpdates' | 'setError' | 'setValidationError' | 'clearValidationErrors'
> = {
  appointments: {},
  appointmentIds: [],
  selectedAppointment: null,
  selectedDate: new Date().toISOString().split('T')[0] || '',
  currentView: 'day' as const,
  filters: {} as AppointmentFilters,
  stats: null,
  availableSlots: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  pendingUpdates: {},
  lastSync: null,
  error: null,
  validationErrors: {},
};

export const useAppointmentsStore = create<AppointmentsState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Data Actions
        setAppointments: (appointments) =>
          set((state) => {
            state.appointments = {};
            state.appointmentIds = [];
            
            appointments.forEach(appointment => {
              state.appointments[appointment.id] = appointment;
              state.appointmentIds.push(appointment.id);
            });
            
            state.appointmentIds.sort((a, b) => {
              const aApt = state.appointments[a];
              const bApt = state.appointments[b];
              if (!aApt || !bApt) return 0;
              const aDate = new Date(`${aApt.appointmentDate || aApt.date || ''} ${aApt.startTime || aApt.time || ''}`);
              const bDate = new Date(`${bApt.appointmentDate || bApt.date || ''} ${bApt.startTime || bApt.time || ''}`);
              return aDate.getTime() - bDate.getTime();
            });
          }),

        addAppointment: (appointment) =>
          set((state) => {
            state.appointments[appointment.id] = appointment;
            state.appointmentIds.push(appointment.id);
            
            // Re-sort
            state.appointmentIds.sort((a, b) => {
              const aApt = state.appointments[a];
              const bApt = state.appointments[b];
              if (!aApt || !bApt) return 0;
              const aDate = new Date(`${aApt.appointmentDate || aApt.date || ''} ${aApt.startTime || aApt.time || ''}`);
              const bDate = new Date(`${bApt.appointmentDate || bApt.date || ''} ${bApt.startTime || bApt.time || ''}`);
              return aDate.getTime() - bDate.getTime();
            });
          }),

        updateAppointment: (id, updates) =>
          set((state) => {
            if (state.appointments[id]) {
              Object.assign(state.appointments[id], updates, {
                updatedAt: new Date().toISOString(),
              });
              
              // Update selected appointment if it's the same one
              if (state.selectedAppointment?.id === id) {
                Object.assign(state.selectedAppointment, updates);
              }
            }
          }),

        removeAppointment: (id) =>
          set((state) => {
            delete state.appointments[id];
            state.appointmentIds = state.appointmentIds.filter(appointmentId => appointmentId !== id);
            
            if (state.selectedAppointment?.id === id) {
              state.selectedAppointment = null;
            }
          }),

        // UI Actions
        setSelectedAppointment: (appointment) =>
          set((state) => {
            state.selectedAppointment = appointment;
          }),

        setSelectedDate: (date) =>
          set((state) => {
            state.selectedDate = date;
          }),

        setCurrentView: (view) =>
          set((state) => {
            state.currentView = view;
          }),

        setFilters: (filters) =>
          set((state) => {
            Object.assign(state.filters, filters);
          }),

        // Stats Actions
        setStats: (stats) =>
          set((state) => {
            state.stats = stats;
          }),

        setAvailableSlots: (slots) =>
          set((state) => {
            state.availableSlots = slots;
          }),

        // Loading Actions
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setCreating: (creating) =>
          set((state) => {
            state.isCreating = creating;
          }),

        setUpdating: (updating) =>
          set((state) => {
            state.isUpdating = updating;
          }),

        setDeleting: (deleting) =>
          set((state) => {
            state.isDeleting = deleting;
          }),

        // Real-time Update Actions
        addPendingUpdate: (id, updates) =>
          set((state) => {
            if (!state.pendingUpdates[id]) {
              state.pendingUpdates[id] = {};
            }
            Object.assign(state.pendingUpdates[id], updates);
          }),

        applyPendingUpdates: () =>
          set((state) => {
            Object.entries(state.pendingUpdates).forEach(([id, updates]) => {
              if (state.appointments[id]) {
                Object.assign(state.appointments[id], updates, {
                  updatedAt: new Date().toISOString(),
                  lastSync: new Date().toISOString(),
                });
              }
            });
            state.pendingUpdates = {};
          }),

        clearPendingUpdates: () =>
          set((state) => {
            state.pendingUpdates = {};
          }),

        // Error Actions
        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        setValidationError: (field, error) =>
          set((state) => {
            state.validationErrors[field] = error;
          }),

        clearValidationErrors: () =>
          set((state) => {
            state.validationErrors = {};
          }),

        // Derived State Getters
        getAppointmentsByDate: (date: string) => {
          const state = get();
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter((appointment): appointment is StoreAppointment => 
              appointment !== undefined && (appointment.appointmentDate === date || appointment.date === date)
            );
        },

        getAppointmentsByDoctor: (doctorId: string) => {
          const state = get();
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter((appointment): appointment is StoreAppointment => 
              appointment !== undefined && appointment.doctorId === doctorId
            );
        },

        getAppointmentsByPatient: (patientId: string) => {
          const state = get();
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter((appointment): appointment is StoreAppointment => 
              appointment !== undefined && appointment.patientId === patientId
            );
        },

        getFilteredAppointments: () => {
          const state = get();
          let appointments = state.appointmentIds
            .map(id => state.appointments[id])
            .filter((apt): apt is StoreAppointment => apt !== undefined);

          const { clinicId, doctorId, patientId, status, type, startDate, endDate, search } = state.filters;

          if (clinicId) {
            appointments = appointments.filter(apt => apt.clinicId === clinicId);
          }

          if (doctorId) {
            appointments = appointments.filter(apt => apt.doctorId === doctorId);
          }

          if (patientId) {
            appointments = appointments.filter(apt => apt.patientId === patientId);
          }

          if (status) {
            const statusFilter = Array.isArray(status) ? status : [status];
            appointments = appointments.filter(apt => statusFilter.includes(apt.status));
          }

          if (type) {
            const typeFilter = Array.isArray(type) ? type : [type];
            appointments = appointments.filter(apt => typeFilter.includes(apt.type));
          }

          if (startDate || endDate) {
            appointments = appointments.filter(apt => {
              if (!apt.appointmentDate && !apt.date) return false;
              const aptDate = apt.appointmentDate || apt.date || '';
              if (startDate && aptDate < startDate) return false;
              if (endDate && aptDate > endDate) return false;
              return true;
            });
          }

          if (search) {
            const query = search.toLowerCase();
            appointments = appointments.filter(apt =>
              apt.patientName?.toLowerCase().includes(query) ||
              apt.doctorName?.toLowerCase().includes(query) ||
              apt.reason?.toLowerCase().includes(query) ||
              apt.notes?.toLowerCase().includes(query)
            );
          }
          
          return appointments;
        },

        getTodayAppointments: () => {
          const state = get();
          const today = new Date().toISOString().split('T')[0] || '';
          return state.getAppointmentsByDate(today);
        },

        getUpcomingAppointments: (limit = 10) => {
          const state = get();
          const now = new Date();
          
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter((appointment): appointment is StoreAppointment => {
              if (!appointment) return false;
              const appointmentDate = appointment.appointmentDate || appointment.date || '';
              const appointmentTime = appointment.startTime || appointment.time || '';
              if (!appointmentDate || !appointmentTime) return false;
              const appointmentDateTime = new Date(`${appointmentDate} ${appointmentTime}`);
              return appointmentDateTime > now && appointment.status !== 'CANCELLED';
            })
            .slice(0, limit);
        },

        // Utility Actions
        markAsCompleted: (id) =>
          set((state) => {
            if (state.appointments[id]) {
              state.appointments[id].status = 'COMPLETED';
              state.appointments[id].updatedAt = new Date().toISOString();
            }
          }),

        markAsNoShow: (id) =>
          set((state) => {
            if (state.appointments[id]) {
              state.appointments[id].status = 'NO_SHOW';
              state.appointments[id].updatedAt = new Date().toISOString();
            }
          }),

        checkInPatient: (id) =>
          set((state) => {
            if (state.appointments[id]) {
              state.appointments[id].status = 'CHECKED_IN';
              state.appointments[id].updatedAt = new Date().toISOString();
            }
          }),

        cancelAppointment: (id, reason) =>
          set((state) => {
            if (state.appointments[id]) {
              state.appointments[id].status = 'CANCELLED';
              if (reason) {
                state.appointments[id].notes = reason;
              }
              state.appointments[id].updatedAt = new Date().toISOString();
            }
          }),

        rescheduleAppointment: (id, newDate, newTime) =>
          set((state) => {
            if (state.appointments[id]) {
              state.appointments[id].appointmentDate = newDate;
              state.appointments[id].startTime = newTime;
              state.appointments[id].status = 'SCHEDULED'; // RESCHEDULED not in AppointmentStatus type
              state.appointments[id].updatedAt = new Date().toISOString();
            }
          }),

        updateLastSync: () =>
          set((state) => {
            state.lastSync = new Date();
          }),

        reset: () =>
          set(() => ({
            ...initialState,
            selectedDate: new Date().toISOString().split('T')[0],
          })),
      }))
    ),
    {
      name: 'appointments-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for better performance
export const useAppointments = () => useAppointmentsStore(state => 
  state.appointmentIds.map(id => state.appointments[id])
);

export const useSelectedAppointment = () => useAppointmentsStore(state => state.selectedAppointment);

export const useAppointmentFilters = () => useAppointmentsStore(state => state.filters);

export const useAppointmentStats = () => useAppointmentsStore(state => state.stats);

export const useTodayAppointments = () => useAppointmentsStore(state => state.getTodayAppointments());

export const useUpcomingAppointments = () => useAppointmentsStore(state => state.getUpcomingAppointments());

export const useAppointmentLoadingStates = () => useAppointmentsStore(state => ({
  isLoading: state.isLoading,
  isCreating: state.isCreating,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting,
}));

// Re-export types from @/types/appointment.types.ts (single source of truth)
export type { 
  Appointment, 
  AppointmentStatus, 
  AppointmentType, 
  AppointmentFilters,
} from "@/types/appointment.types";

// Store-specific types are already exported above as interfaces:
// - StoreAppointment (line 21)
// - AppointmentStats (line 40)
// - TimeSlot (line 52)