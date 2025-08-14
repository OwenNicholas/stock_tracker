import { query } from '@/lib/db';
import { StockUpdateData } from '../types/stockTypes';

export class StockService {
  async getCurrentStock() {
    try {
      const result = await query(`
        SELECT 
          id,
          name,
          stock_awal,
          keluar_manual,
          keluar_pos,
          stock_akhir,
          qty_di_pesan,
          selisih,
          days_to_order,
          created_at,
          updated_at
        FROM products
        ORDER BY name
      `);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Stock service error:', error);
      return {
        success: false,
        error: 'Failed to fetch current stock',
        status: 500
      };
    }
  }

  async getProductById(id: number) {
    try {
      const result = await query(`
        SELECT 
          id,
          name,
          stock_awal,
          keluar_manual,
          keluar_pos,
          stock_akhir,
          qty_di_pesan,
          selisih,
          days_to_order,
          created_at,
          updated_at
        FROM products
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Product not found',
          status: 404
        };
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Stock service error:', error);
      return {
        success: false,
        error: 'Failed to fetch product',
        status: 500
      };
    }
  }

  async updateStock(data: StockUpdateData) {
    try {
      const { id, name, stock_awal, keluar_manual, keluar_pos, stock_akhir, qty_di_pesan, selisih, days_to_order } = data;

      // Update the product directly in the products table
      const updateResult = await query(`
        UPDATE products 
        SET 
          name = $1, 
          stock_awal = $2,
          keluar_manual = $3,
          keluar_pos = $4,
          stock_akhir = $5,
          qty_di_pesan = $6,
          selisih = $7,
          days_to_order = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `, [name, stock_awal, keluar_manual, keluar_pos, stock_akhir, qty_di_pesan, selisih, days_to_order, id]);

      if (updateResult.rows.length === 0) {
        return {
          success: false,
          error: 'Product not found',
          status: 404
        };
      }

      return {
        success: true,
        data: updateResult.rows[0]
      };

    } catch (error) {
      console.error('Stock service error:', error);
      return {
        success: false,
        error: 'Failed to update stock',
        status: 500
      };
    }
  }

  async performRollover() {
    try {
      // Get current stock data
      const currentStock = await this.getCurrentStock();
      
      if (!currentStock.success) {
        return {
          success: false,
          error: 'Failed to fetch current stock data',
          status: 500
        };
      }

      // Update all products with new stock_awal and reset other values
      const updatePromises = (currentStock.data || []).map(async (product: any) => {
        const newStockAwal = product.stock_akhir + product.qty_di_pesan;
        
        return await query(`
          UPDATE products 
          SET 
            stock_awal = $1,
            keluar_manual = 0,
            keluar_pos = 0,
            stock_akhir = $1,
            qty_di_pesan = 0,
            selisih = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [newStockAwal, product.id]);
      });

      const updateResults = await Promise.all(updatePromises);
      
      // Get updated data
      const updatedStock = await this.getCurrentStock();
      
      if (!updatedStock.success) {
        return {
          success: false,
          error: 'Failed to fetch updated stock data',
          status: 500
        };
      }

      return {
        success: true,
        data: updatedStock.data
      };

    } catch (error) {
      console.error('Stock rollover service error:', error);
      return {
        success: false,
        error: 'Failed to perform rollover',
        status: 500
      };
    }
  }
} 