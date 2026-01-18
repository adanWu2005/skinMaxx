import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not configured. Database operations will fail.');
  console.error('Please ensure DATABASE_URL is set in your environment variables.');
} else {
  console.log('[Database] Connection string configured:', DATABASE_URL.substring(0, 30) + '...');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[Database] Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[Database] Query error', { text, error });
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  const timeout = setTimeout(() => {
    console.error('[Database] A client has been checked out for more than 5 seconds!');
  }, 5000);

  (client as any).release = () => {
    clearTimeout(timeout);
    (client as any).query = originalQuery;
    (client as any).release = originalRelease;
    return originalRelease();
  };

  return client;
}
