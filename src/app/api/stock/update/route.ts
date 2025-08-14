import { StockService } from '../services/stockService';

const stockService = new StockService();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, stock_awal, keluar_manual, keluar_pos, days_to_order } = body;

    // Validate required fields
    if (!id || !name) {
      return Response.json(
        { error: 'Missing required fields: id and name' },
        { status: 400 }
      );
    }

    // Get current product data to preserve days_to_order if not provided
    const currentProduct = await stockService.getProductById(id);
    if (!currentProduct.success) {
      return Response.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate stock_akhir, qty_di_pesan, and selisih
    const stock_akhir = stock_awal - keluar_manual;
    const days = days_to_order !== undefined ? days_to_order : (currentProduct.data?.days_to_order || 3);
    
    // If days_to_order is 0, set qty_di_pesan to 0, otherwise use the formula
    const qty_di_pesan = days === 0 ? 0 : Math.max(0, keluar_manual * days - stock_akhir);
    
    const selisih = (keluar_pos || 0) - (keluar_manual || 0);

    const result = await stockService.updateStock({
      id,
      name,
      stock_awal: stock_awal || 0,
      keluar_manual: keluar_manual || 0,
      keluar_pos: keluar_pos || 0,
      stock_akhir,
      qty_di_pesan,
      selisih,
      days_to_order: days
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