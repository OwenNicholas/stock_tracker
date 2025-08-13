import { NextResponse } from 'next/server';
import { ProductService } from '../services/productService';
import { validateProductSchema } from '../schemas/productSchema';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getAllProducts() {
    try {
      const result = await this.productService.getAllProducts();

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Product controller error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async createProduct(request: Request) {
    try {
      const body = await request.json();
      
      // Validate input
      const validationResult = validateProductSchema(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 400 }
        );
      }

      const result = await this.productService.createProduct(body);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Product created successfully'
      });

    } catch (error) {
      console.error('Product controller error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async getProductById(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required' },
          { status: 400 }
        );
      }

      const result = await this.productService.getProductById(parseInt(id));

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Product controller error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
} 