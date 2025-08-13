// API configuration - Use internal Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Types for our data
export interface Product {
  id: number;
  name: string;
  stock_awal: number;
  keluar: number;
  stock_akhir?: number; // Calculated on frontend
  qty_di_pesan?: number; // Calculated on frontend
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: number;
  product_id: number;
  product_name?: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference_number?: string;
  created_by?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// API service class
class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}/api${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Stock management - get current stock from daily snapshot
  async getCurrentStock(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/stock');
  }

  // Stock management - update stock data
  async updateStock(id: number, stockData: {
    name: string;
    stock_awal: number;
    keluar: number;
  }): Promise<ApiResponse<Product>> {
    return this.request<Product>('/stock/update', {
      method: 'PUT',
      body: JSON.stringify({
        id,
        ...stockData
      }),
    });
  }

  // Stock transactions
  async getAllTransactions(page = 1, limit = 50, filters?: {
    product_id?: number;
    transaction_type?: 'IN' | 'OUT' | 'ADJUSTMENT';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    transactions: StockTransaction[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next_page: boolean;
      has_prev_page: boolean;
    };
  }>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    return this.request<{
      transactions: StockTransaction[];
      pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        items_per_page: number;
        has_next_page: boolean;
        has_prev_page: boolean;
      };
    }>(`/stock/transactions?${params.toString()}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; message: string; timestamp: string }>> {
    return this.request<{ status: string; message: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export default
export default apiService; 