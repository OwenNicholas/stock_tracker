import { z } from 'zod';

// Stock update schema
export const stockUpdateSchema = z.object({
  id: z.number().positive('Product ID must be a positive number'),
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  stock_awal: z.number().min(0, 'Stock awal cannot be negative'),
  keluar_manual: z.number().min(0, 'Keluar manual cannot be negative'),
  keluar_pos: z.number().min(0, 'Keluar POS cannot be negative'),
  stock_akhir: z.number(),
  qty_di_pesan: z.number().min(0, 'Qty di pesan cannot be negative')
});

// Stock transaction filters schema
export const stockTransactionFiltersSchema = z.object({
  product_id: z.number().positive().optional(),
  transaction_type: z.enum(['IN', 'OUT', 'ADJUSTMENT']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

// Stock transaction creation schema
export const stockTransactionSchema = z.object({
  product_id: z.number().positive('Product ID must be a positive number'),
  transaction_type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    errorMap: () => ({ message: 'Transaction type must be IN, OUT, or ADJUSTMENT' })
  }),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  reference_number: z.string().optional(),
  created_by: z.string().min(1, 'Created by is required').max(100, 'Created by too long')
});

// Validation functions
export const validateStockUpdateSchema = (data: unknown) => {
  try {
    const validated = stockUpdateSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid data format' };
  }
};

export const validateStockTransactionFiltersSchema = (data: unknown) => {
  try {
    const validated = stockTransactionFiltersSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid filter format' };
  }
};

export const validateStockTransactionSchema = (data: unknown) => {
  try {
    const validated = stockTransactionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid transaction format' };
  }
}; 