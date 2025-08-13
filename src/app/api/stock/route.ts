import { StockService } from './services/stockService';

const stockService = new StockService();

export async function GET(request: Request) {
  try {
    // Get current stock from daily snapshot
    const result = await stockService.getCurrentStock();
    
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
    console.error('Stock API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 