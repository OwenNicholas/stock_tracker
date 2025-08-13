import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://stock_user:stock_password@localhost:5432/stock_tracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a singleton pool instance
class DatabasePool {
  private static instance: Pool;

  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool(dbConfig);
      
      // Handle pool errors
      DatabasePool.instance.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
      });
    }
    
    return DatabasePool.instance;
  }
}

// Export the pool instance
export const db = DatabasePool.getInstance();

// Helper function for database queries with error handling
export async function query(text: string, params?: any[]) {
  const client = await db.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function for transactions
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default db; 