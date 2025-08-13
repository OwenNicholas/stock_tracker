// Stock update data interface
export interface StockUpdateData {
  id: number;
  name: string;
  stock_awal: number;
  keluar: number;
  stock_akhir: number;
  qty_di_pesan: number;
}

// Stock transaction interface
export interface StockTransaction {
  id: number;
  product_id: number;
  product_name?: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_number?: string;
  created_by: string;
  created_at: string;
}

// Stock transaction filters interface
export interface StockTransactionFilters {
  product_id?: number;
  transaction_type?: 'IN' | 'OUT' | 'ADJUSTMENT';
  start_date?: string;
  end_date?: string;
}

// Stock transaction creation data interface
export interface StockTransactionCreateData {
  product_id: number;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference_number?: string;
  created_by: string;
}

// Pagination interface
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// Stock transactions response interface
export interface StockTransactionsResponse {
  transactions: StockTransaction[];
  pagination: PaginationInfo;
}

// API response wrapper interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
} 