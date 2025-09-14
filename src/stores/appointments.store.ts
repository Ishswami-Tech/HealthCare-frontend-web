"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  duration: number;
  notes?: string;
  reason: string;
  
  // Patient Info (denormalized for performance)
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  
  // Doctor Info (denormalized for performance)
  doctorName: string;
  doctorSpecialty: string;
  
  // Queue Info
  queuePosition?: number;
  estimatedWaitTime?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Real-time fields
  isActive: boolean;
  lastSync?: string;
}

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type AppointmentType = 
  | 'CONSULTATION' 
  | 'FOLLOW_UP' 
  | 'EMERGENCY' 
  | 'TELEMEDICINE' 
  | 'PROCEDURE' 
  | 'VACCINATION';

export interface AppointmentFilters {
  clinicId?: string;
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

export interface AppointmentStats {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  byType: Record<AppointmentType, number>;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  averageWaitTime: number;
  completionRate: number;
  noShowRate: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  doctorId: string;
  reason?: string;
}

export interface AppointmentsState {
  // Data
  appointments: Record<string, Appointment>;
  appointmentIds: string[];
  
  // UI State
  selectedAppointment: Appointment | null;
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
  pendingUpdates: Record<string, Partial<Appointment>>;
  lastSync: Date | null;
  
  // Error Handling
  error: string | null;
  validationErrors: Record<string, string>;
  
  // Actions
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setSelectedDate: (date: string) => void;
  setCurrentView: (view: 'day' | 'week' | 'month' | 'list') => void;
  setFilters: (filters: Partial<AppointmentFilters>) => void;
  
  setStats: (stats: AppointmentStats) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  
  addPendingUpdate: (id: string, updates: Partial<Appointment>) => void;
  applyPendingUpdates: () => void;
  clearPendingUpdates: () => void;
  
  setError: (error: string | null) => void;
  setValidationError: (field: string, error: string) => void;
  clearValidationErrors: () => void;
  
  // Derived State Getters
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  getFilteredAppointments: () => Appointment[];
  getTodayAppointments: () => Appointment[];
  getUpcomingAppointments: (limit?: number) => Appointment[];
  
  // Utility Actions
  markAsCompleted: (id: string) => void;
  markAsNoShow: (id: string) => void;
  checkInPatient: (id: string) => void;
  cancelAppointment: (id: string, reason?: string) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  
  updateLastSync: () => void;
  reset: () => void;
}

const initialState = {
  appointments: {},
  appointmentIds: [],
  selectedAppointment: null,
  selectedDate: new Date().toISOString().split('T')[0],
  currentView: 'day' as const,
  filters: {},
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
              const aDate = new Date(`${state.appointments[a].appointmentDate} ${state.appointments[a].startTime}`);
              const bDate = new Date(`${state.appointments[b].appointmentDate} ${state.appointments[b].startTime}`);
              return aDate.getTime() - bDate.getTime();
            });
          }),

        addAppointment: (appointment) =>
          set((state) => {
            state.appointments[appointment.id] = appointment;
            state.appointmentIds.push(appointment.id);
            
            // Re-sort
            state.appointmentIds.sort((a, b) => {
              const aDate = new Date(`${state.appointments[a].appointmentDate} ${state.appointments[a].startTime}`);
              const bDate = new Date(`${state.appointments[b].appointmentDate} ${state.appointments[b].startTime}`);
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
        getAppointmentsByDate: (date) => {
          const state = get();
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter(appointment => appointment.appointmentDate === date);
        },

        getAppointmentsByDoctor: (doctorId) => {
          const state = get();
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter(appointment => appointment.doctorId === doctorId);
        },

        getAppointmentsByPatient: (patientId) => {
          const state = get();
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter(appointment => appointment.patientId === patientId);
        },

        getFilteredAppointments: () => {
          const state = get();
          let appointments = state.appointmentIds.map(id => state.appointments[id]);

          const { clinicId, doctorId, patientId, status, type, dateRange, searchQuery } = state.filters;

          if (clinicId) {
            appointments = appointments.filter(apt => apt.clinicId === clinicId);
          }

          if (doctorId) {
            appointments = appointments.filter(apt => apt.doctorId === doctorId);
          }

          if (patientId) {
            appointments = appointments.filter(apt => apt.patientId === patientId);
          }

          if (status && status.length > 0) {
            appointments = appointments.filter(apt => status.includes(apt.status));
          }

          if (type && type.length > 0) {
            appointments = appointments.filter(apt => type.includes(apt.type));
          }

          if (dateRange) {
            appointments = appointments.filter(apt => 
              apt.appointmentDate >= dateRange.start && 
              apt.appointmentDate <= dateRange.end
            );
          }

          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            appointments = appointments.filter(apt =>
              apt.patientName.toLowerCase().includes(query) ||
              apt.doctorName.toLowerCase().includes(query) ||
              apt.reason.toLowerCase().includes(query)
            );
          }

          return appointments;
        },

        getTodayAppointments: () => {
          const state = get();
          const today = new Date().toISOString().split('T')[0];
          return state.getAppointmentsByDate(today);
        },

        getUpcomingAppointments: (limit = 10) => {
          const state = get();
          const now = new Date();
          
          return state.appointmentIds
            .map(id => state.appointments[id])
            .filter(appointment => {
              const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.startTime}`);
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
              state.appointments[id].status = 'RESCHEDULED';
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

// Type exports
export type { 
  Appointment, 
  AppointmentStatus, 
  AppointmentType, 
  AppointmentFilters, 
  AppointmentStats,
  TimeSlot 
};