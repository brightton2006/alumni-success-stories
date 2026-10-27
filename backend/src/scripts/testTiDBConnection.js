import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnv = path.resolve(__dirname, '../../../.env');
const localEnv = path.resolve(__dirname, '../../.env');
dotenv.config({ path: fs.existsSync(rootEnv) ? rootEnv : localEnv });

async function testTiDB() {
  console.log('====================================================');
  console.log('🚀 TESTING TiDB CLOUD CONNECTION');
  console.log('====================================================');

  const caPath = path.resolve(__dirname, '../../certs/ca.pem');
  const hasCa = fs.existsSync(caPath);

  console.log(`📁 CA Certificate path: ${caPath}`);
  console.log(`🔒 CA Certificate exists: ${hasCa}`);

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '4000', 10);
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || 'MtZLpdbs845HjMK5';
  const database = process.env.DATABASE_NAME || 'test';

  console.log(`\nConnecting with:`);
  console.log(`- Host: ${host}`);
  console.log(`- Port: ${port}`);
  console.log(`- User: ${user}`);
  console.log(`- Database: ${database}`);
  console.log(`- SSL: Enabled (TLSv1.2 with ISRG Root X1 CA)`);

  const sslConfig = hasCa ? {
    ca: fs.readFileSync(caPath),
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: sslConfig,
      connectTimeout: 8000
    });

    console.log('\n🎉 SUCCESS: Successfully connected to TiDB Cloud!');
    const [rows] = await connection.query('SELECT VERSION() as tidb_version, NOW() as server_time, DATABASE() as current_db;');
    console.log('Server Info:', rows[0]);

    await connection.end();
  } catch (err) {
    console.error('\n❌ Connection Failed:', err.message);
    if (err.code === 'ENOTFOUND') {
      console.log('👉 Please check your DATABASE_HOST in backend/.env.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('👉 Please check your DATABASE_USER (e.g. <cluster_prefix>.root) and password in backend/.env.');
    }
  }
}

testTiDB();
