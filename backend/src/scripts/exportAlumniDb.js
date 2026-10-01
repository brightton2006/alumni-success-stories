import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const OUTPUT_FILE = path.join(__dirname, '../../alumni_db.sql');

function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return String(val);
  
  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  str = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
    
  return `'${str}'`;
}

function generateFullSqlDump() {
  const users = readJsonFile('users.json');
  const stories = readJsonFile('stories.json');
  const categories = readJsonFile('categories.json');

  let sql = `-- Alumni Success Story Portal - Database Export
-- Generated on: ${new Date().toISOString()}
-- Database Name: alumni_db

CREATE DATABASE IF NOT EXISTS \`alumni_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`alumni_db\`;

-- --------------------------------------------------------
-- Table structure for \`users\`
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`role\` VARCHAR(32) NOT NULL DEFAULT 'USER',
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NULL,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`phone_number\` VARCHAR(64) NULL DEFAULT '',
  \`google_id\` VARCHAR(255) NULL UNIQUE,
  \`profile_image\` TEXT NULL,
  \`auth_provider\` VARCHAR(32) NOT NULL DEFAULT 'local',
  \`is_email_verified\` TINYINT(1) NOT NULL DEFAULT 1,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

  if (users.length > 0) {
    sql += `-- Dumping data for table \`users\`\n`;
    for (const u of users) {
      const id = u.id || u._id;
      const role = u.role || 'USER';
      const email = u.email;
      const passwordHash = u.passwordHash || u.password_hash || null;
      const fullName = u.fullName || u.full_name || email.split('@')[0];
      const phoneNumber = u.mobile || u.phone_number || '';
      const googleId = u.googleId || u.google_id || null;
      const profileImage = u.profileImage || u.profile_image || '';
      const authProvider = u.authProvider || u.auth_provider || 'local';
      const isEmailVerified = u.emailVerified ?? u.is_email_verified ?? true;
      const isActive = u.isActive ?? u.is_active ?? true;
      const status = u.status || 'APPROVED';

      sql += `INSERT INTO \`users\` (\`id\`, \`role\`, \`email\`, \`password_hash\`, \`full_name\`, \`phone_number\`, \`google_id\`, \`profile_image\`, \`auth_provider\`, \`is_email_verified\`, \`is_active\`, \`status\`) VALUES (${escapeSql(id)}, ${escapeSql(role)}, ${escapeSql(email)}, ${escapeSql(passwordHash)}, ${escapeSql(fullName)}, ${escapeSql(phoneNumber)}, ${escapeSql(googleId)}, ${escapeSql(profileImage)}, ${escapeSql(authProvider)}, ${escapeSql(isEmailVerified)}, ${escapeSql(isActive)}, ${escapeSql(status)}) ON DUPLICATE KEY UPDATE \`full_name\`=${escapeSql(fullName)}, \`role\`=${escapeSql(role)};\n`;
    }
    sql += `\n`;
  }

  sql += `-- --------------------------------------------------------
-- Table structure for \`categories\`
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`categories\`;
CREATE TABLE \`categories\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`icon\` VARCHAR(64) NULL,
  \`color\` VARCHAR(64) NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

  if (categories.length > 0) {
    sql += `-- Dumping data for table \`categories\`\n`;
    for (const c of categories) {
      const id = c.id || c._id;
      const name = c.name;
      const description = c.description || '';
      const icon = c.icon || '';
      const color = c.color || '';
      const isActive = c.isActive ?? true;

      sql += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`description\`, \`icon\`, \`color\`, \`is_active\`) VALUES (${escapeSql(id)}, ${escapeSql(name)}, ${escapeSql(description)}, ${escapeSql(icon)}, ${escapeSql(color)}, ${escapeSql(isActive)}) ON DUPLICATE KEY UPDATE \`name\`=${escapeSql(name)};\n`;
    }
    sql += `\n`;
  }

  sql += `-- --------------------------------------------------------
-- Table structure for \`stories\`
-- --------------------------------------------------------
DROP TABLE IF EXISTS \`stories\`;
CREATE TABLE \`stories\` (
  \`id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`author_id\` VARCHAR(64) NULL,
  \`story_title\` VARCHAR(255) NOT NULL,
  \`person_name\` VARCHAR(255) NOT NULL,
  \`profession\` VARCHAR(255) NULL,
  \`location\` VARCHAR(255) NULL,
  \`category\` VARCHAR(255) NOT NULL,
  \`short_summary\` TEXT NULL,
  \`full_story\` LONGTEXT NOT NULL,
  \`show_name\` TINYINT(1) NOT NULL DEFAULT 1,
  \`status\` VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
  \`views\` INT NOT NULL DEFAULT 0,
  \`ai_keywords\` JSON NULL,
  \`journey_map\` JSON NULL,
  \`published_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

  if (stories.length > 0) {
    sql += `-- Dumping data for table \`stories\`\n`;
    for (const s of stories) {
      const id = s.id || s._id;
      const authorId = s.authorId || null;
      const storyTitle = s.storyTitle;
      const personName = s.personName || '';
      const profession = s.profession || '';
      const location = s.location || '';
      const category = s.category || 'Success Story';
      const shortSummary = s.shortSummary || '';
      const fullStory = s.fullStory || '';
      const showName = s.showName ?? true;
      const status = s.status || 'PUBLISHED';
      const views = s.views || 0;
      const aiKeywords = s.aiKeywords || [];
      const journeyMap = s.journeyMap || null;

      sql += `INSERT INTO \`stories\` (\`id\`, \`author_id\`, \`story_title\`, \`person_name\`, \`profession\`, \`location\`, \`category\`, \`short_summary\`, \`full_story\`, \`show_name\`, \`status\`, \`views\`, \`ai_keywords\`, \`journey_map\`) VALUES (${escapeSql(id)}, ${escapeSql(authorId)}, ${escapeSql(storyTitle)}, ${escapeSql(personName)}, ${escapeSql(profession)}, ${escapeSql(location)}, ${escapeSql(category)}, ${escapeSql(shortSummary)}, ${escapeSql(fullStory)}, ${escapeSql(showName)}, ${escapeSql(status)}, ${escapeSql(views)}, ${escapeSql(aiKeywords)}, ${escapeSql(journeyMap)}) ON DUPLICATE KEY UPDATE \`story_title\`=${escapeSql(storyTitle)};\n`;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, sql, 'utf-8');
  console.log(`✅ Successfully generated dedicated database SQL export file at: ${OUTPUT_FILE}`);
}

generateFullSqlDump();
