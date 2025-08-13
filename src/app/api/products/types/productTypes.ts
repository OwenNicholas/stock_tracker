// Product interface
export interface Product {
  id: number;
  name: string;
  stock_awal: number;
  keluar: number;
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