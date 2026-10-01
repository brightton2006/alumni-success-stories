-- =========================================================================
-- ALUMNI STORE DATABASE & TABLES DDL
-- Comprehensive Institutional Alumni Database Schema
-- Database: alumni_store
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `alumni_store`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `alumni_store`;

-- -------------------------------------------------------------------------
-- 1. USERS TABLE (Accounts & Authentication)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `role` VARCHAR(32) DEFAULT 'USER' NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone_number` VARCHAR(30) NULL DEFAULT '',
    `google_id` VARCHAR(100) NULL,
    `profile_image` TEXT NULL,
    `auth_provider` VARCHAR(50) DEFAULT 'local',
    `is_email_verified` TINYINT(1) DEFAULT 1 NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1 NOT NULL,
    `status` VARCHAR(32) DEFAULT 'APPROVED' NOT NULL,
    `batch_year` VARCHAR(20) NULL,
    `batch_number` VARCHAR(20) NULL,
    `department` VARCHAR(100) NULL,
    `company` VARCHAR(150) NULL,
    `designation` VARCHAR(150) NULL,
    `location` VARCHAR(150) NULL,
    `bio` TEXT NULL,
    `linkedin_url` VARCHAR(255) NULL,
    `member_id` VARCHAR(64) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. CATEGORIES TABLE (Story & Professional Domains)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` VARCHAR(64) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `icon` VARCHAR(64) NULL,
    `color` VARCHAR(64) NULL,
    `is_active` TINYINT(1) DEFAULT 1 NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. MEMBERS TABLE (Comprehensive Alumni Master Directory)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `members` (
    `id` VARCHAR(64) PRIMARY KEY,
    `mongo_id` VARCHAR(64) NULL,
    `user_id` VARCHAR(64) NULL,
    `salutation` VARCHAR(50) NULL DEFAULT '',
    `name` VARCHAR(255) NOT NULL,
    `gender` VARCHAR(50) NULL DEFAULT '',
    `date_of_birth` DATE NULL,
    `label` VARCHAR(255) NULL DEFAULT '',
    `email` VARCHAR(255) NOT NULL,
    `alternate_email` VARCHAR(255) NULL DEFAULT '',
    `phone_number` VARCHAR(100) NULL DEFAULT '',
    `roll_number` VARCHAR(100) NULL DEFAULT '',
    `batch_year` VARCHAR(50) NULL,
    `batch_number` VARCHAR(50) NULL,
    `course` VARCHAR(150) NULL DEFAULT '',
    `stream` VARCHAR(150) NULL DEFAULT '',
    `institution` VARCHAR(255) DEFAULT 'National Engineering College',
    `current_company` VARCHAR(255) NULL DEFAULT '',
    `current_role` VARCHAR(255) NULL DEFAULT '',
    `work_department` VARCHAR(255) NULL DEFAULT '',
    `experience_years` INT NULL DEFAULT 0,
    `city` VARCHAR(150) NULL DEFAULT '',
    `state` VARCHAR(150) NULL DEFAULT '',
    `country` VARCHAR(150) DEFAULT 'India',
    `pincode` VARCHAR(50) NULL DEFAULT '',
    `location` VARCHAR(255) NULL DEFAULT '',
    `profile_url` TEXT NULL,
    `thumbnail_url` TEXT NULL,
    `full_image_url` TEXT NULL,
    `linkedin_url` TEXT NULL,
    `facebook_url` TEXT NULL,
    `twitter_url` TEXT NULL,
    `github_url` TEXT NULL,
    `website_url` TEXT NULL,
    `youtube_url` TEXT NULL,
    `instagram_url` TEXT NULL,
    `skills` JSON NULL,
    `bio` TEXT NULL,
    `membership_status` VARCHAR(50) DEFAULT 'Approved',
    `is_verified` TINYINT(1) DEFAULT 1 NOT NULL,
    `is_mentor_available` TINYINT(1) DEFAULT 0 NOT NULL,
    `registered_on` DATETIME NULL,
    `approved_on` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_members_email` (`email`),
    INDEX `idx_members_name` (`name`),
    INDEX `idx_members_batch` (`batch_year`),
    INDEX `idx_members_stream` (`stream`),
    INDEX `idx_members_company` (`current_company`(100)),
    INDEX `idx_members_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. MEMBER EDUCATION DETAILS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `member_education` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `member_id` VARCHAR(64) NOT NULL,
    `course` VARCHAR(150) NULL DEFAULT '',
    `stream` VARCHAR(150) NULL DEFAULT '',
    `institution` VARCHAR(255) NULL DEFAULT 'National Engineering College',
    `start_year` VARCHAR(50) NULL,
    `end_year` VARCHAR(50) NULL,
    `roll_no` VARCHAR(100) NULL DEFAULT '',
    `site_id` VARCHAR(100) NULL DEFAULT '',
    INDEX `idx_medu_member` (`member_id`),
    INDEX `idx_medu_course` (`course`),
    INDEX `idx_medu_stream` (`stream`),
    INDEX `idx_medu_end_year` (`end_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. MEMBER WORK DETAILS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `member_work` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `member_id` VARCHAR(64) NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(255) NOT NULL,
    `department` VARCHAR(255) NULL DEFAULT '',
    `start_year` VARCHAR(50) NULL,
    `start_month` VARCHAR(50) NULL,
    `end_year` VARCHAR(50) NULL,
    `end_month` VARCHAR(50) NULL,
    `is_current` TINYINT(1) DEFAULT 1 NOT NULL,
    INDEX `idx_mwork_member` (`member_id`),
    INDEX `idx_mwork_company` (`company_name`(100)),
    INDEX `idx_mwork_position` (`position`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. STORIES TABLE (Alumni Success Stories & Interactive Journeys)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stories` (
    `id` VARCHAR(64) PRIMARY KEY,
    `author_member_id` VARCHAR(64) NULL,
    `submitted_by_user_id` VARCHAR(64) NULL,
    `submitted_by_user_name` VARCHAR(150) NULL,
    `submitted_by_user_email` VARCHAR(255) NULL,
    `author_admin_id` VARCHAR(64) NULL,
    `story_title` VARCHAR(255) NOT NULL,
    `person_name` VARCHAR(150) NOT NULL,
    `profession` VARCHAR(150) NULL,
    `role` VARCHAR(150) NULL,
    `company` VARCHAR(150) NULL,
    `department` VARCHAR(100) NULL,
    `batch_year` VARCHAR(20) NULL,
    `batch_number` VARCHAR(20) NULL,
    `batch_display` VARCHAR(100) NULL,
    `location` VARCHAR(150) NULL,
    `category` VARCHAR(100) NOT NULL,
    `short_summary` TEXT NOT NULL,
    `full_story` LONGTEXT NOT NULL,
    `person_image` LONGTEXT NULL,
    `additional_images` JSON NULL,
    `status` VARCHAR(50) DEFAULT 'PENDING_REVIEW' NOT NULL,
    `show_name` TINYINT(1) DEFAULT 1 NOT NULL,
    `is_verified` TINYINT(1) DEFAULT 1 NOT NULL,
    `publication_locations` JSON NULL,
    `views` INT DEFAULT 0 NOT NULL,
    `rejection_reason` TEXT NULL,
    `admin_feedback` TEXT NULL,
    `ai_extracted_elements` JSON NULL,
    `ai_mind_map` JSON NULL,
    `journey_map` JSON NULL,
    `hierarchical_mind_map` JSON NULL,
    `published_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_stories_status` (`status`),
    INDEX `idx_stories_category` (`category`),
    INDEX `idx_stories_user` (`submitted_by_user_id`),
    INDEX `idx_stories_member` (`author_member_id`),
    INDEX `idx_stories_published` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. COMMENTS TABLE (Story Interactions & Discussions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comments` (
    `id` VARCHAR(64) PRIMARY KEY,
    `story_id` VARCHAR(64) NOT NULL,
    `author_name` VARCHAR(150) NOT NULL,
    `author_email` VARCHAR(255) NULL,
    `batch_number` VARCHAR(20) NULL,
    `author_tag` VARCHAR(100) NULL,
    `comment_text` TEXT NOT NULL,
    `likes` INT DEFAULT 0 NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_comments_story` (`story_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 8. REACTIONS TABLE (Inspiring, Love, Insightful, Clap, Fire)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reactions` (
    `id` VARCHAR(64) PRIMARY KEY,
    `story_id` VARCHAR(64) NOT NULL,
    `reaction_type` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(64) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_reactions_story` (`story_id`),
    INDEX `idx_reactions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 9. ACTIVITY & AUDIT LOGS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(64) NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_logs_user` (`user_id`),
    INDEX `idx_logs_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 10. COMPREHENSIVE ALUMNI OVERVIEW VIEW
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW `alumni_store_overview` AS
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