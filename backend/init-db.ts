import { pool } from './db';

export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('[Database] Initializing database schema...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        score INTEGER NOT NULL,
        skin_age INTEGER NOT NULL,
        skin_type VARCHAR(50) NOT NULL,
        surface_texture JSONB NOT NULL,
        pigmentation_tone JSONB NOT NULL,
        clarity JSONB NOT NULL,
        aging_structure JSONB NOT NULL,
        radiance_score INTEGER NOT NULL,
        has_radiance_bonus BOOLEAN NOT NULL,
        image_uri TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
    `);
    
    console.log('[Database] Database schema initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}
