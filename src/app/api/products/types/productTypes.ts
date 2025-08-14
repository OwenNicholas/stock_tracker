// Product interface
export interface Product {
  id: number;
  name: string;
  stock_awal: number;
  keluar_manual: number;
  keluar_pos: number;
  keluar?: number; // Computed total: keluar_manual + keluar_pos
  stock_akhir: number;
  qty_di_pesan: number;
  created_at: string;
  updated_at: string;
}

// Product creation data interface
export interface CreateProductData {
  name: string;
}

// Product update data interface
export interface UpdateProductData {
  id: number;
  name: string;
}

// Product query parameters interface
export interface ProductQueryParams {
  id: string;
}

// API response wrapper interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
} 