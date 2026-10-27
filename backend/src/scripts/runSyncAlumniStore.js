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

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  multipleStatements: true,
};

function readJsonSafely(relPath) {
  try {
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Could not read ${relPath}: ${err.message}`);
  }
  return [];
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 ALUMNI STORE - DATABASE CREATION & FULL SYNC');
  console.log('=====================================================\n');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`✅ Connected to MySQL on ${dbConfig.host}:${dbConfig.port}`);

    // 1. Recreate Schema in alumni_store
    console.log('\n1️⃣ Creating alumni_store database and fresh complete tables...');
    await connection.query('CREATE DATABASE IF NOT EXISTS `alumni_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE `alumni_store`;');
    
    // Drop existing view and tables in proper dependency order
    await connection.query('DROP VIEW IF EXISTS `alumni_store`.`alumni_store_overview`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`activity_logs`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`reactions`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`comments`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`stories`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`member_education`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`member_work`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`members`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`categories`;');
    await connection.query('DROP TABLE IF EXISTS `alumni_store`.`users`;');

    const schemaSql = fs.readFileSync(path.join(__dirname, '../../alumni_store_schema.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('✅ Fresh Schema & Views created in alumni_store.');

    // 2. Sync Users
    console.log('\n2️⃣ Syncing Users...');
    let users = [];
    try {
      const [uRows] = await connection.query('SELECT * FROM `alumni_db`.`users`');
      users = uRows;
    } catch (e) {
      users = readJsonSafely('../../data/users.json');
    }

    if (users && users.length > 0) {
      for (const u of users) {
        const id = u.id || u._id || `user_${Date.now()}`;
        const email = u.email;
        const role = u.role || 'USER';
        const passwordHash = u.password_hash || u.passwordHash || null;
        const fullName = u.full_name || u.fullName || u.name || email.split('@')[0];
        const phone = u.phone_number || u.phone || u.mobile || '';
        const googleId = u.google_id || u.googleId || null;
        const profileImage = u.profile_image || u.profileImage || u.avatar || null;
        const authProvider = u.auth_provider || u.authProvider || 'local';
        const isEmailVerified = (u.is_email_verified ?? u.emailVerified ?? 1) ? 1 : 0;
        const isActive = (u.is_active ?? u.isActive ?? 1) ? 1 : 0;
        const status = u.status || 'APPROVED';

        await connection.query(
          'INSERT INTO `alumni_store`.`users` (id, role, email, password_hash, full_name, phone_number, google_id, profile_image, auth_provider, is_email_verified, is_active, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), status = VALUES(status), profile_image = VALUES(profile_image)',
          [id, role, email, passwordHash, fullName, phone, googleId, profileImage, authProvider, isEmailVerified, isActive, status]
        );
      }
      console.log(`✅ Synced ${users.length} users into alumni_store.users.`);
    }

    // 3. Sync Categories
    console.log('\n3️⃣ Syncing Categories...');
    let categories = readJsonSafely('../../data/categories.json');
    if (!categories || categories.length === 0) {
      try {
        const [cRows] = await connection.query('SELECT * FROM `alumni_db`.`categories`');
        categories = cRows;
      } catch (e) {}
    }

    if (categories && categories.length > 0) {
      for (const c of categories) {
        await connection.query(
          'INSERT INTO `alumni_store`.`categories` (id, name, description, icon, color, is_active) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon = VALUES(icon), color = VALUES(color)',
          [c.id, c.name, c.description || '', c.icon || '', c.color || '', 1]
        );
      }
      console.log(`✅ Synced ${categories.length} categories into alumni_store.categories.`);
    }

    // 4. Sync Members Directory (12,048+ alumni records)
    console.log('\n4️⃣ Syncing All Alumni Master Member Records...');
    try {
      const [resMembers] = await connection.query(`
        INSERT INTO \`alumni_store\`.\`members\`
        (id, mongo_id, salutation, name, gender, email, phone_number, batch_year, batch_number, course, stream, institution, current_company, current_role, city, state, country, profile_url, thumbnail_url, full_image_url, is_verified, membership_status)
        SELECT 
          CAST(o.member_id AS CHAR(64)),
          COALESCE(o.mongo_id, CAST(o.member_id AS CHAR(64))),
          COALESCE(o.salutation, ''),
          o.name,
          COALESCE(o.gender, ''),
          COALESCE(o.email, CONCAT('member_', o.member_id, '@alumni.nec.edu')),
          COALESCE(o.phone, ''),
          o.batch_year,
          IF(o.batch_year IS NOT NULL AND o.batch_year != '', RIGHT(o.batch_year, 2), NULL),
          COALESCE(o.course, ''),
          COALESCE(o.stream, ''),
          COALESCE(o.institution, 'National Engineering College'),
          COALESCE(o.company, ''),
          COALESCE(o.position, ''),
          COALESCE(o.city, ''),
          COALESCE(o.country, 'India'),
          COALESCE(o.country, 'India'),
          o.profile_url,
          o.thumbnail_url,
          o.full_url,
          1,
          COALESCE(o.membership_status, 'Approved')
        FROM \`alumni_db\`.\`alumni_member_overview\` o
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          batch_year = VALUES(batch_year),
          course = VALUES(course),
          stream = VALUES(stream),
          current_company = VALUES(current_company),
          current_role = VALUES(current_role),
          city = VALUES(city),
          profile_url = VALUES(profile_url)
      `);
      console.log(`✅ Inserted/Updated ${resMembers.affectedRows} members in alumni_store.members.`);
    } catch (memErr) {
      console.error('❌ Error syncing members:', memErr.message);
    }

    // 5. Sync Member Education Details
    console.log('\n5️⃣ Syncing Education Records...');
    try {
      const [resEdu] = await connection.query(`
        INSERT INTO \`alumni_store\`.\`member_education\`
        (member_id, course, stream, institution, start_year, end_year)
        SELECT 
          CAST(member_id AS CHAR(64)),
          COALESCE(course, ''),
          COALESCE(stream, ''),
          COALESCE(institution, 'National Engineering College'),
          start_year,
          CAST(NULLIF(end_year, '') AS SIGNED)
        FROM \`alumni_db\`.\`education_details\`
        WHERE course IS NOT NULL OR stream IS NOT NULL
      `);
      console.log(`✅ Inserted ${resEdu.affectedRows} education history records into alumni_store.member_education.`);
    } catch (eduErr) {
      console.error('❌ Error syncing education:', eduErr.message);
    }

    // 6. Sync Member Work Details
    console.log('\n6️⃣ Syncing Work & Employment History...');
    try {
      const [resWork] = await connection.query(`
        INSERT INTO \`alumni_store\`.\`member_work\`
        (member_id, company_name, position, department, start_year, end_year, is_current)
        SELECT 
          CAST(member_id AS CHAR(64)),
          COALESCE(company_name, 'Industry Partner'),
          COALESCE(position, 'Professional'),
          COALESCE(department, ''),
          start_year,
          end_year,
          IFNULL(current_company, 1)
        FROM \`alumni_db\`.\`work_details\`
        WHERE company_name IS NOT NULL
      `);
      console.log(`✅ Inserted ${resWork.affectedRows} work history records into alumni_store.member_work.`);
    } catch (workErr) {
      console.error('❌ Error syncing work history:', workErr.message);
    }

    // 7. Sync Stories
    console.log('\n7️⃣ Syncing Stories...');
    let stories = readJsonSafely('../../data/stories.json');
    if (!stories || stories.length === 0) {
      try {
        const [sRows] = await connection.query('SELECT * FROM `alumni_db`.`stories`');
        stories = sRows;
      } catch (e) {}
    }

    if (stories && stories.length > 0) {
      for (const s of stories) {
        const id = s.id || s._id;
        const authorId = s.submittedByUserId || s.author_id || null;
        const authorName = s.submittedByUserName || s.personName || null;
        const authorEmail = s.submittedByUserEmail || null;
        const storyTitle = s.storyTitle || s.story_title || 'Alumni Story';
        const personName = s.personName || s.person_name || 'Featured Individual';
        const profession = s.profession || s.role || 'Alumnus';
        const role = s.role || s.profession || 'Alumnus';
        const company = s.company || '';
        const department = s.department || s.stream || '';
        const batchYear = s.batchYear || s.batch_year || null;
        const batchNumber = s.batchNumber || (batchYear ? String(batchYear).slice(-2) : null);
        const batchDisplay = s.batchDisplay || (batchYear ? `Batch - ${String(batchYear).slice(-2)} Alumni` : 'Batch - 26 Alumni');
        const location = s.location || 'Global';
        const category = s.category || 'Success Stories';
        const shortSummary = s.shortSummary || s.short_summary || '';
        const fullStory = s.fullStory || s.full_story || '';
        const personImage = s.personImage || s.person_image || '';
        const status = s.status || 'PUBLISHED';
        const showName = s.showName !== false ? 1 : 0;
        const isVerified = s.isVerified !== false ? 1 : 0;
        const views = s.views || 0;
        const publishedAt = s.publishedAt || s.published_at || (status === 'PUBLISHED' ? new Date() : null);

        await connection.query(
          `INSERT INTO \`alumni_store\`.\`stories\`
          (id, submitted_by_user_id, submitted_by_user_name, submitted_by_user_email, story_title, person_name, profession, role, company, department, batch_year, batch_number, batch_display, location, category, short_summary, full_story, person_image, additional_images, status, show_name, is_verified, publication_locations, views, ai_extracted_elements, ai_mind_map, journey_map, hierarchical_mind_map, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            story_title = VALUES(story_title),
            person_name = VALUES(person_name),
            profession = VALUES(profession),
            role = VALUES(role),
            company = VALUES(company),
            status = VALUES(status),
            full_story = VALUES(full_story),
            published_at = VALUES(published_at)`,
          [
            id, authorId, authorName, authorEmail, storyTitle, personName, profession, role, company, department,
            batchYear ? String(batchYear) : null, batchNumber, batchDisplay, location, category,
            shortSummary, fullStory, personImage, JSON.stringify(s.additionalImages || []),
            status, showName, isVerified, JSON.stringify(s.publicationLocations || ['Success Stories']),
            views, JSON.stringify(s.aiExtractedElements || null), JSON.stringify(s.aiMindMap || null),
            JSON.stringify(s.journeyMap || null), JSON.stringify(s.hierarchicalMindMap || null),
            publishedAt
          ]
        );
      }
      console.log(`✅ Synced ${stories.length} stories into alumni_store.stories.`);
    }

    // 8. Table Row Counts Audit
    console.log('\n=====================================================');
    console.log('📊 FINAL ALUMNI_STORE DATABASE AUDIT');
    console.log('=====================================================');
    const [tables] = await connection.query('SHOW TABLES FROM `alumni_store`');
    for (const t of tables) {
      const tName = Object.values(t)[0];
      const [cnt] = await connection.query(`SELECT COUNT(*) as count FROM \`alumni_store\`.\`${tName}\``);
      console.log(`   📌 ${tName.padEnd(25)} : ${cnt[0]?.count || 0} records`);
    }

    console.log('\n=====================================================');
    console.log('🎉 ALUMNI STORE DATABASE CREATION & SYNC COMPLETE!');
    console.log('=====================================================\n');
  } catch (err) {
    console.error('❌ Critical sync error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

main();
