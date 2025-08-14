import { StockService } from '../services/stockService';

const stockService = new StockService();

export async function POST(request: Request) {
  try {
    // Get current stock data for PDF export
    const currentStock = await stockService.getCurrentStock();
    
    if (!currentStock.success) {
      return Response.json(
        { error: 'Failed to fetch current stock data' },
        { status: 500 }
      );
    }

    // Perform rollover: update stock_awal and reset other values
    const rolloverResult = await stockService.performRollover();
    
    if (!rolloverResult.success) {
      return Response.json(
        { error: rolloverResult.error },
        { status: rolloverResult.status || 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Rollover completed successfully',
      data: {
        exportedData: currentStock.data,
        updatedData: rolloverResult.data
      }
    });
  } catch (error) {
    console.error('Stock rollover API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
