import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { product_id, transaction_type, quantity, reason, created_by } = await request.json();
    
    if (!product_id || !transaction_type || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Product ID, transaction type, and quantity are required' },
        { status: 400 }
      );
    }

    // Get current stock for the product
    const currentStockResult = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity 
                          WHEN transaction_type = 'OUT' THEN -quantity 
                          ELSE quantity END), 0) as current_stock
      FROM stock_transactions 
      WHERE product_id = $1
    `, [product_id]);
    
    const currentStock = parseInt(currentStockResult.rows[0]?.current_stock || '0');
    let newStock = currentStock;
    
    // Calculate new stock based on transaction type
    switch (transaction_type) {
      case 'IN':
        newStock = currentStock + quantity;
        break;
      case 'OUT':
        newStock = currentStock - quantity;
        break;
      case 'ADJUSTMENT':
        newStock = quantity;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid transaction type' },
          { status: 400 }
        );
    }

    // Insert the transaction
    const result = await query(`
      INSERT INTO stock_transactions (
        product_id, 
        transaction_type, 
        quantity, 
        previous_stock, 
        new_stock, 
        reason, 
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `, [product_id, transaction_type, quantity, currentStock, newStock, reason || null, created_by || 'system']);
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stock transaction' },
      { status: 500 }
    );
  }
} 

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const product_id = searchParams.get('product_id');
    const transaction_type = searchParams.get('transaction_type');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build WHERE clause based on filters
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (product_id) {
      whereClause += ` AND st.product_id = $${paramIndex}`;
      queryParams.push(product_id);
      paramIndex++;
    }
    
    if (transaction_type) {
      whereClause += ` AND st.transaction_type = $${paramIndex}`;
      queryParams.push(transaction_type);
      paramIndex++;
    }
    
    if (start_date) {
      whereClause += ` AND DATE(st.created_at) >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      whereClause += ` AND DATE(st.created_at) <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM stock_transactions st
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.total || '0');
    
    // Get transactions with product details
    const transactionsQuery = `
      SELECT 
        st.id,
        st.product_id,
        p.name as product_name,
        st.transaction_type,
        st.quantity,
        st.previous_stock,
        st.new_stock,
        st.reason,
        st.reference_number,
        st.created_by,
        st.created_at
      FROM stock_transactions st
      LEFT JOIN products p ON st.product_id = p.id
      ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const transactionsResult = await query(transactionsQuery, [...queryParams, limit, offset]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock transactions' },
      { status: 500 }
    );
  }
} 