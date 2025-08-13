import { z } from 'zod';

// Product creation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long')
});

// Product update schema
export const productUpdateSchema = z.object({
  id: z.number().positive('Product ID must be a positive number'),
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long')
});

// Product query schema
export const productQuerySchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive('Invalid product ID'))
});

// Validation functions
export const validateProductSchema = (data: unknown) => {
  try {
    const validated = productSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid data format' };
  }
};

export const validateProductUpdateSchema = (data: unknown) => {
  try {
    const validated = productUpdateSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid data format' };
  }
};

export const validateProductQuerySchema = (data: unknown) => {
  try {
    const validated = productQuerySchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid query format' };
  }
}; 