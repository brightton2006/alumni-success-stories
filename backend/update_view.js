import { mysqlDb, initMySQLDatabase } from './src/mysql.js';

async function updateView() {
  try {
    await initMySQLDatabase();
    const viewSql = `
      CREATE OR REPLACE VIEW alumni_member_overview AS 
      SELECT 
        m.id AS member_id, 
        m.mongo_id, 
        m.salutation,
        m.name, 
        m.email, 
        (SELECT mobile FROM contact_details WHERE member_id = m.id LIMIT 1) AS phone, 
        m.gender, 
        (SELECT course FROM education_details WHERE member_id = m.id ORDER BY id ASC LIMIT 1) AS course, 
        (SELECT stream FROM education_details WHERE member_id = m.id ORDER BY id ASC LIMIT 1) AS stream, 
        (SELECT institution FROM education_details WHERE member_id = m.id ORDER BY id ASC LIMIT 1) AS institution, 
        (SELECT end_year FROM education_details WHERE member_id = m.id ORDER BY id ASC LIMIT 1) AS batch_year, 
        (SELECT company_name FROM work_details WHERE member_id = m.id ORDER BY id ASC LIMIT 1) AS company, 
        (SELECT position FROM work_details WHERE member_id = m.id ORDER BY id ASC LIMIT 1) AS position, 
        (SELECT city FROM contact_details WHERE member_id = m.id LIMIT 1) AS city, 
        (SELECT country FROM contact_details WHERE member_id = m.id LIMIT 1) AS country, 
        (SELECT profile_url FROM member_pictures WHERE member_id = m.id LIMIT 1) AS profile_url, 
        (SELECT thumbnail_url FROM member_pictures WHERE member_id = m.id LIMIT 1) AS thumbnail_url, 
        (SELECT full_url FROM member_pictures WHERE member_id = m.id LIMIT 1) AS full_url, 
        (SELECT status FROM membership_details WHERE member_id = m.id LIMIT 1) AS membership_status, 
        (SELECT detail_value FROM member_other_details WHERE member_id = m.id AND detail_key = 'Chapter' LIMIT 1) AS chapter 
      FROM members m;
    `;

    await mysqlDb.query(viewSql);
    console.log('✅ Updated alumni_member_overview view in MySQL!');

    const r = await mysqlDb.query('SELECT COUNT(*) AS c FROM alumni_member_overview');
    console.log('📊 Exact unique member count in overview view:', r[0].c);
    process.exit(0);
  } catch (err) {
    console.error('Update View Error:', err);
    process.exit(1);
  }
}

updateView();
