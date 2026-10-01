# Alumni Portal Database & Migration Guide

This directory contains the database initialization schema, automated migration engine, and documentation for the **`alumni_db`** MySQL database.

---

## Database Architecture Overview

The `alumni_db` MySQL database replaces flattened data stores with a clean, relational schema:

1. **`members`**: Core member identity, storing `$oid` as `mongo_id`, name, salutation, gender, email, alternate email, and social links.
2. **`member_pictures`**: Profile, thumbnail, and full image URLs.
3. **`education_details`**: Academic degrees, streams, institutions, start/end years.
4. **`membership_details`**: Registration status, site IDs, approved timestamps, admin notes.
5. **`membership_education_details`**: Institutional membership academic association records.
6. **`professional_details`**, **`professional_skills`**, **`professional_industries`**, **`professional_roles`**: Career history and skills.
7. **`work_details`**: Employment positions, departments, companies, tenure, current employment status.
8. **`contact_details`**: Mobile, home phone, office phone, current city/country location.
9. **`member_addresses`**: Categorized mailing addresses (city, state, country, pincode).
10. **`member_roles`**: System & community roles.
11. **`member_other_details`**: Dynamic attributes (e.g., Chapter, Mentoring preferences, Webinar speaker options).

### Analytical Views:
- **`alumni_member_overview`**: Unified overview joining member, contact, latest education, current employment, and chapter data.
- **`alumni_education_view`**: Dedicated education audit view.
- **`alumni_work_view`**: Employment and career tracking view.
- **`alumni_contact_view`**: Contact and location directory view.
- **`alumni_membership_view`**: Registration status audit view.

---

## Step-by-Step Migration Guide

### Prerequisites:
- **Node.js** v18+
- **MySQL Server** (running locally on port 3306 or remote host)
- Source file `test.members.json` located at `D:\alumni DB\test.members.json` or `database/test.members.json`.

---

### Step 1: Configure Environment Variables
Ensure your `backend/.env` file contains valid MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alumni_db
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
```

---

### Step 2: Initialize Database & Run Schema
Open MySQL Workbench or terminal and execute:

```sql
CREATE DATABASE IF NOT EXISTS alumni_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alumni_db;
```

Or apply `database/schema.sql` directly:

```bash
mysql -u root -p alumni_db < database/schema.sql
```

---

### Step 3: Run Automated Data Migration Engine
Run the Node.js migration script to ingest all 12,049 records from `test.members.json` into `alumni_db`:

```bash
# Run from repository root
node database/import-members.js
```

---

### Step 4: Verify Migration in MySQL Workbench
Open MySQL Workbench, connect to `alumni_db`, and execute:

```sql
USE alumni_db;

-- 1. Check member count
SELECT COUNT(*) FROM members;

-- 2. Check child table record counts
SELECT COUNT(*) FROM education_details;
SELECT COUNT(*) FROM work_details;
SELECT COUNT(*) FROM membership_details;
SELECT COUNT(*) FROM contact_details;

-- 3. Inspect top 20 member overview records
SELECT * FROM alumni_member_overview LIMIT 20;

-- 4. Search members by department or company
SELECT * FROM alumni_member_overview 
WHERE stream LIKE '%Computer Science%' OR company LIKE '%Atos%'
LIMIT 20;
```

---

### Step 5: Resetting / Re-running Migration
To reset `alumni_db` and re-run migration cleanly:

```sql
USE alumni_db;
DROP DATABASE alumni_db;
CREATE DATABASE alumni_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then re-run:

```bash
node database/import-members.js
```
