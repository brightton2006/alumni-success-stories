-- =========================================================
-- Alumni Portal MySQL Database Schema
-- Database Name: alumni_db
-- =========================================================

CREATE DATABASE IF NOT EXISTS `alumni_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `alumni_db`;

-- 1. members (Core Member Entity)
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `mongo_id` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `salutation` VARCHAR(32) NULL DEFAULT '',
  `gender` VARCHAR(32) NULL DEFAULT '',
  `date_of_birth` DATE NULL,
  `label` VARCHAR(255) NULL DEFAULT '',
  `email` VARCHAR(255) NULL,
  `alternate_email` VARCHAR(255) NULL DEFAULT '',
  `facebook_url` TEXT NULL,
  `linkedin_url` TEXT NULL,
  `twitter_url` TEXT NULL,
  `website_url` TEXT NULL,
  `youtube_url` TEXT NULL,
  `instagram_url` TEXT NULL,
  `profile_updated_on` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_members_email` (`email`),
  INDEX `idx_members_mongo_id` (`mongo_id`),
  INDEX `idx_members_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. member_pictures
CREATE TABLE IF NOT EXISTS `member_pictures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `profile_url` TEXT NULL,
  `thumbnail_url` TEXT NULL,
  `full_url` TEXT NULL,
  CONSTRAINT `fk_pictures_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. education_details
CREATE TABLE IF NOT EXISTS `education_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `course` VARCHAR(255) NULL DEFAULT '',
  `stream` VARCHAR(255) NULL DEFAULT '',
  `institution` VARCHAR(255) NULL DEFAULT '',
  `start_year` INT NULL,
  `end_year` VARCHAR(32) NULL DEFAULT '',
  `site_id` VARCHAR(64) NULL DEFAULT '',
  CONSTRAINT `fk_education_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  INDEX `idx_edu_course` (`course`),
  INDEX `idx_edu_stream` (`stream`),
  INDEX `idx_edu_end_year` (`end_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. membership_details
CREATE TABLE IF NOT EXISTS `membership_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `site_id` VARCHAR(64) NULL DEFAULT '',
  `status` VARCHAR(64) NULL DEFAULT '',
  `registered_on` DATETIME NULL,
  `approved_on` DATETIME NULL,
  `admin_note` TEXT NULL,
  CONSTRAINT `fk_membership_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. membership_education_details
CREATE TABLE IF NOT EXISTS `membership_education_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `membership_id` INT NOT NULL,
  `relation` VARCHAR(128) NULL DEFAULT '',
  `roll_no` VARCHAR(128) NULL DEFAULT '',
  `course` VARCHAR(255) NULL DEFAULT '',
  `stream` VARCHAR(255) NULL DEFAULT '',
  `entity` VARCHAR(255) NULL DEFAULT '',
  `start_year` INT NULL,
  `start_month` INT NULL,
  `end_year` VARCHAR(32) NULL DEFAULT '',
  `end_month` INT NULL,
  CONSTRAINT `fk_mem_edu_membership` FOREIGN KEY (`membership_id`) REFERENCES `membership_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. professional_details
CREATE TABLE IF NOT EXISTS `professional_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `experience_years` INT NULL,
  CONSTRAINT `fk_prof_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. professional_skills
CREATE TABLE IF NOT EXISTS `professional_skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `skill` VARCHAR(255) NOT NULL,
  CONSTRAINT `fk_skills_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. professional_industries
CREATE TABLE IF NOT EXISTS `professional_industries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `industry` VARCHAR(255) NOT NULL,
  CONSTRAINT `fk_ind_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. professional_roles
CREATE TABLE IF NOT EXISTS `professional_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  CONSTRAINT `fk_roles_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. work_details
CREATE TABLE IF NOT EXISTS `work_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `company_name` VARCHAR(255) NULL DEFAULT '',
  `position` VARCHAR(255) NULL DEFAULT '',
  `department` VARCHAR(255) NULL DEFAULT '',
  `start_year` INT NULL DEFAULT 0,
  `start_month` INT NULL DEFAULT 0,
  `end_year` INT NULL DEFAULT 0,
  `end_month` INT NULL DEFAULT 0,
  `current_company` VARCHAR(32) NULL DEFAULT '',
  CONSTRAINT `fk_work_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  INDEX `idx_work_company` (`company_name`),
  INDEX `idx_work_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. contact_details
CREATE TABLE IF NOT EXISTS `contact_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `mobile` VARCHAR(64) NULL DEFAULT '',
  `home_phone` VARCHAR(64) NULL DEFAULT '',
  `office_phone` VARCHAR(64) NULL DEFAULT '',
  `location` VARCHAR(255) NULL DEFAULT '',
  `city` VARCHAR(128) NULL DEFAULT '',
  `country` VARCHAR(128) NULL DEFAULT '',
  CONSTRAINT `fk_contact_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  INDEX `idx_contact_city` (`city`),
  INDEX `idx_contact_country` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. member_addresses
CREATE TABLE IF NOT EXISTS `member_addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `address_type` VARCHAR(64) NULL DEFAULT '',
  `address` TEXT NULL,
  `city` VARCHAR(128) NULL DEFAULT '',
  `state` VARCHAR(128) NULL DEFAULT '',
  `country` VARCHAR(128) NULL DEFAULT '',
  `pincode` VARCHAR(32) NULL DEFAULT '',
  CONSTRAINT `fk_address_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. member_roles
CREATE TABLE IF NOT EXISTS `member_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `role` VARCHAR(128) NOT NULL,
  CONSTRAINT `fk_mroles_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. member_other_details
CREATE TABLE IF NOT EXISTS `member_other_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `detail_key` VARCHAR(255) NOT NULL,
  `detail_value` TEXT NULL,
  CONSTRAINT `fk_other_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  INDEX `idx_other_key` (`detail_key`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- DATABASE VIEWS
-- =========================================================

-- View 1: alumni_member_overview
CREATE OR REPLACE VIEW `alumni_member_overview` AS
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

-- View 2: alumni_education_view
CREATE OR REPLACE VIEW `alumni_education_view` AS
SELECT 
  e.id AS education_id,
  m.id AS member_id,
  m.name,
  m.email,
  e.course,
  e.stream,
  e.institution,
  e.start_year,
  e.end_year
FROM education_details e
JOIN members m ON m.id = e.member_id;

-- View 3: alumni_work_view
CREATE OR REPLACE VIEW `alumni_work_view` AS
SELECT 
  w.id AS work_id,
  m.id AS member_id,
  m.name,
  m.email,
  w.company_name,
  w.position,
  w.department,
  w.current_company
FROM work_details w
JOIN members m ON m.id = w.member_id;

-- View 4: alumni_contact_view
CREATE OR REPLACE VIEW `alumni_contact_view` AS
SELECT 
  c.id AS contact_id,
  m.id AS member_id,
  m.name,
  m.email,
  c.mobile,
  c.home_phone,
  c.office_phone,
  c.location,
  c.city,
  c.country
FROM contact_details c
JOIN members m ON m.id = c.member_id;

-- View 5: alumni_membership_view
CREATE OR REPLACE VIEW `alumni_membership_view` AS
SELECT 
  ms.id AS membership_id,
  m.id AS member_id,
  m.name,
  m.email,
  ms.site_id,
  ms.status,
  ms.registered_on,
  ms.approved_on
FROM membership_details ms
JOIN members m ON m.id = ms.member_id;
