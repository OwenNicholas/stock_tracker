// Stock update data interface
export interface StockUpdateData {
  id: number;
  name: string;
  stock_awal: number;
  keluar_manual: number;
  keluar_pos: number;
  stock_akhir: number;
  qty_di_pesan: number;
  selisih: number;
  days_to_order: number;
} 