-- RoamOffline schema + sample data. Run fully in MySQL Workbench (lightning icon).
CREATE DATABASE IF NOT EXISTS roamoffline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE roamoffline;
DROP TABLE IF EXISTS track_points; DROP TABLE IF EXISTS journeys; DROP TABLE IF EXISTS region_places;
DROP TABLE IF EXISTS downloaded_regions; DROP TABLE IF EXISTS tourist_places; DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE downloaded_regions (
  region_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  region_name VARCHAR(150) NOT NULL,
  center_lat DECIMAL(9,6) NOT NULL,
  center_lng DECIMAL(9,6) NOT NULL,
  radius_km TINYINT UNSIGNED NOT NULL,
  min_zoom TINYINT UNSIGNED NOT NULL DEFAULT 9,
  max_zoom TINYINT UNSIGNED NOT NULL DEFAULT 13,
  tile_count INT UNSIGNED NOT NULL DEFAULT 0,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  place_count INT UNSIGNED NOT NULL DEFAULT 0,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_radius CHECK (radius_km BETWEEN 1 AND 50),
  CONSTRAINT fk_region_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_region_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE tourist_places (
  place_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(40) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  description TEXT,
  source VARCHAR(60) DEFAULT 'OpenStreetMap',
  osm_id VARCHAR(30) NULL UNIQUE,                  -- e.g. node/12345 (places imported from OpenStreetMap)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_place_coord (latitude, longitude),
  INDEX idx_place_category (category),
  INDEX idx_place_name (name)
) ENGINE=InnoDB;

CREATE TABLE region_places (
  region_id INT UNSIGNED NOT NULL,
  place_id INT UNSIGNED NOT NULL,
  distance_km DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (region_id, place_id),
  CONSTRAINT fk_rp_region FOREIGN KEY (region_id) REFERENCES downloaded_regions(region_id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_place FOREIGN KEY (place_id) REFERENCES tourist_places(place_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE journeys (
  journey_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  client_uuid CHAR(36) NOT NULL,
  title VARCHAR(120) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NOT NULL,
  distance_m DOUBLE NOT NULL DEFAULT 0,
  point_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_uuid (user_id, client_uuid),
  CONSTRAINT fk_j_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_j_start (user_id, started_at)
) ENGINE=InnoDB;

CREATE TABLE track_points (
  point_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  journey_id INT UNSIGNED NOT NULL,
  seq INT UNSIGNED NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  accuracy_m FLOAT NULL,
  recorded_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_tp_journey FOREIGN KEY (journey_id) REFERENCES journeys(journey_id) ON DELETE CASCADE,
  INDEX idx_tp_journey (journey_id, seq)
) ENGINE=InnoDB;
-- tourist_places starts empty: places for ANY location are imported from OpenStreetMap when a user downloads a region.
