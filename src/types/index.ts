// Product and Stock related types
export interface Variant {
  size: string;
  quantity?: number;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  variants: Variant[];
  dateAdded?: Date;
}

export interface StockEntry {
  _id: string;
  product: Product;
  variants: Variant[];
  // quantity: number;
  date: Date;
  notes?: string;
  status?: string;
  customer?: string;
}

export interface StockEntryInput {
  size: string;
  mrp: number;
  quantity: number;
}

export interface SaleData {
  productId: string;
  size: string;
  mrp: number;
  quantity: number;
  notes?: string;
}

export interface ProductWithStock extends Product {
  stockEntries?: StockEntry[];
  current_stock?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardData {
  totalStock: number;
  lowStockCount: number;
  totalStockValue: number;
}

export interface SalesData {
  totalSales: number;
}

// Error type
export interface ApiError {
  message: string;
  error?: string;
} 