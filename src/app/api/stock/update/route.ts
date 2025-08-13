import { StockService } from '../services/stockService';

const stockService = new StockService();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, stock_awal, keluar } = body;

    // Validate required fields
    if (!id || !name) {
      return Response.json(
        { error: 'Missing required fields: id and name' },
        { status: 400 }
      );
    }

    // Calculate stock_akhir and qty_di_pesan
    const stock_akhir = stock_awal - keluar;
    const qty_di_pesan = Math.max(0, keluar * 3 - stock_akhir);

    const result = await stockService.updateStock({
      id,
      name,
      stock_awal: stock_awal || 0,
      keluar: keluar || 0,
      stock_akhir,
      qty_di_pesan
    });

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
    console.error('Stock update API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 