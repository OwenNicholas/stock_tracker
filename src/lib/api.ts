// API configuration - Use internal Next.js API routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Types for our data
export interface Product {
  id: number;
  name: string;
  stock_awal: number;
  keluar_manual: number;
  keluar_pos: number;
  keluar?: number; // Computed total: keluar_manual + keluar_pos
  stock_akhir: number; // Now stored in database
  qty_di_pesan: number; // Now stored in database
  selisih: number; // Difference: keluar_pos - keluar_manual
  days_to_order: number; // Days to order (0, 1, 2, 3)
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
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

  // Stock management - get current stock from products table
  async getCurrentStock(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/stock');
  }

  // Stock management - update stock data
  async updateStock(id: number, stockData: {
    name: string;
    stock_awal: number;
    keluar_manual: number;
    keluar_pos: number;
    days_to_order: number;
  }): Promise<ApiResponse<Product>> {
    return this.request<Product>(`/stock/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...stockData
      }),
    });
  }

  // Stock rollover - export current data and reset for new period
  async performRollover(): Promise<ApiResponse<{ exportedData: Product[]; updatedData: Product[] }>> {
    return this.request<{ exportedData: Product[]; updatedData: Product[] }>(`/stock/rollover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
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