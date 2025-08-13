import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '@/lib/api/services/stockService';

const stockService = new StockService();

export async function GET(request: NextRequest) {
  try {
    const result = await stockService.getDailyRolloverStatus();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Daily rollover API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 