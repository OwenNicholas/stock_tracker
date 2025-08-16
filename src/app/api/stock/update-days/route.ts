import { StockService } from '../services/stockService';

const stockService = new StockService();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { days_to_order } = body as { days_to_order?: number };

    if (days_to_order === undefined || days_to_order === null) {
      return Response.json(
        { error: 'Missing required field: days_to_order' },
        { status: 400 }
      );
    }

    if (![0, 1, 2, 3].includes(days_to_order)) {
      return Response.json(
        { error: 'days_to_order must be one of 0, 1, 2, 3' },
        { status: 400 }
      );
    }

    const result = await stockService.updateDaysForAll(days_to_order);

    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }

    return Response.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Bulk days_to_order update API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


