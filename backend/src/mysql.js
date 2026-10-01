import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'alumni_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;
let isConnected = false;

/**
 * Initialize MySQL database connection and auto-migrations
 */
export async function initMySQLDatabase() {
  try {
    // First connection without database to ensure database exists
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConnection.end();

    // Create Pool for application queries
    pool = mysql.createPool(dbConfig);

    // Test connection
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected successfully to database: ${dbConfig.database}`);
    connection.release();

    // Auto-migrate users table
    await migrateUsersTable();
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
    { name: 'phone_number', type: "VARCHAR(64) NULL DEFAULT ''" }
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
