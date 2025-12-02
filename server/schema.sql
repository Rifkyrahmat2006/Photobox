CREATE DATABASE IF NOT EXISTS photobox;
USE photobox;

CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  layout_type ENUM('single', 'strip_3', 'grid_4') DEFAULT 'single',
  config_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
