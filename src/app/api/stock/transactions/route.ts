import { StockService } from '../services/stockService';

const stockService = new StockService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Parse filter parameters
    const filters = {
      product_id: searchParams.get('product_id') ? parseInt(searchParams.get('product_id')!) : undefined,
      transaction_type: searchParams.get('transaction_type') as 'IN' | 'OUT' | 'ADJUSTMENT' | undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined
    };

    const result = await stockService.getAllTransactions(page, limit, filters);
    
    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }

    return Response.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Stock transactions API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 