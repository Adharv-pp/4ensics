CREATE DATABASE IF NOT EXISTS `fourensics_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `fourensics_db`;

-- 1. App User Table
CREATE TABLE IF NOT EXISTS `app_user` (
  `user_id` VARCHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'analyst',
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Session Table
CREATE TABLE IF NOT EXISTS `user_session` (
  `session_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `refresh_token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  INDEX `idx_session_user` (`user_id`),
  INDEX `idx_session_token` (`refresh_token_hash`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) 
    REFERENCES `app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Password Reset Token Table
CREATE TABLE IF NOT EXISTS `password_reset_token` (
  `token_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT FALSE,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  INDEX `idx_pw_reset_user` (`user_id`),
  INDEX `idx_pw_reset_token` (`token_hash`),
  CONSTRAINT `fk_pw_reset_user` FOREIGN KEY (`user_id`) 
    REFERENCES `app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Email Verification Token Table
CREATE TABLE IF NOT EXISTS `email_verification_token` (
  `token_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `verified_at` DATETIME NULL DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  INDEX `idx_email_verif_user` (`user_id`),
  INDEX `idx_email_verif_token` (`token_hash`),
  CONSTRAINT `fk_email_verif_user` FOREIGN KEY (`user_id`) 
    REFERENCES `app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Scan Batch Table
CREATE TABLE IF NOT EXISTS `scan_batch` (
  `batch_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `reference_label` VARCHAR(255) NULL,
  `analysis_profile` VARCHAR(100) NOT NULL DEFAULT 'standard',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'normal',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`batch_id`),
  INDEX `idx_scan_batch_user` (`user_id`),
  CONSTRAINT `fk_scan_batch_user` FOREIGN KEY (`user_id`) 
    REFERENCES `app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Media Upload Table
CREATE TABLE IF NOT EXISTS `media_upload` (
  `upload_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NULL,
  `media_type` VARCHAR(50) NOT NULL, -- video, image, audio, text
  `file_format` VARCHAR(50) NOT NULL,
  `file_hash_sha256` VARCHAR(64) NOT NULL,
  `file_path` VARCHAR(500) NULL,
  `file_size_bytes` BIGINT NULL,
  `retention_status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`upload_id`),
  INDEX `idx_media_user` (`user_id`),
  INDEX `idx_media_batch` (`batch_id`),
  INDEX `idx_media_hash` (`file_hash_sha256`),
  CONSTRAINT `fk_media_user` FOREIGN KEY (`user_id`) 
    REFERENCES `app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_media_batch` FOREIGN KEY (`batch_id`) 
    REFERENCES `scan_batch` (`batch_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Analysis Job Table
CREATE TABLE IF NOT EXISTS `analysis_job` (
  `job_id` VARCHAR(36) NOT NULL,
  `upload_id` VARCHAR(36) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  `progress_pct` FLOAT NOT NULL DEFAULT 0.0,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`job_id`),
  INDEX `idx_job_upload` (`upload_id`),
  INDEX `idx_job_status` (`status`),
  CONSTRAINT `fk_job_upload` FOREIGN KEY (`upload_id`) 
    REFERENCES `media_upload` (`upload_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. AI Model Registry Table
CREATE TABLE IF NOT EXISTS `ai_model` (
  `model_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `version` VARCHAR(50) NOT NULL,
  `modality` VARCHAR(50) NOT NULL, -- video, image, audio, text, multimodal
  `accuracy` FLOAT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`model_id`),
  INDEX `idx_model_modality` (`modality`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Scoring Config Table
CREATE TABLE IF NOT EXISTS `scoring_config` (
  `scoring_config_id` VARCHAR(36) NOT NULL,
  `low_max` FLOAT NOT NULL DEFAULT 30.0,
  `medium_max` FLOAT NOT NULL DEFAULT 70.0,
  `module_weights_json` JSON NOT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`scoring_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Analysis Report Table
CREATE TABLE IF NOT EXISTS `analysis_report` (
  `report_id` VARCHAR(36) NOT NULL,
  `upload_id` VARCHAR(36) NOT NULL,
  `job_id` VARCHAR(36) NULL,
  `scoring_config_id` VARCHAR(36) NULL,
  `fused_score` FLOAT NOT NULL,
  `confidence` FLOAT NOT NULL,
  `risk_band` VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  `verdict` VARCHAR(50) NOT NULL, -- REAL, FAKE, SUSPICIOUS, INCONCLUSIVE
  `review_status` VARCHAR(50) NOT NULL DEFAULT 'unreviewed', -- unreviewed, under_review, verified, dismissed
  `summary_text` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  INDEX `idx_report_upload` (`upload_id`),
  INDEX `idx_report_job` (`job_id`),
  INDEX `idx_report_scoring_config` (`scoring_config_id`),
  INDEX `idx_report_verdict` (`verdict`),
  INDEX `idx_report_risk` (`risk_band`),
  CONSTRAINT `fk_report_upload` FOREIGN KEY (`upload_id`) 
    REFERENCES `media_upload` (`upload_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_report_job` FOREIGN KEY (`job_id`) 
    REFERENCES `analysis_job` (`job_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_report_scoring_config` FOREIGN KEY (`scoring_config_id`) 
    REFERENCES `scoring_config` (`scoring_config_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Image Analysis Module Table
CREATE TABLE IF NOT EXISTS `image_analysis` (
  `image_analysis_id` VARCHAR(36) NOT NULL,
  `report_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NULL,
  `ela_score` FLOAT NULL,
  `ela_mean` FLOAT NULL,
  `ela_max` FLOAT NULL,
  `fft_score` FLOAT NULL,
  `fft_mean` FLOAT NULL,
  `feature_vec_json` JSON NULL, -- 8-feature forensic vector
  `fake_probability` FLOAT NULL,
  `verdict` VARCHAR(50) NULL,
  `metadata_json` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_analysis_id`),
  INDEX `idx_image_report` (`report_id`),
  INDEX `idx_image_model` (`model_id`),
  CONSTRAINT `fk_image_report` FOREIGN KEY (`report_id`) 
    REFERENCES `analysis_report` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_image_model` FOREIGN KEY (`model_id`) 
    REFERENCES `ai_model` (`model_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Video Analysis Module Table
CREATE TABLE IF NOT EXISTS `video_analysis` (
  `video_analysis_id` VARCHAR(36) NOT NULL,
  `report_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NULL,
  `scan_mode` VARCHAR(50) NOT NULL DEFAULT 'deep', -- quick, deep
  `chunk_count` INT NOT NULL DEFAULT 0,
  `avg_fake_prob` FLOAT NULL,
  `highest_fake_prob` FLOAT NULL,
  `justification` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`video_analysis_id`),
  INDEX `idx_video_report` (`report_id`),
  INDEX `idx_video_model` (`model_id`),
  CONSTRAINT `fk_video_report` FOREIGN KEY (`report_id`) 
    REFERENCES `analysis_report` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_video_model` FOREIGN KEY (`model_id`) 
    REFERENCES `ai_model` (`model_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Video Chunk Score Breakdown Table
CREATE TABLE IF NOT EXISTS `video_chunk_score` (
  `chunk_id` VARCHAR(36) NOT NULL,
  `video_analysis_id` VARCHAR(36) NOT NULL,
  `chunk_index` INT NOT NULL,
  `time_label` VARCHAR(50) NULL,
  `start_time` FLOAT NULL,
  `end_time` FLOAT NULL,
  `fake_probability` FLOAT NOT NULL,
  `real_probability` FLOAT NULL,
  `verdict` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chunk_id`),
  INDEX `idx_chunk_video` (`video_analysis_id`),
  INDEX `idx_chunk_index` (`chunk_index`),
  CONSTRAINT `fk_chunk_video` FOREIGN KEY (`video_analysis_id`) 
    REFERENCES `video_analysis` (`video_analysis_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Audio Analysis Module Table
CREATE TABLE IF NOT EXISTS `audio_analysis` (
  `audio_analysis_id` VARCHAR(36) NOT NULL,
  `report_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NULL,
  `audio_source` VARCHAR(100) NULL,
  `sample_rate` INT NULL,
  `jitter` FLOAT NULL,
  `shimmer` FLOAT NULL,
  `hnr` FLOAT NULL, -- Harmonics-to-Noise Ratio (roadmap)
  `fake_probability` FLOAT NULL,
  `verdict` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audio_analysis_id`),
  INDEX `idx_audio_report` (`report_id`),
  INDEX `idx_audio_model` (`model_id`),
  CONSTRAINT `fk_audio_report` FOREIGN KEY (`report_id`) 
    REFERENCES `analysis_report` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_audio_model` FOREIGN KEY (`model_id`) 
    REFERENCES `ai_model` (`model_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Text Analysis Module Table
CREATE TABLE IF NOT EXISTS `text_analysis` (
  `text_analysis_id` VARCHAR(36) NOT NULL,
  `report_id` VARCHAR(36) NOT NULL,
  `model_id` VARCHAR(36) NULL,
  `perplexity` FLOAT NULL,
  `burstiness` FLOAT NULL,
  `ttr` FLOAT NULL, -- Type-Token Ratio
  `fake_probability` FLOAT NULL,
  `verdict` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`text_analysis_id`),
  INDEX `idx_text_report` (`report_id`),
  INDEX `idx_text_model` (`model_id`),
  CONSTRAINT `fk_text_report` FOREIGN KEY (`report_id`) 
    REFERENCES `analysis_report` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_text_model` FOREIGN KEY (`model_id`) 
    REFERENCES `ai_model` (`model_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. URL Scam Check Table
CREATE TABLE IF NOT EXISTS `url_scam_check` (
  `url_check_id` VARCHAR(36) NOT NULL,
  `text_analysis_id` VARCHAR(36) NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `is_flagged` BOOLEAN NOT NULL DEFAULT FALSE,
  `threat_category` VARCHAR(100) NULL,
  `reputation_score` FLOAT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`url_check_id`),
  INDEX `idx_url_text_analysis` (`text_analysis_id`),
  CONSTRAINT `fk_url_text_analysis` FOREIGN KEY (`text_analysis_id`) 
    REFERENCES `text_analysis` (`text_analysis_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Analysis Review Table (Auditing / Human Review)
CREATE TABLE IF NOT EXISTS `analysis_review` (
  `review_id` VARCHAR(36) NOT NULL,
  `report_id` VARCHAR(36) NOT NULL,
  `reviewed_by` VARCHAR(36) NOT NULL,
  `action` VARCHAR(50) NOT NULL, -- CONFIRMED_FAKE, CONFIRMED_REAL, ESCALATED, DISMISSED
  `notes` TEXT NULL,
  `reviewed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  INDEX `idx_review_report` (`report_id`),
  INDEX `idx_review_user` (`reviewed_by`),
  CONSTRAINT `fk_review_report` FOREIGN KEY (`report_id`) 
    REFERENCES `analysis_report` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_user` FOREIGN KEY (`reviewed_by`) 
    REFERENCES `app_user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
