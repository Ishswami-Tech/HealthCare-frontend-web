import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  locationId: string;
  appointmentDateTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'PROCEDURE';
  duration: number;
  reason?: string;
  notes?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  doctor?: {
    id: string;
    name: string;
    specialization?: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
}

export interface AppointmentFilters {
  status?: string;
  doctorId?: string;
  patientId?: string;
  clinicId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
}

interface AppointmentState {
  // Appointments data
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  
  // Filters and search
  filters: AppointmentFilters;
  searchQuery: string;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  currentView: 'list' | 'calendar' | 'queue';
  selectedDate: string;
  
  // Queue management
  queueData: {
    totalInQueue: number;
    averageWaitTime: number;
    currentlyServing: string | null;
  };
  
  // Actions
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  selectAppointment: (appointment: Appointment | null) => void;
  
  // Filter actions
  setFilters: (filters: Partial<AppointmentFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentView: (view: 'list' | 'calendar' | 'queue') => void;
  setSelectedDate: (date: string) => void;
  
  // Queue actions
  updateQueueData: (data: Partial<AppointmentState['queueData']>) => void;
  
  // Utility functions
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByStatus: (status: string) => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  getTodayAppointments: () => Appointment[];
  getFilteredAppointments: () => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      appointments: [],
      selectedAppointment: null,
      filters: {},
      searchQuery: '',
      isLoading: false,
      error: null,
      currentView: 'list',
      selectedDate: new Date().toISOString().split('T')[0],
      queueData: {
        totalInQueue: 0,
        averageWaitTime: 0,
        currentlyServing: null,
      },
      
      // Appointment actions
      setAppointments: (appointments) => set({ appointments }),
      
      addAppointment: (appointment) => {
        const appointments = [...get().appointments, appointment];
        set({ appointments });
      },
      
      updateAppointment: (id, updates) => {
        const appointments = get().appointments.map(apt =>
          apt.id === id ? { ...apt, ...updates } : apt
        );
        set({ appointments });
      },
      
      removeAppointment: (id) => {
        const appointments = get().appointments.filter(apt => apt.id !== id);
        set({ appointments });
      },
      
      selectAppointment: (appointment) => {
        set({ selectedAppointment: appointment });
      },
      
      // Filter actions
      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        set({ filters });
      },
      
      clearFilters: () => {
        set({ filters: {}, searchQuery: '' });
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      
      // Queue actions
      updateQueueData: (data) => {
        const queueData = { ...get().queueData, ...data };
        set({ queueData });
      },
      
      // Utility functions
      getAppointmentsByDate: (date) => {
        return get().appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDateTime).toISOString().split('T')[0];
          return aptDate === date;
        });
      },
      
      getAppointmentsByStatus: (status) => {
        return get().appointments.filter(apt => apt.status === status);
      },
      
      getUpcomingAppointments: () => {
        const now = new Date();
        return get().appointments
          .filter(apt => new Date(apt.appointmentDateTime) > now)
          .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime());
      },
      
      getTodayAppointments: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().getAppointmentsByDate(today);
      },
      
      getFilteredAppointments: () => {
        const { appointments, filters, searchQuery } = get();
        let filtered = [...appointments];
        
        // Apply filters
        if (filters.status) {
          filtered = filtered.filter(apt => apt.status === filters.status);
        }
        if (filters.doctorId) {
          filtered = filtered.filter(apt => apt.doctorId === filters.doctorId);
        }
        if (filters.patientId) {
          filtered = filtered.filter(apt => apt.patientId === filters.patientId);
        }
        if (filters.clinicId) {
          filtered = filtered.filter(apt => apt.clinicId === filters.clinicId);
        }
        if (filters.type) {
          filtered = filtered.filter(apt => apt.type === filters.type);
        }
        if (filters.startDate) {
          filtered = filtered.filter(apt => 
            new Date(apt.appointmentDateTime) >= new Date(filters.startDate!)
          );
        }
        if (filters.endDate) {
          filtered = filtered.filter(apt => 
            new Date(apt.appointmentDateTime) <= new Date(filters.endDate!)
          );
        }
        
        // Apply search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(apt =>
            apt.patient?.name.toLowerCase().includes(query) ||
            apt.doctor?.name.toLowerCase().includes(query) ||
            apt.reason?.toLowerCase().includes(query) ||
            apt.notes?.toLowerCase().includes(query)
          );
        }
        
        return filtered;
      },
    }),
    {
      name: "appointment-storage",
      partialize: (state) => ({
        filters: state.filters,
        currentView: state.currentView,
        selectedDate: state.selectedDate,
      }),
    }
  )
);

// Selectors for better performance
export const useAppointmentSelectors = () => {
  const store = useAppointmentStore();
  
  return {
    upcomingAppointments: store.getUpcomingAppointments(),
    todayAppointments: store.getTodayAppointments(),
    filteredAppointments: store.getFilteredAppointments(),
    scheduledAppointments: store.getAppointmentsByStatus('SCHEDULED'),
    confirmedAppointments: store.getAppointmentsByStatus('CONFIRMED'),
    inProgressAppointments: store.getAppointmentsByStatus('IN_PROGRESS'),
    completedAppointments: store.getAppointmentsByStatus('COMPLETED'),
    cancelledAppointments: store.getAppointmentsByStatus('CANCELLED'),
  };
};

// Helper hooks for common operations
export const useAppointmentActions = () => {
  const store = useAppointmentStore();
  
  return {
    setAppointments: store.setAppointments,
    addAppointment: store.addAppointment,
    updateAppointment: store.updateAppointment,
    removeAppointment: store.removeAppointment,
    selectAppointment: store.selectAppointment,
    setFilters: store.setFilters,
    clearFilters: store.clearFilters,
    setSearchQuery: store.setSearchQuery,
    setCurrentView: store.setCurrentView,
    setSelectedDate: store.setSelectedDate,
  };
};

// Hook for appointment queue management
export const useAppointmentQueue = () => {
  const queueData = useAppointmentStore(state => state.queueData);
  const updateQueueData = useAppointmentStore(state => state.updateQueueData);
  const inProgressAppointments = useAppointmentStore(state => 
    state.getAppointmentsByStatus('IN_PROGRESS')
  );
  
  return {
    queueData,
    updateQueueData,
    inProgressAppointments,
  };
};

// Hook for appointment filters
export const useAppointmentFilters = () => {
  const filters = useAppointmentStore(state => state.filters);
  const searchQuery = useAppointmentStore(state => state.searchQuery);
  const setFilters = useAppointmentStore(state => state.setFilters);
  const clearFilters = useAppointmentStore(state => state.clearFilters);
  const setSearchQuery = useAppointmentStore(state => state.setSearchQuery);
  
  return {
    filters,
    searchQuery,
    setFilters,
    clearFilters,
    setSearchQuery,
  };
};
