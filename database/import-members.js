import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe module resolution
let mysqlModule;
try {
  mysqlModule = await import('mysql2/promise');
} catch {
  mysqlModule = await import('../backend/node_modules/mysql2/promise.js');
}
const mysql = mysqlModule.default || mysqlModule;

try {
  let dotenvModule;
  try {
    dotenvModule = await import('dotenv');
  } catch {
    dotenvModule = await import('../backend/node_modules/dotenv/lib/main.js');
  }
  const dotenv = dotenvModule.default || dotenvModule;
  const rootEnv = path.resolve(__dirname, '../.env');
  const backendEnv = path.resolve(__dirname, '../backend/.env');
  dotenv.config({ path: fs.existsSync(rootEnv) ? rootEnv : backendEnv });
} catch {
  // Environment variables are already populated from system environment
}

let sslConfig = undefined;
const caCandidatePath = path.resolve(__dirname, '../backend/certs/ca.pem');
if (
  process.env.DATABASE_SSL === 'true' ||
  parseInt(process.env.DATABASE_PORT || '3306', 10) === 4000 ||
  (process.env.DATABASE_HOST && process.env.DATABASE_HOST.includes('tidbcloud.com')) ||
  fs.existsSync(caCandidatePath)
) {
  sslConfig = fs.existsSync(caCandidatePath) ? {
    ca: fs.readFileSync(caCandidatePath),
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };
}

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '3306', 10),
  user: process.env.DATABASE_USER || process.env.DB_USER || 'root',
  password: process.env.DATABASE_PASSWORD !== undefined ? process.env.DATABASE_PASSWORD 
: (process.env.DB_PASSWORD || ''),
  database: process.env.DATABASE_NAME || process.env.DB_NAME || 'alumni_db',
  multipleStatements: true,
  ssl: sslConfig
};

// Helper: Convert Mongo $oid or string
function parseMongoId(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.$oid) return val.$oid;
  return String(val);
}

// Helper: Convert Mongo $date or string to MySQL DATETIME/DATE
function parseMongoDate(val) {
  if (!val) return null;
  let dateObj = null;
  if (typeof val === 'object' && val.$date) {
    dateObj = new Date(val.$date);
  } else if (typeof val === 'string' || typeof val === 'number') {
    dateObj = new Date(val);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper: Parse Date to YYYY-MM-DD
function parseMongoDateOnly(val) {
  const dtStr = parseMongoDate(val);
  if (!dtStr) return null;
  return dtStr.slice(0, 10);
}

export async function runMigration() {
  console.log('===================================================');
  console.log('🚀 ALUMNI_DB MYSQL DATA MIGRATION ENGINE');
  console.log('===================================================\n');

  const startTime = Date.now();

  // 1. Establish connection to MySQL
  let conn;
  try {
    try {
      const rootConn = await mysql.createConnection({
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password,
        ssl: sslConfig,
        multipleStatements: true
      });
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();
    } catch (dbInitErr) {
      // In cloud databases like TiDB Cloud, database is already provisioned
    }

    conn = await mysql.createConnection(DB_CONFIG);
    console.log(`✅ Connected to MySQL database "${DB_CONFIG.database}" on ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
    console.error(`Please check MySQL service is running and credentials in backend/.env are correct.`);
    throw err;
  }

  // 2. Execute schema.sql DDL to ensure tables and views are ready
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log(`📜 Applying schema DDL from ${schemaPath}...`);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await conn.query(schemaSql);
      console.log(`✅ Schema & Database Views applied successfully.`);
    }
  } catch (schemaErr) {
    console.warn(`⚠️ Warning applying schema.sql: ${schemaErr.message}`);
  }

  // 3. Locate source test.members.json
  let sourcePath = 'D:/alumni DB/test.members.json';
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(__dirname, 'test.members.json');
  }
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(__dirname, '../backend/test.members.json');
  }
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(__dirname, '../test.members.json');
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source dataset not found at ${sourcePath}`);
    await conn.end();
    throw new Error(`Member JSON file not found at ${sourcePath}`);
  }

  console.log(`📁 Reading dataset file: ${sourcePath}`);
  const fileContent = fs.readFileSync(sourcePath, 'utf8');
  const rawMembers = JSON.parse(fileContent);
  console.log(`📊 Loaded ${rawMembers.length} member records from JSON.\n`);

  // Fetch existing mongo_ids & emails to ensure idempotent import
  const [existingRows] = await conn.query('SELECT mongo_id, email FROM members');
  const existingMongoIdSet = new Set(existingRows.map(r => r.mongo_id).filter(Boolean));
  const existingEmailSet = new Set(existingRows.map(r => r.email).filter(Boolean).map(e => e.toLowerCase()));

  let importedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;
  let missingEmailCount = 0;
  let invalidCount = 0;

  let totalEduCount = 0;
  let totalWorkCount = 0;
  let totalMembershipCount = 0;
  let totalAddressCount = 0;
  let totalOtherCount = 0;

  console.log(`🔄 Ingesting records into MySQL...`);

  await conn.beginTransaction();

  try {
    for (let i = 0; i < rawMembers.length; i++) {
      const raw = rawMembers[i];
      if (!raw || typeof raw !== 'object') {
        invalidCount++;
        continue;
      }

      const mongoId = parseMongoId(raw._id);
      if (!mongoId) {
        invalidCount++;
        continue;
      }

      const basic = raw.basic || {};
      const email = (basic.email_id || basic.email || raw.email_id || raw.email || '').trim();
      const normEmail = email ? email.toLowerCase() : null;

      if (!normEmail) {
        missingEmailCount++;
      }

      // Duplicate check
      if (existingMongoIdSet.has(mongoId) || (normEmail && existingEmailSet.has(normEmail))) {
        duplicateCount++;
        continue;
      }

      existingMongoIdSet.add(mongoId);
      if (normEmail) existingEmailSet.add(normEmail);

      const name = (basic.name || raw.name || 'Alumni Member').trim();
      const salutation = (basic.salutation || '').trim();
      const gender = (basic.gender || '').trim();
      const dateOfBirth = parseMongoDateOnly(basic.dateofbirth);
      const label = (basic.label || '').trim();
      const alternateEmail = (basic.alternate_email_id || basic.alternate_email || '').trim();
      const profileUpdatedOn = parseMongoDate(basic.profile_updated_on);

      const links = basic.profile_links || {};
      const facebookUrl = (links.facebook || '').trim();
      const linkedinUrl = (links.linkedin || '').trim();
      const twitterUrl = (links.twitter || '').trim();
      const websiteUrl = (links.website || '').trim();
      const youtubeUrl = (links.youtube || '').trim();
      const instagramUrl = (links.instagram || '').trim();

      // 1. Insert into members
      const [mRes] = await conn.query(
        `INSERT INTO members 
          (mongo_id, name, salutation, gender, date_of_birth, label, email, alternate_email, 
           facebook_url, linkedin_url, twitter_url, website_url, youtube_url, instagram_url, profile_updated_on) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mongoId, name, salutation, gender, dateOfBirth, label, normEmail, alternateEmail,
          facebookUrl, linkedinUrl, twitterUrl, websiteUrl, youtubeUrl, instagramUrl, profileUpdatedOn
        ]
      );

      const memberId = mRes.insertId;
      importedCount++;

      // 2. Insert member_pictures
      const pics = raw.pictures || {};
      if (pics.profile || pics.thumb || pics.full) {
        await conn.query(
          `INSERT INTO member_pictures (member_id, profile_url, thumbnail_url, full_url) VALUES (?, ?, ?, ?)`,
          [memberId, (pics.profile || '').trim(), (pics.thumb || '').trim(), (pics.full || '').trim()]
        );
      }

      // 3. Insert education_details
      const eduList = Array.isArray(raw.education_details) ? raw.education_details : [];
      for (const edu of eduList) {
        await conn.query(
          `INSERT INTO education_details (member_id, course, stream, institution, start_year, end_year, site_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            (edu.course || '').trim(),
            (edu.stream || '').trim(),
            (edu.institution || '').trim(),
            parseInt(edu.start_year, 10) || null,
            String(edu.end_year || '').trim(),
            String(edu.site_id || '').trim()
          ]
        );
        totalEduCount++;
      }

      // 4. Insert membership_details & membership_education_details
      const memList = Array.isArray(raw.membership_details) ? raw.membership_details : [];
      for (const mem of memList) {
        const [memRes] = await conn.query(
          `INSERT INTO membership_details (member_id, site_id, status, registered_on, approved_on, admin_note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            String(mem.site_id || '').trim(),
            (mem.status || '').trim(),
            parseMongoDate(mem.registered_on),
            parseMongoDate(mem.approved_on),
            (mem.admin_note || '').trim()
          ]
        );
        const membershipId = memRes.insertId;
        totalMembershipCount++;

        const memEduList = Array.isArray(mem.details) ? mem.details : [];
        for (const medu of memEduList) {
          await conn.query(
            `INSERT INTO membership_education_details 
              (membership_id, relation, roll_no, course, stream, entity, start_year, start_month, end_year, end_month)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              membershipId,
              (medu.relation || '').trim(),
              (medu.roll_no || '').trim(),
              (medu.course || '').trim(),
              (medu.stream || '').trim(),
              (medu.entity || '').trim(),
              parseInt(medu.start_year, 10) || null,
              parseInt(medu.start_month, 10) || null,
              String(medu.end_year || '').trim(),
              parseInt(medu.end_month, 10) || null
            ]
          );
        }
      }

      // 5. Professional details, skills, industries, roles
      const prof = raw.professional_details || {};
      if (prof.experience_years !== undefined && prof.experience_years !== null) {
        await conn.query(
          `INSERT INTO professional_details (member_id, experience_years) VALUES (?, ?)`,
          [memberId, parseInt(prof.experience_years, 10) || null]
        );
      }
      if (Array.isArray(prof.skills)) {
        for (const skill of prof.skills) {
          if (skill && String(skill).trim()) {
            await conn.query(`INSERT INTO professional_skills (member_id, skill) VALUES (?, ?)`, [memberId, String(skill).trim()]);
          }
        }
      }
      if (Array.isArray(prof.industries)) {
        for (const ind of prof.industries) {
          if (ind && String(ind).trim()) {
            await conn.query(`INSERT INTO professional_industries (member_id, industry) VALUES (?, ?)`, [memberId, String(ind).trim()]);
          }
        }
      }
      if (Array.isArray(prof.roles)) {
        for (const r of prof.roles) {
          if (r && String(r).trim()) {
            await conn.query(`INSERT INTO professional_roles (member_id, role) VALUES (?, ?)`, [memberId, String(r).trim()]);
          }
        }
      }

      // 6. Work details
      const workList = Array.isArray(raw.work_details) ? raw.work_details : [];
      for (const w of workList) {
        await conn.query(
          `INSERT INTO work_details (member_id, company_name, position, department, start_year, start_month, end_year, end_month, current_company)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            (w.name || w.company_name || '').trim(),
            (w.position || '').trim(),
            (w.department || '').trim(),
            parseInt(w.start_year, 10) || 0,
            parseInt(w.start_month, 10) || 0,
            parseInt(w.end_year, 10) || 0,
            parseInt(w.end_month, 10) || 0,
            String(w.current_company || '').trim()
          ]
        );
        totalWorkCount++;
      }

      // 7. Contact details & addresses
      const contact = raw.contact_details || {};
      const currLoc = contact.current_location || {};
      if (contact.mobile || contact.home || contact.office || currLoc.location || currLoc.city || currLoc.country) {
        await conn.query(
          `INSERT INTO contact_details (member_id, mobile, home_phone, office_phone, location, city, country)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            (contact.mobile || '').trim(),
            (contact.home || '').trim(),
            (contact.office || '').trim(),
            (currLoc.location || '').trim(),
            (currLoc.city || '').trim(),
            (currLoc.country || '').trim()
          ]
        );
      }

      const addrList = Array.isArray(contact.address) ? contact.address : [];
      for (const addr of addrList) {
        await conn.query(
          `INSERT INTO member_addresses (member_id, address_type, address, city, state, country, pincode)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            (addr.type || '').trim(),
            (addr.address || '').trim(),
            (addr.city || '').trim(),
            (addr.state || '').trim(),
            (addr.country || '').trim(),
            (addr.pincode || '').trim()
          ]
        );
        totalAddressCount++;
      }

      // 8. Member roles
      const mRoles = Array.isArray(raw.member_roles) ? raw.member_roles : [];
      for (const mr of mRoles) {
        if (mr && String(mr).trim()) {
          await conn.query(`INSERT INTO member_roles (member_id, role) VALUES (?, ?)`, [memberId, String(mr).trim()]);
        }
      }

      // 9. Other details
      const otherList = Array.isArray(raw.other) ? raw.other : [];
      for (const oth of otherList) {
        if (oth && oth.key) {
          await conn.query(
            `INSERT INTO member_other_details (member_id, detail_key, detail_value) VALUES (?, ?, ?)`,
            [memberId, String(oth.key).trim(), String(oth.value || '').trim()]
          );
          totalOtherCount++;
        }
      }

      // Progress logging every 2500 records
      if (importedCount % 2500 === 0) {
        console.log(`   ⏳ Processed ${i + 1} / ${rawMembers.length} records... (${importedCount} inserted)`);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error(`❌ Migration error: ${err.message}`);
    failedCount++;
    throw err;
  } finally {
    await conn.end();
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  const report = {
    databaseName: DB_CONFIG.database,
    totalRecordsInFile: rawMembers.length,
    successfullyImported: importedCount,
    duplicateRecords: duplicateCount,
    failedRecords: failedCount,
    recordsMissingEmail: missingEmailCount,
    invalidRecords: invalidCount,
    childEntityCounts: {
      educationDetails: totalEduCount,
      workDetails: totalWorkCount,
      membershipDetails: totalMembershipCount,
      addresses: totalAddressCount,
      otherDetails: totalOtherCount
    },
    durationSeconds: durationSec
  };

  console.log('\n===================================================');
  console.log('🎉 MIGRATION REPORT SUMMARY');
  console.log('===================================================');
  console.log(JSON.stringify(report, null, 2));

  return report;
}

// Allow CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal Migration Error:', err);
      process.exit(1);
    });
}
