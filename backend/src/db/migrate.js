import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const isSslNeeded = connectionString.includes('sslmode=require') || 
                      connectionString.includes('neon.tech') || 
                      connectionString.includes('supabase.co') ||
                      process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString,
    ssl: isSslNeeded ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    const client = await pool.connect();
    console.log('✅ Connected.');

    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executing schema.sql with RLS policies...');
    await client.query(sql);
    console.log('✅ Database schema and RLS policies created successfully!');

    // Verify seed user
    const res = await client.query('SELECT id, email FROM users');
    console.log(`👤 Users in database (${res.rows.length}):`);
    res.rows.forEach(u => console.log(`   - [${u.id}] ${u.email}`));

    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
