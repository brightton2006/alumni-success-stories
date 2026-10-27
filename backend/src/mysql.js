import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load unified .env file from root (or local fallback)
const rootEnvPath = path.resolve(__dirname, '../../.env');
const localEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config({ path: localEnvPath });
}

// Configure SSL for TiDB Cloud or secure MySQL
let sslConfig = undefined;
function resolveCaPath(p) {
  if (!p) return null;
  if (path.isAbsolute(p) && fs.existsSync(p)) return p;
  const candidates = [
    path.resolve(process.cwd(), p),
    path.resolve(__dirname, '..', p),
    path.resolve(__dirname, '../..', p),
    path.resolve(__dirname, '../certs/ca.pem')
  ];
  return candidates.find(c => fs.existsSync(c)) || null;
}

const caCandidatePath = resolveCaPath(process.env.DATABASE_SSL_CA) || path.resolve(__dirname, '../certs/ca.pem');

if (
  process.env.DATABASE_SSL === 'true' ||
  process.env.TIDB_ENABLE_SSL === 'true' ||
  parseInt(process.env.DATABASE_PORT || '3306', 10) === 4000 ||
  (process.env.DATABASE_HOST && process.env.DATABASE_HOST.includes('tidbcloud.com')) ||
  fs.existsSync(caCandidatePath)
) {
  if (fs.existsSync(caCandidatePath)) {
    sslConfig = {
      ca: fs.readFileSync(caCandidatePath),
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  } else {
    sslConfig = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  }
}

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'alumni_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig
};

let pool = null;
let isConnected = false;

/**
 * Initialize MySQL / TiDB database connection and auto-migrations
 */
export async function initMySQLDatabase() {
  try {
    // Attempt root database existence check with SSL if enabled
    try {
      const rootConnection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        ssl: sslConfig
      });

      await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
      await rootConnection.end();
    } catch (dbInitErr) {
      // In cloud-managed databases (TiDB Cloud Serverless), database might already be provisioned
      console.log(`ℹ️ Initial database check info: ${dbInitErr.message}`);
    }

    // Create Pool for application queries
    pool = mysql.createPool(dbConfig);

    // Test connection
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected successfully to database: ${dbConfig.database}`);
    connection.release();

    // Auto-migrate users and benefits tables
    await migrateUsersTable();
    await migrateBenefitsTables();
    isConnected = true;
    return true;
  } catch (err) {
    console.warn(`⚠️ MySQL Connection Warning: ${err.message}. (Falling back to JSON store if MySQL unavailable)`);
    isConnected = false;
    return false;
  }
}

/**
 * Ensure users table exists with all required columns for Google OAuth & Roles
 */
async function migrateUsersTable() {
  if (!pool) return;

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER',
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      full_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(64) NULL DEFAULT '',
      google_id VARCHAR(255) NULL UNIQUE,
      profile_image TEXT NULL,
      auth_provider VARCHAR(32) NOT NULL DEFAULT 'local',
      is_email_verified TINYINT(1) NOT NULL DEFAULT 1,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createTableSQL);

  // Add missing columns if table already existed without them
  const columnsToAdd = [
    { name: 'google_id', type: 'VARCHAR(255) NULL' },
    { name: 'profile_image', type: 'TEXT NULL' },
    { name: 'auth_provider', type: "VARCHAR(32) NOT NULL DEFAULT 'local'" },
    { name: 'is_email_verified', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'is_active', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'status', type: "VARCHAR(32) NOT NULL DEFAULT 'APPROVED'" },
    { name: 'phone_number', type: "VARCHAR(64) NULL DEFAULT ''" },
    { name: 'designation', type: "VARCHAR(255) NULL DEFAULT 'Alumni'" },
    { name: 'organization', type: "VARCHAR(255) NULL DEFAULT ''" },
    { name: 'department', type: "VARCHAR(255) NULL DEFAULT ''" },
    { name: 'graduation_year', type: "INT NULL DEFAULT NULL" },
    { name: 'location', type: "VARCHAR(255) NULL DEFAULT ''" },
    { name: 'bio', type: "TEXT NULL" },
    { name: 'contact_privacy', type: "VARCHAR(64) NOT NULL DEFAULT 'SHOW_ALL'" },
    { name: 'achievements', type: "TEXT NULL" }
  ];

  for (const col of columnsToAdd) {
    try {
      const [colCheck] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [dbConfig.database, col.name]
      );
      if (colCheck.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
        console.log(`📌 Added column '${col.name}' to users table in MySQL.`);
      }
    } catch (colErr) {
      console.warn(`Column check warning for ${col.name}:`, colErr.message);
    }
  }

  // Seed initial system users from JSON store into MySQL if users table is empty or missing default users
  try {
    const { usersDb } = await import('./db.js');
    const jsonUsers = usersDb.read();
    for (const ju of jsonUsers) {
      if (!ju || !ju.email) continue;
      const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [ju.email.toLowerCase().trim()]);
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO users (id, role, email, password_hash, full_name, phone_number, google_id, profile_image, auth_provider, is_email_verified, is_active, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ju.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ju.role || 'USER',
            ju.email.toLowerCase().trim(),
            ju.passwordHash || ju.password_hash || null,
            ju.fullName || ju.full_name || ju.name || ju.email.split('@')[0],
            ju.mobile || ju.phone_number || '',
            ju.googleId || ju.google_id || null,
            ju.profileImage || ju.profile_image || '',
            ju.authProvider || ju.auth_provider || 'local',
            ju.isEmailVerified ?? ju.emailVerified ?? true ? 1 : 0,
            ju.isActive ?? ju.is_active ?? true ? 1 : 0,
            ju.status || 'APPROVED'
          ]
        );
      }
    }
  } catch (seedErr) {
    console.warn('User seed warning:', seedErr.message);
  }
}

/**
 * Ensure alumni_benefits and benefit_requests tables exist
 */
async function migrateBenefitsTables() {
  if (!pool) return;
  const createBenefitsSQL = `
    CREATE TABLE IF NOT EXISTS alumni_benefits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      author_email VARCHAR(255) NOT NULL,
      designation VARCHAR(255) NULL,
      organization VARCHAR(255) NULL,
      graduation_year INT NULL,
      category VARCHAR(128) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      skills_offered VARCHAR(550) NULL,
      availability VARCHAR(255) NULL,
      contact_preference VARCHAR(128) NOT NULL DEFAULT 'Email',
      contact_details VARCHAR(255) NULL,
      relevant_links VARCHAR(550) NULL,
      is_financial_aid TINYINT(1) DEFAULT 0,
      financial_amount VARCHAR(128) NULL,
      privacy_setting VARCHAR(64) NOT NULL DEFAULT 'REGISTERED_ONLY',
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_benefit_category (category),
      INDEX idx_benefit_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createRequestsSQL = `
    CREATE TABLE IF NOT EXISTS benefit_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      benefit_id INT NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      applicant_name VARCHAR(255) NOT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      applicant_role VARCHAR(64) NOT NULL DEFAULT 'STUDENT',
      message TEXT NOT NULL,
      resume_link VARCHAR(550) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_benefit_req FOREIGN KEY (benefit_id) REFERENCES alumni_benefits (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.query(createBenefitsSQL);
    await pool.query(createRequestsSQL);
  } catch (err) {
    console.warn('Benefits table migration warning:', err.message);
  }
}

/**
 * MySQL Database Helper API
 */
export const mysqlDb = {
  isAvailable: () => isConnected && pool !== null,

  async query(sql, params = []) {
    if (!pool) throw new Error('MySQL connection pool is not initialized.');
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findUserByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const rows = await this.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [normalized]);
    return rows[0] || null;
  },

  async findUserByGoogleId(googleId) {
    if (!googleId) return null;
    const rows = await this.query('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
    return rows[0] || null;
  },

  async findUserById(id) {
    if (!id) return null;
    const rows = await this.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async createUser(userData) {
    const id = userData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sql = `
      INSERT INTO users (
        id, role, email, password_hash, full_name, phone_number,
        google_id, profile_image, auth_provider, is_email_verified, is_active, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      id,
      userData.role || 'CUSTOMER',
      userData.email.toLowerCase().trim(),
      userData.password_hash || null,
      userData.full_name || userData.fullName || '',
      userData.phone_number || userData.mobile || '',
      userData.google_id || userData.googleId || null,
      userData.profile_image || userData.profileImage || '',
      userData.auth_provider || userData.authProvider || 'local',
      userData.is_email_verified ?? userData.emailVerified ?? true ? 1 : 0,
      userData.is_active ?? userData.isActive ?? true ? 1 : 0,
      userData.status || 'APPROVED'
    ];

    await this.query(sql, params);
    return this.findUserById(id);
  },

  async updateUser(id, updates) {
    const fields = [];
    const params = [];

    if (updates.google_id !== undefined || updates.googleId !== undefined) {
      fields.push('google_id = ?');
      params.push(updates.google_id ?? updates.googleId);
    }
    if (updates.auth_provider !== undefined || updates.authProvider !== undefined) {
      fields.push('auth_provider = ?');
      params.push(updates.auth_provider ?? updates.authProvider);
    }
    if (updates.profile_image !== undefined || updates.profileImage !== undefined) {
      fields.push('profile_image = ?');
      params.push(updates.profile_image ?? updates.profileImage);
    }
    if (updates.full_name !== undefined || updates.fullName !== undefined) {
      fields.push('full_name = ?');
      params.push(updates.full_name ?? updates.fullName);
    }
    if (updates.phone_number !== undefined || updates.mobile !== undefined) {
      fields.push('phone_number = ?');
      params.push(updates.phone_number ?? updates.mobile);
    }
    if (updates.is_email_verified !== undefined || updates.emailVerified !== undefined) {
      fields.push('is_email_verified = ?');
      params.push((updates.is_email_verified ?? updates.emailVerified) ? 1 : 0);
    }
    if (updates.is_active !== undefined || updates.isActive !== undefined) {
      fields.push('is_active = ?');
      params.push((updates.is_active ?? updates.isActive) ? 1 : 0);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.designation !== undefined) {
      fields.push('designation = ?');
      params.push(updates.designation);
    }
    if (updates.organization !== undefined || updates.company !== undefined) {
      fields.push('organization = ?');
      params.push(updates.organization ?? updates.company);
    }
    if (updates.department !== undefined || updates.stream !== undefined) {
      fields.push('department = ?');
      params.push(updates.department ?? updates.stream);
    }
    if (updates.graduation_year !== undefined || updates.graduationYear !== undefined) {
      fields.push('graduation_year = ?');
      params.push(updates.graduation_year ?? updates.graduationYear);
    }
    if (updates.location !== undefined) {
      fields.push('location = ?');
      params.push(updates.location);
    }
    if (updates.bio !== undefined) {
      fields.push('bio = ?');
      params.push(updates.bio);
    }
    if (updates.contact_privacy !== undefined || updates.contactPrivacy !== undefined) {
      fields.push('contact_privacy = ?');
      params.push(updates.contact_privacy ?? updates.contactPrivacy);
    }
    if (updates.achievements !== undefined) {
      fields.push('achievements = ?');
      params.push(typeof updates.achievements === 'object' ? JSON.stringify(updates.achievements) : updates.achievements);
    }

    if (fields.length === 0) return this.findUserById(id);

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?;`;
    await this.query(sql, params);
    return this.findUserById(id);
  },

  // =========================================================
  // ALUMNI_DB MEMBERS & RELATIONAL QUERIES
  // =========================================================
  async getMembersCount() {
    const rows = await this.query('SELECT COUNT(*) AS total FROM members');
    return rows[0]?.total || 0;
  },

  async getMemberFilterOptions() {
    const [streams] = await pool.query(
      `SELECT stream AS name, COUNT(*) AS count FROM education_details WHERE stream IS NOT NULL AND stream != '' GROUP BY stream ORDER BY count DESC LIMIT 50`
    );
    const [courses] = await pool.query(
      `SELECT course AS name, COUNT(*) AS count FROM education_details WHERE course IS NOT NULL AND course != '' GROUP BY course ORDER BY count DESC LIMIT 50`
    );
    const [years] = await pool.query(
      `SELECT DISTINCT CAST(end_year AS UNSIGNED) AS year FROM education_details WHERE end_year REGEXP '^[0-9]{4}$' AND end_year BETWEEN 1950 AND 2035 ORDER BY year DESC`
    );
    const [cities] = await pool.query(
      `SELECT city AS name, COUNT(*) AS count FROM contact_details WHERE city IS NOT NULL AND city != '' AND city != 'Unknown' GROUP BY city ORDER BY count DESC LIMIT 50`
    );
    const [companies] = await pool.query(
      `SELECT company_name AS name, COUNT(*) AS count FROM work_details WHERE company_name IS NOT NULL AND company_name != '' AND company_name != 'Not Specified' GROUP BY company_name ORDER BY count DESC LIMIT 50`
    );

    return {
      streams,
      graduationYears: years.map(y => y.year),
      courses,
      cities,
      companies
    };
  },

  async getMembersFiltered({ page = 1, limit = 12, search, stream, course, endYear, city, company, skill }) {
    const whereClauses = [];
    const params = [];

    if (search) {
      const sTerm = `%${search.toLowerCase().trim()}%`;
      whereClauses.push(
        `(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(course) LIKE ? OR LOWER(stream) LIKE ? OR LOWER(company) LIKE ? OR LOWER(position) LIKE ? OR LOWER(city) LIKE ?)`
      );
      params.push(sTerm, sTerm, sTerm, sTerm, sTerm, sTerm, sTerm);
    }

    if (stream) {
      whereClauses.push(`LOWER(stream) LIKE ?`);
      params.push(`%${stream.toLowerCase().trim()}%`);
    }

    if (course) {
      whereClauses.push(`LOWER(course) LIKE ?`);
      params.push(`%${course.toLowerCase().trim()}%`);
    }

    if (endYear) {
      whereClauses.push(`batch_year = ?`);
      params.push(String(endYear));
    }

    if (city) {
      whereClauses.push(`LOWER(city) LIKE ?`);
      params.push(`%${city.toLowerCase().trim()}%`);
    }

    if (company) {
      whereClauses.push(`LOWER(company) LIKE ?`);
      params.push(`%${company.toLowerCase().trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRows = await this.query(`SELECT COUNT(*) AS total FROM alumni_member_overview ${whereSql}`, params);
    const total = countRows[0]?.total || 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT * FROM alumni_member_overview 
      ${whereSql} 
      ORDER BY member_id ASC 
      LIMIT ? OFFSET ?
    `;
    const rows = await this.query(querySql, [...params, limit, offset]);

    return {
      total,
      rows
    };
  },

  async getMemberById(id) {
    if (!id) return null;

    // Check if id is numeric or mongo_id
    const isNumeric = !isNaN(id);
    const sql = isNumeric 
      ? 'SELECT * FROM members WHERE id = ? LIMIT 1' 
      : 'SELECT * FROM members WHERE mongo_id = ? LIMIT 1';
    
    const rows = await this.query(sql, [id]);
    if (!rows || rows.length === 0) return null;

    const m = rows[0];
    const memberId = m.id;

    // Fetch related details
    const pics = await this.query('SELECT * FROM member_pictures WHERE member_id = ? LIMIT 1', [memberId]);
    const edu = await this.query('SELECT * FROM education_details WHERE member_id = ?', [memberId]);
    const mem = await this.query('SELECT * FROM membership_details WHERE member_id = ?', [memberId]);
    const work = await this.query('SELECT * FROM work_details WHERE member_id = ?', [memberId]);
    const contact = await this.query('SELECT * FROM contact_details WHERE member_id = ? LIMIT 1', [memberId]);
    const addr = await this.query('SELECT * FROM member_addresses WHERE member_id = ?', [memberId]);
    const skills = await this.query('SELECT skill FROM professional_skills WHERE member_id = ?', [memberId]);
    const other = await this.query('SELECT detail_key AS `key`, detail_value AS `value` FROM member_other_details WHERE member_id = ?', [memberId]);

    const c = contact[0] || {};
    const p = pics[0] || {};

    return {
      _id: m.mongo_id,
      id: String(m.id),
      mongo_id: m.mongo_id,
      basic: {
        salutation: m.salutation || '',
        name: m.name,
        gender: m.gender || '',
        dateofbirth: m.date_of_birth,
        label: m.label || '',
        email_id: m.email || '',
        email: m.email || '',
        alternate_email_id: m.alternate_email || '',
        profile_updated_on: m.profile_updated_on,
        profile_links: {
          facebook: m.facebook_url || '',
          linkedin: m.linkedin_url || '',
          twitter: m.twitter_url || '',
          website: m.website_url || '',
          youtube: m.youtube_url || '',
          instagram: m.instagram_url || ''
        }
      },
      pictures: {
        profile: p.profile_url || '',
        thumb: p.thumbnail_url || '',
        full: p.full_url || ''
      },
      educationDetails: edu.map(e => ({
        course: e.course,
        stream: e.stream,
        institution: e.institution,
        startYear: e.start_year,
        endYear: e.end_year,
        siteId: e.site_id
      })),
      education_details: edu.map(e => ({
        course: e.course,
        stream: e.stream,
        institution: e.institution,
        start_year: e.start_year,
        end_year: e.end_year,
        site_id: e.site_id
      })),
      membershipDetails: mem.map(ms => ({
        siteId: ms.site_id,
        status: ms.status,
        registeredOn: ms.registered_on,
        approvedOn: ms.approved_on,
        adminNote: ms.admin_note
      })),
      membership_details: mem.map(ms => ({
        site_id: ms.site_id,
        status: ms.status,
        registered_on: ms.registered_on,
        approved_on: ms.approved_on,
        admin_note: ms.admin_note
      })),
      workDetails: work.map(w => ({
        company: w.company_name,
        position: w.position,
        department: w.department,
        startYear: w.start_year,
        startMonth: w.start_month,
        endYear: w.end_year,
        endMonth: w.end_month,
        currentCompany: w.current_company
      })),
      work_details: work.map(w => ({
        name: w.company_name,
        company: w.company_name,
        position: w.position,
        department: w.department,
        start_year: w.start_year,
        start_month: w.start_month,
        end_year: w.end_year,
        end_month: w.end_month,
        current_company: w.current_company
      })),
      contactDetails: {
        mobile: c.mobile || '',
        home: c.home_phone || '',
        office: c.office_phone || '',
        currentLocation: {
          location: c.location || '',
          city: c.city || '',
          country: c.country || ''
        },
        address: addr.map(a => ({
          type: a.address_type,
          address: a.address,
          city: a.city,
          state: a.state,
          country: a.country,
          pincode: a.pincode
        }))
      },
      contact_details: {
        mobile: c.mobile || '',
        home: c.home_phone || '',
        office: c.office_phone || '',
        current_location: {
          location: c.location || '',
          city: c.city || '',
          country: c.country || ''
        },
        address: addr.map(a => ({
          type: a.address_type,
          address: a.address,
          city: a.city,
          state: a.state,
          country: a.country,
          pincode: a.pincode
        }))
      },
      skills: skills.map(s => s.skill),
      other: other
    };
  },

  async getMemberByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const rows = await this.query('SELECT id FROM members WHERE LOWER(email) = ? LIMIT 1', [normalized]);
    if (!rows || rows.length === 0) return null;
    return this.getMemberById(rows[0].id);
  }
};
