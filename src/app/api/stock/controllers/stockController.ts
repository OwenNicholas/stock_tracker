import { NextResponse } from 'next/server';
import { StockService } from '../services/stockService';
import { validateStockUpdateSchema } from '../schemas/stockSchema';

export class StockController {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService();
  }

  async updateStock(request: Request) {
    try {
      const body = await request.json();
      
      // Validate input
      const validationResult = validateStockUpdateSchema(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 400 }
        );
      }

      const { id, name, stock_awal, keluar, stock_akhir, qty_di_pesan } = body;

      // Update stock using service
      const result = await this.stockService.updateStock({
        id,
        name,
        stock_awal,
        keluar,
        stock_akhir,
        qty_di_pesan
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Stock updated successfully'
      });

    } catch (error) {
      console.error('Stock controller error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async getAllTransactions(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const filters = {
        product_id: searchParams.get('product_id'),
        transaction_type: searchParams.get('transaction_type') as 'IN' | 'OUT' | 'ADJUSTMENT' | undefined,
        start_date: searchParams.get('start_date'),
        end_date: searchParams.get('end_date')
      };

      const result = await this.stockService.getAllTransactions(page, limit, filters);

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
      console.error('Stock controller error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async createTransaction(request: Request) {
    try {
      const body = await request.json();
      
      // Validate input
      const validationResult = validateStockUpdateSchema(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 400 }
        );
      }

      const result = await this.stockService.createTransaction(body);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Transaction created successfully'
      });

    } catch (error) {
      console.error('Stock controller error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
} 