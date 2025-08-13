-- Create database tables for stock management

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock transactions table (for tracking all stock movements)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL DEFAULT 0,
    new_stock INTEGER NOT NULL DEFAULT 0,
    reason VARCHAR(255),
    reference_number VARCHAR(100),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily stock snapshot table for rollover functionality
CREATE TABLE IF NOT EXISTS daily_stock_snapshot (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    stock_awal INTEGER NOT NULL DEFAULT 0,
    keluar INTEGER NOT NULL DEFAULT 0,
    stock_akhir INTEGER NOT NULL DEFAULT 0,
    qty_di_pesan INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, snapshot_date)
);

-- Function to create daily stock snapshot
CREATE OR REPLACE FUNCTION create_daily_stock_snapshot()
RETURNS VOID AS $$
BEGIN
    -- Insert or update daily snapshot for today
    INSERT INTO daily_stock_snapshot (product_id, snapshot_date, stock_awal, keluar, stock_akhir, qty_di_pesan)
    SELECT 
        p.id,
        CURRENT_DATE,
        COALESCE(stock_summary.current_stock, 0),
        COALESCE(stock_summary.total_out, 0),
        COALESCE(stock_summary.current_stock, 0) - COALESCE(stock_summary.total_out, 0),
        GREATEST(0, COALESCE(stock_summary.total_out, 0) * 3 - (COALESCE(stock_summary.current_stock, 0) - COALESCE(stock_summary.total_out, 0)))
    FROM products p
    LEFT JOIN (
        SELECT 
            product_id,
            SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END) as total_in,
            SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END) as total_out,
            SUM(CASE 
                WHEN transaction_type = 'IN' THEN quantity 
                WHEN transaction_type = 'OUT' THEN -quantity 
                WHEN transaction_type = 'ADJUSTMENT' THEN 
                    CASE 
                        WHEN reason LIKE '%stock_awal%' THEN quantity
                        WHEN reason LIKE '%keluar%' THEN -quantity
                        ELSE 0
                    END
                ELSE 0 
            END) as current_stock
        FROM stock_transactions 
        GROUP BY product_id
    ) stock_summary ON p.id = stock_summary.product_id
    ON CONFLICT (product_id, snapshot_date) 
    DO UPDATE SET
        stock_awal = EXCLUDED.stock_awal,
        keluar = EXCLUDED.keluar,
        stock_akhir = EXCLUDED.stock_akhir,
        qty_di_pesan = EXCLUDED.qty_di_pesan,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to perform daily rollover (add qty_di_pesan to stock_awal)
CREATE OR REPLACE FUNCTION perform_daily_rollover()
RETURNS VOID AS $$
DECLARE
    yesterday_date DATE;
    product_record RECORD;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Get yesterday's date
    yesterday_date := current_date - INTERVAL '1 day';
    
    -- Check if we have yesterday's data
    IF EXISTS (SELECT 1 FROM daily_stock_snapshot WHERE snapshot_date = yesterday_date) THEN
        -- Normal rollover: add yesterday's qty_di_pesan to today's stock_awal
        FOR product_record IN 
            SELECT 
                product_id,
                qty_di_pesan
            FROM daily_stock_snapshot 
            WHERE snapshot_date = yesterday_date
            AND qty_di_pesan > 0  -- Only process if there's qty_di_pesan
        LOOP
            -- Create a stock IN transaction for the rollover
            INSERT INTO stock_transactions (
                product_id,
                transaction_type,
                quantity,
                previous_stock,
                new_stock,
                reason,
                created_by
            ) VALUES (
                product_record.product_id,
                'IN',
                product_record.qty_di_pesan,
                0, -- We don't track previous stock for rollover
                product_record.qty_di_pesan,
                'Daily rollover: qty_di_pesan added to stock_awal',
                'system'
            );
        END LOOP;
    ELSE
        -- First day scenario: use current day's data to calculate new stock_awal
        FOR product_record IN 
            SELECT 
                product_id,
                stock_awal,
                keluar,
                stock_akhir,
                qty_di_pesan
            FROM daily_stock_snapshot 
            WHERE snapshot_date = current_date
            AND qty_di_pesan > 0  -- Only process if there's qty_di_pesan
        LOOP
            -- Calculate new stock_awal = stock_akhir + qty_di_pesan
            INSERT INTO stock_transactions (
                product_id,
                transaction_type,
                quantity,
                previous_stock,
                new_stock,
                reason,
                created_by
            ) VALUES (
                product_record.product_id,
                'IN',
                product_record.qty_di_pesan,
                product_record.stock_akhir,
                product_record.stock_akhir + product_record.qty_di_pesan,
                'First day rollover: stock_akhir + qty_di_pesan as new stock_awal',
                'system'
            );
        END LOOP;
    END IF;
    
    -- Create today's snapshot
    PERFORM create_daily_stock_snapshot();
END;
$$ LANGUAGE plpgsql;

-- Current stock levels view (calculated from transactions and daily snapshot)
CREATE OR REPLACE VIEW current_stock AS
SELECT 
    p.id,
    p.name,
    COALESCE(ds.stock_awal, 0) as stock_awal,
    COALESCE(ds.keluar, 0) as keluar,
    COALESCE(ds.stock_akhir, 0) as stock_akhir,
    COALESCE(ds.qty_di_pesan, 0) as qty_di_pesan,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN daily_stock_snapshot ds ON p.id = ds.product_id AND ds.snapshot_date = CURRENT_DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_daily_stock_snapshot_product_date ON daily_stock_snapshot(product_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_daily_stock_snapshot_date ON daily_stock_snapshot(snapshot_date);

-- Insert sample data
INSERT INTO products (name) VALUES
('AYAM 20 PCS/PAX'),
('BLONDE 20 PCS/PAX'),
('KRIUK 14 PRS/PAX'),
('EMPAL 5 TSK/PAX'),
('SAYAP 20 PCS/PAX'),
('KEJU 40 PCS/PAX'),
('ATI AMPLA 10 PCS/PAX'),
('KULIT 10 PCS/PAX'),
('USUS 10 PCS/PAX'),
('TAHU 20 PCS/PAX'),
('TEMPE 20 PCS/PAX'),
('IKAN PIYIK 10 PRS/PAX'),
('JENGKOL GORENG 5 PRS/BKS'),
('JENGKOL SEMUR 5 PRS/BKS'),
('SAMBAL MATAH 10 PRS/BKS'),
('SAMBAL GEYBOK 2O PRS/BKS'),
('KACANG MEDE 3 Kg/PAX'),
('MINYAK WIJEN / BTL'),
('BOX 200 LBR/PAX'),
('TEKIT 10 BIJI/PAX'),
('KEURPUK JENGKOL 5 KG/PAX'),
('SAYUR ASEM 10 PRS/KTG'),
('CINCAU MADU 24 PCS/DUS'),
('NOTA BON 10 PCS/PAX'),
('BROSUR 1 RIM/PAX'),
('TELUR / BTR'),
('CABE RAWIT MERAH / KG'),
('KOL / KG'),
('TIMUN / KG'),
('TERONG / PCS'),
('DAUN PISANG / KTG'),
('BAWANG PUTIH / 500 GRAM'),
('BERAS / 50 KG'),
('GARAM  (1 PCH/KG)'),
('MICIN / 500 GRAM'),
('KECAP MANIS / 6 KG'),
('MINYAK GORENG / DERIGEN'),
('TEH CAP BOTOL / 10PCS (1PAX)'),
('TEH COAL PARA / PCS'),
('TEH PUCUK / PCS'),
('AIR MINERAL / PCS'),
('GAS / TABUNG'),
('HI-COOK / TABUNG'),
('JERIGEN KOSONG / 18 LITER')
ON CONFLICT (name) DO NOTHING;

-- Create initial daily snapshot for today
SELECT create_daily_stock_snapshot();

-- Function to manually advance to next day (for testing)
CREATE OR REPLACE FUNCTION advance_to_next_day()
RETURNS VOID AS $$
BEGIN
    -- Update all snapshot dates to tomorrow
    UPDATE daily_stock_snapshot 
    SET snapshot_date = snapshot_date + INTERVAL '1 day',
        created_at = CURRENT_TIMESTAMP;
    
    -- Update transaction dates to tomorrow
    UPDATE stock_transactions 
    SET created_at = created_at + INTERVAL '1 day'
    WHERE DATE(created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql; 