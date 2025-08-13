import { query } from '@/lib/db';
import { StockUpdateData, StockTransaction, StockTransactionFilters } from '../types/stockTypes';

export class StockService {
  async getCurrentStock() {
    try {
      const result = await query(`
        SELECT 
          p.id,
          p.name,
          COALESCE(ds.stock_awal, 0) as stock_awal,
          COALESCE(ds.keluar, 0) as keluar,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN daily_stock_snapshot ds ON p.id = ds.product_id AND ds.snapshot_date = CURRENT_DATE
        ORDER BY p.name
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

  async updateStock(data: StockUpdateData) {
    try {
      const { id, name, stock_awal, keluar, stock_akhir, qty_di_pesan } = data;

      // Update the product name
      const updateResult = await query(`
        UPDATE products 
        SET name = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [name, id]);

      if (updateResult.rows.length === 0) {
        return {
          success: false,
          error: 'Product not found',
          status: 404
        };
      }

      // Create stock transactions to record the manual updates
      const currentStockResult = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END), 0) as total_in,
          COALESCE(SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END), 0) as total_out
        FROM stock_transactions 
        WHERE product_id = $1
      `, [id]);

      const currentTotalIn = parseInt(currentStockResult.rows[0]?.total_in || '0');
      const currentTotalOut = parseInt(currentStockResult.rows[0]?.total_out || '0');
      
      // Calculate adjustments needed
      const stockAwalAdjustment = stock_awal - currentTotalIn;
      const keluarAdjustment = keluar - currentTotalOut;
      
      // Create adjustment transactions if needed
      if (stockAwalAdjustment !== 0) {
        await query(`
          INSERT INTO stock_transactions (
            product_id, 
            transaction_type, 
            quantity, 
            previous_stock, 
            new_stock, 
            reason, 
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          id, 
          'ADJUSTMENT', 
          Math.abs(stockAwalAdjustment), 
          currentTotalIn, 
          stock_awal, 
          'Manual stock_awal adjustment', 
          'system'
        ]);
      }
      
      if (keluarAdjustment !== 0) {
        await query(`
          INSERT INTO stock_transactions (
            product_id, 
            transaction_type, 
            quantity, 
            previous_stock, 
            new_stock, 
            reason, 
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          id, 
          'ADJUSTMENT', 
          Math.abs(keluarAdjustment), 
          currentTotalOut, 
          keluar, 
          'Manual keluar adjustment', 
          'system'
        ]);
      }

      // Update today's daily snapshot with the new values
      await query(`
        INSERT INTO daily_stock_snapshot (product_id, snapshot_date, stock_awal, keluar, stock_akhir, qty_di_pesan)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
        ON CONFLICT (product_id, snapshot_date) 
        DO UPDATE SET
          stock_awal = EXCLUDED.stock_awal,
          keluar = EXCLUDED.keluar,
          stock_akhir = EXCLUDED.stock_akhir,
          qty_di_pesan = EXCLUDED.qty_di_pesan,
          created_at = CURRENT_TIMESTAMP
      `, [id, stock_awal, keluar, stock_akhir, qty_di_pesan]);

      // Return the updated product data from the daily snapshot
      const updatedProductResult = await query(`
        SELECT 
          p.id,
          p.name,
          ds.stock_awal,
          ds.keluar,
          ds.stock_akhir,
          ds.qty_di_pesan,
          p.created_at,
          CURRENT_TIMESTAMP as updated_at
        FROM products p
        LEFT JOIN daily_stock_snapshot ds ON p.id = ds.product_id AND ds.snapshot_date = CURRENT_DATE
        WHERE p.id = $1
      `, [id]);

      if (updatedProductResult.rows.length === 0) {
        return {
          success: false,
          error: 'Failed to retrieve updated product data',
          status: 500
        };
      }

      return {
        success: true,
        data: updatedProductResult.rows[0]
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

  async getAllTransactions(page: number, limit: number, filters: StockTransactionFilters) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters.product_id) {
        whereClause += ` AND st.product_id = $${paramIndex}`;
        queryParams.push(filters.product_id);
        paramIndex++;
      }
      if (filters.transaction_type) {
        whereClause += ` AND st.transaction_type = $${paramIndex}`;
        queryParams.push(filters.transaction_type);
        paramIndex++;
      }
      if (filters.start_date) {
        whereClause += ` AND DATE(st.created_at) >= $${paramIndex}`;
        queryParams.push(filters.start_date);
        paramIndex++;
      }
      if (filters.end_date) {
        whereClause += ` AND DATE(st.created_at) <= $${paramIndex}`;
        queryParams.push(filters.end_date);
        paramIndex++;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM stock_transactions st ${whereClause}`;
      const countResult = await query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0]?.total || '0');

      // Get transactions
      const transactionsQuery = `
        SELECT
          st.id, st.product_id, p.name as product_name, st.transaction_type, st.quantity,
          st.previous_stock, st.new_stock, st.reason, st.reference_number, st.created_by, st.created_at
        FROM stock_transactions st
        LEFT JOIN products p ON st.product_id = p.id
        ${whereClause}
        ORDER BY st.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      const transactionsResult = await query(transactionsQuery, [...queryParams, limit, offset]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          transactions: transactionsResult.rows,
          pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: total,
            items_per_page: limit,
            has_next_page: hasNextPage,
            has_prev_page: hasPrevPage
          }
        }
      };

    } catch (error) {
      console.error('Stock service error:', error);
      return {
        success: false,
        error: 'Failed to fetch stock transactions',
        status: 500
      };
    }
  }

  async createTransaction(data: any) {
    try {
      // Implementation for creating new transactions
      // This would be used for manual stock in/out operations
      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error('Stock service error:', error);
      return {
        success: false,
        error: 'Failed to create transaction',
        status: 500
      };
    }
  }
} 