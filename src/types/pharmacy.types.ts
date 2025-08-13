// ===== MEDICINE TYPES =====

export interface Medicine {
  id: string;
  clinicId: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  type: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL' | 'AYURVEDIC' | 'SIDDHA' | 'UNANI';
  dosageForm: string;
  strength: string;
  packSize: number;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  expiryDate: string;
  batchNumber: string;
  prescriptionRequired: boolean;
  description?: string;
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];
  storageConditions?: string;
  activeIngredients?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  clinic?: {
    id: string;
    name: string;
  };
  inventory?: InventoryItem[];
  prescriptionMedications?: PrescriptionMedication[];
  sales?: Sale[];
}

export interface MedicineCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  
  // Relations
  medicines?: Medicine[];
  subcategories?: MedicineCategory[];
  parentCategory?: MedicineCategory;
}

// ===== PRESCRIPTION TYPES =====

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  prescriptionNumber: string;
  status: 'PENDING' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'CANCELLED' | 'EXPIRED';
  medications: PrescriptionMedication[];
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
  sales?: Sale[];
}

export interface PrescriptionMedication {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicine?: Medicine;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  dispensedQuantity?: number;
  unitPrice: number;
  totalPrice: number;
  isDispensed: boolean;
  dispensedAt?: string;
  
  // Relations
  prescription?: Prescription;
}

// ===== INVENTORY TYPES =====

export interface InventoryItem {
  id: string;
  medicineId: string;
  clinicId: string;
  medicine?: Medicine;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  lastRestocked?: string;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  clinic?: {
    id: string;
    name: string;
  };
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  medicineId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'DAMAGED';
  quantity: number;
  reason?: string;
  referenceId?: string; // Order ID, Sale ID, etc.
  referenceType?: 'ORDER' | 'SALE' | 'ADJUSTMENT' | 'EXPIRY' | 'DAMAGE';
  performedBy: string;
  performedAt: string;
  notes?: string;
  
  // Relations
  inventoryItem?: InventoryItem;
  medicine?: Medicine;
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ===== ORDER TYPES =====

export interface PharmacyOrder {
  id: string;
  clinicId: string;
  supplierId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  finalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  clinic?: {
    id: string;
    name: string;
  };
  supplier?: Supplier;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  medicine?: Medicine;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
  isReceived: boolean;
  receivedAt?: string;
  
  // Relations
  order?: PharmacyOrder;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  licenseNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  orders?: PharmacyOrder[];
  medicines?: Medicine[];
}

// ===== SALES TYPES =====

export interface Sale {
  id: string;
  clinicId: string;
  prescriptionId?: string;
  patientId?: string;
  saleNumber: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  soldBy: string;
  soldAt: string;
  notes?: string;
  
  // Relations
  clinic?: {
    id: string;
    name: string;
  };
  prescription?: Prescription;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  soldByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  medicine?: Medicine;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  
  // Relations
  sale?: Sale;
}

// ===== FILTERS AND SEARCH =====

export interface MedicineFilters {
  search?: string;
  category?: string;
  manufacturer?: string;
  type?: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL' | 'AYURVEDIC' | 'SIDDHA' | 'UNANI';
  inStock?: boolean;
  lowStock?: boolean;
  expiringSoon?: boolean;
  prescriptionRequired?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'category' | 'stock' | 'expiry' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface PrescriptionFilters {
  search?: string;
  patientId?: string;
  doctorId?: string;
  status?: 'PENDING' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'CANCELLED' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'validUntil' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface SaleFilters {
  search?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  soldBy?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'soldAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

// ===== STATISTICS =====

export interface PharmacyStats {
  totalMedicines: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  totalPrescriptions: number;
  pendingPrescriptions: number;
  dispensedToday: number;
  totalSalesToday: number;
  totalRevenueToday: number;
  totalRevenueThisMonth: number;
  topSellingMedicine?: {
    id: string;
    name: string;
    quantitySold: number;
  };
  lowStockAlerts: number;
  expiryAlerts: number;
}

// ===== FORMS =====

export interface CreateMedicineData {
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  type: 'CLASSICAL' | 'PROPRIETARY' | 'HERBAL' | 'AYURVEDIC' | 'SIDDHA' | 'UNANI';
  dosageForm: string;
  strength: string;
  packSize: number;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  expiryDate: string;
  batchNumber: string;
  prescriptionRequired: boolean;
  description?: string;
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];
  storageConditions?: string;
  activeIngredients?: string[];
}

export interface UpdateMedicineData extends Partial<CreateMedicineData> {
  id: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  doctorId: string;
  medications: {
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
  }[];
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
}

export interface DispensePrescriptionData {
  prescriptionId: string;
  medications: {
    medicationId: string;
    dispensedQuantity: number;
  }[];
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
  paidAmount: number;
  notes?: string;
}

// ===== EXPORT ALL TYPES =====

export type {
  Medicine,
  MedicineCategory,
  Prescription,
  PrescriptionMedication,
  InventoryItem,
  StockMovement,
  PharmacyOrder,
  OrderItem,
  Supplier,
  Sale,
  SaleItem,
  MedicineFilters,
  PrescriptionFilters,
  SaleFilters,
  PharmacyStats,
  CreateMedicineData,
  UpdateMedicineData,
  CreatePrescriptionData,
  DispensePrescriptionData
};
