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

async function execute() {
  console.log('--- STARTING ALUMNI_STORE POPULATION ---');
  const conn = await mysql.createConnection(dbConfig);
  try {
    console.log('1. Preparing alumni_store database...');
    await conn.query('CREATE DATABASE IF NOT EXISTS `alumni_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await conn.query('USE `alumni_store`;');

    console.log('2. Dropping old tables in alumni_store...');
    await conn.query('DROP VIEW IF EXISTS `alumni_store`.`alumni_store_overview`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`activity_logs`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`reactions`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`comments`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`stories`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`member_education`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`member_work`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`members`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`categories`;');
    await conn.query('DROP TABLE IF EXISTS `alumni_store`.`users`;');

    console.log('3. Creating Users table...');
    await conn.query(`
      CREATE TABLE \`users\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`role\` VARCHAR(32) DEFAULT 'USER' NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NULL,
        \`full_name\` VARCHAR(150) NOT NULL,
        \`phone_number\` VARCHAR(30) NULL DEFAULT '',
        \`google_id\` VARCHAR(100) NULL,
        \`profile_image\` TEXT NULL,
        \`auth_provider\` VARCHAR(50) DEFAULT 'local',
        \`is_email_verified\` TINYINT(1) DEFAULT 1 NOT NULL,
        \`is_active\` TINYINT(1) DEFAULT 1 NOT NULL,
        \`status\` VARCHAR(32) DEFAULT 'APPROVED' NOT NULL,
        \`batch_year\` VARCHAR(20) NULL,
        \`batch_number\` VARCHAR(20) NULL,
        \`department\` VARCHAR(100) NULL,
        \`company\` VARCHAR(150) NULL,
        \`designation\` VARCHAR(150) NULL,
        \`location\` VARCHAR(150) NULL,
        \`bio\` TEXT NULL,
        \`linkedin_url\` VARCHAR(255) NULL,
        \`member_id\` VARCHAR(64) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_users_email\` (\`email\`),
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('4. Creating Categories table...');
    await conn.query(`
      CREATE TABLE \`categories\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        \`description\` TEXT NULL,
        \`icon\` VARCHAR(64) NULL,
        \`color\` VARCHAR(64) NULL,
        \`is_active\` TINYINT(1) DEFAULT 1 NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('5. Creating Members table...');
    await conn.query(`
      CREATE TABLE \`members\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`mongo_id\` VARCHAR(64) NULL,
        \`user_id\` VARCHAR(64) NULL,
        \`salutation\` VARCHAR(50) NULL DEFAULT '',
        \`name\` VARCHAR(255) NOT NULL,
        \`gender\` VARCHAR(50) NULL DEFAULT '',
        \`date_of_birth\` DATE NULL,
        \`label\` VARCHAR(255) NULL DEFAULT '',
        \`email\` VARCHAR(255) NOT NULL,
        \`alternate_email\` VARCHAR(255) NULL DEFAULT '',
        \`phone_number\` VARCHAR(100) NULL DEFAULT '',
        \`roll_number\` VARCHAR(100) NULL DEFAULT '',
        \`batch_year\` VARCHAR(50) NULL,
        \`batch_number\` VARCHAR(50) NULL,
        \`course\` VARCHAR(150) NULL DEFAULT '',
        \`stream\` VARCHAR(150) NULL DEFAULT '',
        \`institution\` VARCHAR(255) DEFAULT 'National Engineering College',
        \`current_company\` VARCHAR(255) NULL DEFAULT '',
        \`current_role\` VARCHAR(255) NULL DEFAULT '',
        \`work_department\` VARCHAR(255) NULL DEFAULT '',
        \`experience_years\` INT NULL DEFAULT 0,
        \`city\` VARCHAR(150) NULL DEFAULT '',
        \`state\` VARCHAR(150) NULL DEFAULT '',
        \`country\` VARCHAR(150) DEFAULT 'India',
        \`pincode\` VARCHAR(50) NULL DEFAULT '',
        \`location\` VARCHAR(255) NULL DEFAULT '',
        \`profile_url\` TEXT NULL,
        \`thumbnail_url\` TEXT NULL,
        \`full_image_url\` TEXT NULL,
        \`linkedin_url\` TEXT NULL,
        \`facebook_url\` TEXT NULL,
        \`twitter_url\` TEXT NULL,
        \`github_url\` TEXT NULL,
        \`website_url\` TEXT NULL,
        \`youtube_url\` TEXT NULL,
        \`instagram_url\` TEXT NULL,
        \`skills\` JSON NULL,
        \`bio\` TEXT NULL,
        \`membership_status\` VARCHAR(50) DEFAULT 'Approved',
        \`is_verified\` TINYINT(1) DEFAULT 1 NOT NULL,
        \`is_mentor_available\` TINYINT(1) DEFAULT 0 NOT NULL,
        \`registered_on\` DATETIME NULL,
        \`approved_on\` DATETIME NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_members_email\` (\`email\`),
        INDEX \`idx_members_name\` (\`name\`),
        INDEX \`idx_members_batch\` (\`batch_year\`),
        INDEX \`idx_members_stream\` (\`stream\`),
        INDEX \`idx_members_company\` (\`current_company\`(100)),
        INDEX \`idx_members_city\` (\`city\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('6. Creating Member Education table...');
    await conn.query(`
      CREATE TABLE \`member_education\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`member_id\` VARCHAR(64) NOT NULL,
        \`course\` VARCHAR(150) NULL DEFAULT '',
        \`stream\` VARCHAR(150) NULL DEFAULT '',
        \`institution\` VARCHAR(255) NULL DEFAULT 'National Engineering College',
        \`start_year\` VARCHAR(50) NULL,
        \`end_year\` VARCHAR(50) NULL,
        \`roll_no\` VARCHAR(100) NULL DEFAULT '',
        \`site_id\` VARCHAR(100) NULL DEFAULT '',
        INDEX \`idx_medu_member\` (\`member_id\`),
        INDEX \`idx_medu_course\` (\`course\`),
        INDEX \`idx_medu_stream\` (\`stream\`),
        INDEX \`idx_medu_end_year\` (\`end_year\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('7. Creating Member Work table...');
    await conn.query(`
      CREATE TABLE \`member_work\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`member_id\` VARCHAR(64) NOT NULL,
        \`company_name\` VARCHAR(255) NOT NULL,
        \`position\` VARCHAR(255) NOT NULL,
        \`department\` VARCHAR(255) NULL DEFAULT '',
        \`start_year\` VARCHAR(50) NULL,
        \`start_month\` VARCHAR(50) NULL,
        \`end_year\` VARCHAR(50) NULL,
        \`end_month\` VARCHAR(50) NULL,
        \`is_current\` TINYINT(1) DEFAULT 1 NOT NULL,
        INDEX \`idx_mwork_member\` (\`member_id\`),
        INDEX \`idx_mwork_company\` (\`company_name\`(100)),
        INDEX \`idx_mwork_position\` (\`position\`(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('8. Creating Stories table...');
    await conn.query(`
      CREATE TABLE \`stories\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`author_member_id\` VARCHAR(64) NULL,
        \`submitted_by_user_id\` VARCHAR(64) NULL,
        \`submitted_by_user_name\` VARCHAR(150) NULL,
        \`submitted_by_user_email\` VARCHAR(255) NULL,
        \`author_admin_id\` VARCHAR(64) NULL,
        \`story_title\` VARCHAR(255) NOT NULL,
        \`person_name\` VARCHAR(150) NOT NULL,
        \`profession\` VARCHAR(150) NULL,
        \`role\` VARCHAR(150) NULL,
        \`company\` VARCHAR(150) NULL,
        \`department\` VARCHAR(100) NULL,
        \`batch_year\` VARCHAR(20) NULL,
        \`batch_number\` VARCHAR(20) NULL,
        \`batch_display\` VARCHAR(100) NULL,
        \`location\` VARCHAR(150) NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`short_summary\` TEXT NOT NULL,
        \`full_story\` LONGTEXT NOT NULL,
        \`person_image\` LONGTEXT NULL,
        \`additional_images\` JSON NULL,
        \`status\` VARCHAR(50) DEFAULT 'PENDING_REVIEW' NOT NULL,
        \`show_name\` TINYINT(1) DEFAULT 1 NOT NULL,
        \`is_verified\` TINYINT(1) DEFAULT 1 NOT NULL,
        \`publication_locations\` JSON NULL,
        \`views\` INT DEFAULT 0 NOT NULL,
        \`rejection_reason\` TEXT NULL,
        \`admin_feedback\` TEXT NULL,
        \`ai_extracted_elements\` JSON NULL,
        \`ai_mind_map\` JSON NULL,
        \`journey_map\` JSON NULL,
        \`hierarchical_mind_map\` JSON NULL,
        \`published_at\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_stories_status\` (\`status\`),
        INDEX \`idx_stories_category\` (\`category\`),
        INDEX \`idx_stories_user\` (\`submitted_by_user_id\`),
        INDEX \`idx_stories_member\` (\`author_member_id\`),
        INDEX \`idx_stories_published\` (\`published_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('9. Creating Comments, Reactions, and Activity Logs tables...');
    await conn.query(`
      CREATE TABLE \`comments\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`story_id\` VARCHAR(64) NOT NULL,
        \`author_name\` VARCHAR(150) NOT NULL,
        \`author_email\` VARCHAR(255) NULL,
        \`batch_number\` VARCHAR(20) NULL,
        \`author_tag\` VARCHAR(100) NULL,
        \`comment_text\` TEXT NOT NULL,
        \`likes\` INT DEFAULT 0 NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_comments_story\` (\`story_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE \`reactions\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`story_id\` VARCHAR(64) NOT NULL,
        \`reaction_type\` VARCHAR(50) NOT NULL,
        \`user_id\` VARCHAR(64) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_reactions_story\` (\`story_id\`),
        INDEX \`idx_reactions_user\` (\`user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE \`activity_logs\` (
        \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` VARCHAR(64) NULL,
        \`action\` VARCHAR(100) NOT NULL,
        \`entity_type\` VARCHAR(50) NOT NULL,
        \`entity_id\` VARCHAR(64) NULL,
        \`details\` JSON NULL,
        \`ip_address\` VARCHAR(45) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_logs_user\` (\`user_id\`),
        INDEX \`idx_logs_action\` (\`action\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('10. Creating Overview View...');
    await conn.query(`
      CREATE OR REPLACE VIEW \`alumni_store_overview\` AS
      SELECT 
        m.id AS member_id,
        m.mongo_id,
        m.name,
        m.salutation,
        m.gender,
        m.email,
        m.phone_number AS phone,
        m.roll_number,
        m.batch_year,
        m.batch_number,
        m.course,
        m.stream,
        m.institution,
        m.current_company AS company,
        m.current_role AS position,
        m.city,
        m.state,
        m.country,
        m.profile_url,
        m.thumbnail_url,
        m.linkedin_url,
        m.is_verified,
        m.is_mentor_available,
        m.membership_status,
        (SELECT COUNT(*) FROM stories s WHERE s.author_member_id = m.id OR (s.submitted_by_user_email = m.email AND s.status = 'PUBLISHED')) AS published_stories_count
      FROM members m;
    `);

    // --- DATA POPULATION ---
    console.log('\n--- POPULATING DATA INTO ALUMNI_STORE ---');

    // USERS
    console.log('Populating Users...');
    try {
      const [uRes] = await conn.query(`
        INSERT INTO \`alumni_store\`.\`users\` 
        (id, role, email, password_hash, full_name, phone_number, is_email_verified, is_active, status)
        SELECT 
          id, 
          COALESCE(role, 'USER'), 
          email, 
          password_hash, 
          COALESCE(full_name, 'Alumni User'), 
          COALESCE(phone_number, ''), 
          IFNULL(is_email_verified, 1), 
          IFNULL(is_active, 1), 
          COALESCE(status, 'APPROVED')
        FROM \`alumni_db\`.\`users\`
      `);
      console.log(`✅ Users transferred: ${uRes.affectedRows}`);
    } catch (e) {
      console.error('Users transfer warning:', e.message);
    }

    // CATEGORIES
    console.log('Populating Categories...');
    try {
      const defaultCategories = [
        ['cat_entrepreneurship', 'Entrepreneurship', 'Founders, co-founders, and business innovators', 'Rocket', 'from-amber-500 to-orange-600'],
        ['cat_tech_leadership', 'Technology & Engineering', 'Tech leads, architects, and engineering pioneers', 'Cpu', 'from-blue-500 to-indigo-600'],
        ['cat_research', 'Research & Academia', 'Scholars, researchers, scientists, and educators', 'GraduationCap', 'from-purple-500 to-pink-600'],
        ['cat_social_impact', 'Social Impact & Public Service', 'Community leaders, civil servants, and activists', 'Heart', 'from-rose-500 to-red-600'],
        ['cat_creative_arts', 'Creative Arts & Media', 'Designers, writers, filmmakers, and artists', 'Palette', 'from-emerald-500 to-teal-600'],
        ['cat_corporate', 'Corporate & Management', 'Executives, directors, and strategic leaders', 'Briefcase', 'from-cyan-500 to-blue-600'],
        ['cat_higher_studies', 'Higher Education', 'Masters, PhD, and global university admissions', 'BookOpen', 'from-violet-500 to-purple-600'],
        ['cat_sports', 'Sports & Extra-curricular', 'Athletes, coaches, and sports champions', 'Award', 'from-yellow-500 to-amber-600'],
        ['cat_women_achievers', 'Women Achievers', 'Celebrating remarkable women alumni leaders', 'Sparkles', 'from-fuchsia-500 to-pink-600'],
        ['cat_young_alumni', 'Young Alumni Spotlight', 'Rising stars and early-career breakthroughs', 'Zap', 'from-lime-500 to-green-600']
      ];
      for (const cat of defaultCategories) {
        await conn.query('INSERT IGNORE INTO `alumni_store`.`categories` (id, name, description, icon, color, is_active) VALUES (?, ?, ?, ?, ?, 1)', cat);
      }
      console.log('✅ Categories populated');
    } catch (e) {
      console.error('Categories warning:', e.message);
    }

    // MEMBERS
    console.log('Populating Master Members (12,000+)...');
    const [mRes] = await conn.query(`
      INSERT INTO \`alumni_store\`.\`members\`
      (id, mongo_id, salutation, name, gender, email, phone_number, batch_year, batch_number, course, stream, institution, current_company, current_role, city, country, profile_url, thumbnail_url, full_image_url, is_verified, membership_status)
      SELECT 
        CAST(o.member_id AS CHAR(64)),
        COALESCE(o.mongo_id, CAST(o.member_id AS CHAR(64))),
        COALESCE(o.salutation, ''),
        o.name,
        COALESCE(o.gender, ''),
        COALESCE(NULLIF(o.email, ''), CONCAT('alumni_', o.member_id, '@alumni.nec.edu')),
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
        o.profile_url,
        o.thumbnail_url,
        o.full_url,
        1,
        COALESCE(o.membership_status, 'Approved')
      FROM \`alumni_db\`.\`alumni_member_overview\` o
    `);
    console.log(`✅ Members populated: ${mRes.affectedRows}`);

    // MEMBER EDUCATION
    console.log('Populating Member Education Details (18,000+)...');
    const [eduRes] = await conn.query(`
      INSERT INTO \`alumni_store\`.\`member_education\`
      (member_id, course, stream, institution, start_year, end_year, site_id)
      SELECT 
        CAST(member_id AS CHAR(64)),
        COALESCE(course, ''),
        COALESCE(stream, ''),
        COALESCE(institution, 'National Engineering College'),
        COALESCE(start_year, ''),
        COALESCE(end_year, ''),
        COALESCE(site_id, '')
      FROM \`alumni_db\`.\`education_details\`
    `);
    console.log(`✅ Member Education details populated: ${eduRes.affectedRows}`);

    // MEMBER WORK
    console.log('Populating Member Work Details (6,000+)...');
    const [wRes] = await conn.query(`
      INSERT INTO \`alumni_store\`.\`member_work\`
      (member_id, company_name, position, department, start_year, start_month, end_year, end_month, is_current)
      SELECT 
        CAST(member_id AS CHAR(64)),
        COALESCE(NULLIF(company_name, ''), 'Industry Organization'),
        COALESCE(NULLIF(position, ''), 'Professional'),
        COALESCE(department, ''),
        COALESCE(start_year, ''),
        COALESCE(start_month, ''),
        COALESCE(end_year, ''),
        COALESCE(end_month, ''),
        CASE 
          WHEN current_company = 1 OR current_company = '1' THEN 1 
          WHEN current_company = 0 OR current_company = '0' THEN 0 
          ELSE 1 
        END
      FROM \`alumni_db\`.\`work_details\`
    `);
    console.log(`✅ Member Work details populated: ${wRes.affectedRows}`);

    // STORIES
    console.log('Populating Stories...');
    const storiesPath = path.join(__dirname, '../../data/stories.json');
    let stories = [];
    if (fs.existsSync(storiesPath)) {
      stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
    }

    if (stories.length > 0) {
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
        const publishedAt = s.publishedAt ? new Date(s.publishedAt) : (s.published_at ? new Date(s.published_at) : (status === 'PUBLISHED' ? new Date() : null));

        await conn.query(
          `INSERT INTO \`alumni_store\`.\`stories\`
          (id, submitted_by_user_id, submitted_by_user_name, submitted_by_user_email, story_title, person_name, profession, role, company, department, batch_year, batch_number, batch_display, location, category, short_summary, full_story, person_image, additional_images, status, show_name, is_verified, publication_locations, views, ai_extracted_elements, ai_mind_map, journey_map, hierarchical_mind_map, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            story_title = VALUES(story_title),
            person_name = VALUES(person_name),
            status = VALUES(status)`,
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
      console.log(`✅ Stories populated: ${stories.length}`);
    }

    // AUDIT
    console.log('\n=============================================');
    console.log('📊 ALUMNI_STORE FINAL VERIFICATION');
    console.log('=============================================');
    const [tables] = await conn.query('SHOW FULL TABLES');
    for (const r of tables) {
      const name = Object.values(r)[0];
      const type = Object.values(r)[1];
      if (type === 'BASE TABLE') {
        const [cnt] = await conn.query(`SELECT COUNT(*) as c FROM \`${name}\``);
        console.log(`📌 ${name.padEnd(22)} : ${cnt[0].c.toLocaleString()} rows`);
      } else {
        console.log(`👁️ ${name.padEnd(22)} : VIEW`);
      }
    }
    console.log('=============================================\n');

  } catch (err) {
    console.error('❌ Error executing population script:', err);
  } finally {
    await conn.end();
  }
}

execute();
