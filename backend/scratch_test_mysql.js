import { mysqlDb, initMySQLDatabase } from './src/mysql.js';

async function testQuery() {
  try {
    await initMySQLDatabase();
    console.log('Testing getMembersFiltered...');
    const result = await mysqlDb.getMembersFiltered({ page: 1, limit: 3 });
    console.log('Result count:', result.total);
    console.log('Rows sample:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Test Query Error:', err);
  }
}

testQuery();
