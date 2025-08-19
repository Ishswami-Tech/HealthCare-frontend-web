import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ===== PHARMACY STORE TYPES =====

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  dosageForm: string;
  strength: string;
  packSize: number;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  expiryDate: string;
  batchNumber: string;
  prescriptionRequired: boolean;
  description?: string;
  sideEffects?: string[];
  contraindications?: string[];
  storageConditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED';
  medications: {
    medicineId: string;
    medicine?: Medicine;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
  }[];
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface InventoryItem {
  id: string;
  medicineId: string;
  medicine?: Medicine;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  lastRestocked?: string;
  location?: string;
  notes?: string;
}

interface PharmacyOrder {
  id: string;
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
    contactInfo: {
      email?: string;
      phone?: string;
      address?: string;
    };
  };
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: {
    medicineId: string;
    medicine?: Medicine;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
}

interface PharmacyFilters {
  search: string;
  category: string;
  manufacturer: string;
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  prescriptionRequired: boolean | null;
  sortBy: 'name' | 'category' | 'stock' | 'expiry' | 'price';
  sortOrder: 'asc' | 'desc';
}

interface PharmacyStats {
  totalMedicines: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  totalPrescriptions: number;
  pendingPrescriptions: number;
  dispensedToday: number;
  totalRevenue: number;
  topSellingMedicine?: string;
}

// ===== PHARMACY STORE INTERFACE =====

interface PharmacyStore {
  // State
  medicines: Medicine[];
  prescriptions: Prescription[];
  inventory: InventoryItem[];
  orders: PharmacyOrder[];
  filters: PharmacyFilters;
  stats: PharmacyStats | null;
  selectedMedicine: Medicine | null;
  selectedPrescription: Prescription | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setMedicines: (medicines: Medicine[]) => void;
  addMedicine: (medicine: Medicine) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  removeMedicine: (id: string) => void;
  
  setPrescriptions: (prescriptions: Prescription[]) => void;
  addPrescription: (prescription: Prescription) => void;
  updatePrescription: (id: string, updates: Partial<Prescription>) => void;
  dispensePrescription: (id: string, dispensingData: {
    dispensedBy?: string;
    totalAmount?: number;
    notes?: string;
  }) => void;
  
  setInventory: (inventory: InventoryItem[]) => void;
  updateInventoryItem: (medicineId: string, updates: Partial<InventoryItem>) => void;
  
  setOrders: (orders: PharmacyOrder[]) => void;
  addOrder: (order: PharmacyOrder) => void;
  updateOrder: (id: string, updates: Partial<PharmacyOrder>) => void;
  
  setFilters: (filters: Partial<PharmacyFilters>) => void;
  resetFilters: () => void;
  
  setStats: (stats: PharmacyStats) => void;
  setSelectedMedicine: (medicine: Medicine | null) => void;
  setSelectedPrescription: (prescription: Prescription | null) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed getters
  getFilteredMedicines: () => Medicine[];
  getLowStockMedicines: () => Medicine[];
  getExpiringSoonMedicines: () => Medicine[];
  getPendingPrescriptions: () => Prescription[];
}

// ===== DEFAULT VALUES =====

const defaultFilters: PharmacyFilters = {
  search: '',
  category: '',
  manufacturer: '',
  stockStatus: 'all',
  prescriptionRequired: null,
  sortBy: 'name',
  sortOrder: 'asc',
};

// ===== PHARMACY STORE IMPLEMENTATION =====

export const usePharmacyStore = create<PharmacyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      medicines: [],
      prescriptions: [],
      inventory: [],
      orders: [],
      filters: defaultFilters,
      stats: null,
      selectedMedicine: null,
      selectedPrescription: null,
      isLoading: false,
      error: null,

      // Medicine actions
      setMedicines: (medicines) => set({ medicines }),
      addMedicine: (medicine) => set((state) => ({
        medicines: [...state.medicines, medicine]
      })),
      updateMedicine: (id, updates) => set((state) => ({
        medicines: state.medicines.map(medicine =>
          medicine.id === id ? { ...medicine, ...updates } : medicine
        )
      })),
      removeMedicine: (id) => set((state) => ({
        medicines: state.medicines.filter(medicine => medicine.id !== id)
      })),

      // Prescription actions
      setPrescriptions: (prescriptions) => set({ prescriptions }),
      addPrescription: (prescription) => set((state) => ({
        prescriptions: [...state.prescriptions, prescription]
      })),
      updatePrescription: (id, updates) => set((state) => ({
        prescriptions: state.prescriptions.map(prescription =>
          prescription.id === id ? { ...prescription, ...updates } : prescription
        )
      })),
      dispensePrescription: (id, dispensingData) => set((state) => ({
        prescriptions: state.prescriptions.map(prescription =>
          prescription.id === id ? {
            ...prescription,
            status: 'DISPENSED' as const,
            dispensedAt: new Date().toISOString(),
            ...dispensingData
          } : prescription
        )
      })),

      // Inventory actions
      setInventory: (inventory) => set({ inventory }),
      updateInventoryItem: (medicineId, updates) => set((state) => ({
        inventory: state.inventory.map(item =>
          item.medicineId === medicineId ? { ...item, ...updates } : item
        )
      })),

      // Order actions
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((state) => ({
        orders: [...state.orders, order]
      })),
      updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map(order =>
          order.id === id ? { ...order, ...updates } : order
        )
      })),

      // Filter actions
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Other actions
      setStats: (stats) => set({ stats }),
      setSelectedMedicine: (medicine) => set({ selectedMedicine: medicine }),
      setSelectedPrescription: (prescription) => set({ selectedPrescription: prescription }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Computed getters
      getFilteredMedicines: () => {
        const { medicines, filters } = get();
        let filtered = [...medicines];

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(medicine =>
            medicine.name.toLowerCase().includes(searchLower) ||
            medicine.genericName?.toLowerCase().includes(searchLower) ||
            medicine.manufacturer.toLowerCase().includes(searchLower)
          );
        }

        // Category filter
        if (filters.category) {
          filtered = filtered.filter(medicine => medicine.category === filters.category);
        }

        // Manufacturer filter
        if (filters.manufacturer) {
          filtered = filtered.filter(medicine => medicine.manufacturer === filters.manufacturer);
        }

        // Stock status filter
        if (filters.stockStatus !== 'all') {
          filtered = filtered.filter(medicine => {
            switch (filters.stockStatus) {
              case 'in-stock':
                return medicine.stockQuantity > medicine.minStockLevel;
              case 'low-stock':
                return medicine.stockQuantity <= medicine.minStockLevel && medicine.stockQuantity > 0;
              case 'out-of-stock':
                return medicine.stockQuantity === 0;
              default:
                return true;
            }
          });
        }

        // Prescription required filter
        if (filters.prescriptionRequired !== null) {
          filtered = filtered.filter(medicine => medicine.prescriptionRequired === filters.prescriptionRequired);
        }

        // Sorting
        filtered.sort((a, b) => {
          let aValue: string | number | Date;
          let bValue: string | number | Date;
          
          switch (filters.sortBy) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'category':
              aValue = a.category.toLowerCase();
              bValue = b.category.toLowerCase();
              break;
            case 'stock':
              aValue = a.stockQuantity;
              bValue = b.stockQuantity;
              break;
            case 'expiry':
              aValue = new Date(a.expiryDate);
              bValue = new Date(b.expiryDate);
              break;
            case 'price':
              aValue = a.unitPrice;
              bValue = b.unitPrice;
              break;
            default:
              return 0;
          }

          if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        return filtered;
      },

      getLowStockMedicines: () => {
        const { medicines } = get();
        return medicines.filter(medicine => 
          medicine.stockQuantity <= medicine.minStockLevel && medicine.stockQuantity > 0
        );
      },

      getExpiringSoonMedicines: () => {
        const { medicines } = get();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        return medicines.filter(medicine => 
          new Date(medicine.expiryDate) <= thirtyDaysFromNow
        );
      },

      getPendingPrescriptions: () => {
        const { prescriptions } = get();
        return prescriptions.filter(prescription => prescription.status === 'PENDING');
      },
    }),
    {
      name: 'pharmacy-store',
      partialize: (state) => ({
        filters: state.filters,
        selectedMedicine: state.selectedMedicine,
        selectedPrescription: state.selectedPrescription,
      }),
    }
  )
);

// ===== PHARMACY ACTIONS HOOK =====

export const usePharmacyActions = () => {
  const store = usePharmacyStore();
  
  return {
    // Medicine actions
    setMedicines: store.setMedicines,
    addMedicine: store.addMedicine,
    updateMedicine: store.updateMedicine,
    removeMedicine: store.removeMedicine,
    
    // Prescription actions
    setPrescriptions: store.setPrescriptions,
    addPrescription: store.addPrescription,
    updatePrescription: store.updatePrescription,
    dispensePrescription: store.dispensePrescription,
    
    // Inventory actions
    setInventory: store.setInventory,
    updateInventoryItem: store.updateInventoryItem,
    
    // Order actions
    setOrders: store.setOrders,
    addOrder: store.addOrder,
    updateOrder: store.updateOrder,
    
    // Filter actions
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    
    // Other actions
    setStats: store.setStats,
    setSelectedMedicine: store.setSelectedMedicine,
    setSelectedPrescription: store.setSelectedPrescription,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
  };
};
