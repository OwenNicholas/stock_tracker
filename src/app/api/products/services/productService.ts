import { query } from '@/lib/db';
import { Product, CreateProductData } from '../types/productTypes';

export class ProductService {
  async getAllProducts() {
    try {
      const result = await query(`
        SELECT 
          p.id,
          p.name,
          COALESCE(stock_summary.current_stock, 0) as stock_awal,
          COALESCE(stock_summary.total_out, 0) as keluar,
          COALESCE(stock_summary.current_stock, 0) - COALESCE(stock_summary.total_out, 0) as stock_akhir,
          GREATEST(0, COALESCE(stock_summary.total_out, 0) * 3 - (COALESCE(stock_summary.current_stock, 0) - COALESCE(stock_summary.total_out, 0))) as qty_di_pesan,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN (
          SELECT 
            product_id,
            SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END) as total_in,
            SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END) as total_out,
            SUM(CASE WHEN transaction_type = 'IN' THEN quantity 
                     WHEN transaction_type = 'OUT' THEN -quantity 
                     ELSE quantity END) as current_stock
          FROM stock_transactions 
          GROUP BY product_id
        ) stock_summary ON p.id = stock_summary.product_id
        ORDER BY p.name
      `);

      return {
        success: true,
        data: result.rows
      };

    } catch (error) {
      console.error('Product service error:', error);
      return {
        success: false,
        error: 'Failed to fetch products',
        status: 500
      };
    }
  }

  async getProductById(id: number) {
    try {
      const result = await query(`
        SELECT 
          p.id,
          p.name,
          COALESCE(stock_summary.current_stock, 0) as stock_awal,
          COALESCE(stock_summary.total_out, 0) as keluar,
          COALESCE(stock_summary.current_stock, 0) - COALESCE(stock_summary.total_out, 0) as stock_akhir,
          GREATEST(0, COALESCE(stock_summary.total_out, 0) * 3 - (COALESCE(stock_summary.current_stock, 0) - COALESCE(stock_summary.total_out, 0))) as qty_di_pesan,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN (
          SELECT 
            product_id,
            SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END) as total_in,
            SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END) as total_out,
            SUM(CASE WHEN transaction_type = 'IN' THEN quantity 
                     WHEN transaction_type = 'OUT' THEN -quantity 
                     ELSE quantity END) as current_stock
          FROM products p
          GROUP BY product_id
        ) stock_summary ON p.id = stock_summary.product_id
        WHERE p.id = $1
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
      console.error('Product service error:', error);
      return {
        success: false,
        error: 'Failed to fetch product',
        status: 500
      };
    }
  }

  async createProduct(data: CreateProductData) {
    try {
      const { name } = data;

      // Check if product already exists
      const existingProduct = await query(`
        SELECT id FROM products WHERE name = $1
      `, [name]);

      if (existingProduct.rows.length > 0) {
        return {
          success: false,
          error: 'Product with this name already exists',
          status: 400
        };
      }

      // Create new product
      const result = await query(`
        INSERT INTO products (name, created_at, updated_at)
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [name]);

      // Create initial stock transaction
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
        result.rows[0].id,
        'IN',
        0,
        0,
        0,
        'Product created',
        'system'
      ]);

      return {
        success: true,
        data: result.rows[0]
      };

    } catch (error) {
      console.error('Product service error:', error);
      return {
        success: false,
        error: 'Failed to create product',
        status: 500
      };
    }
  }
} 