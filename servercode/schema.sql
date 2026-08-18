CREATE DATABASE IF NOT EXISTS qsr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qsr;

CREATE TABLE IF NOT EXISTS units (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(254) NULL,
  address VARCHAR(255) NULL,
  logo_path VARCHAR(255) NULL,
  description TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  image_path VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name (name),
  KEY idx_categories_active_order (active, display_order),
  CHECK (display_order >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
  id CHAR(36) PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(1000) NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image_path VARCHAR(255) NULL,
  is_veg BOOLEAN NOT NULL DEFAULT FALSE,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_items_category_name (category_id, name),
  KEY idx_items_category_active_order (category_id, active, display_order),
  CHECK (price >= 0.00),
  CHECK (display_order >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor VARCHAR(120) NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_entity (entity_type, entity_id, created_at),
  KEY idx_audit_created (created_at)
) ENGINE=InnoDB;

INSERT INTO units (id, name, active, currency_code, currency_symbol)
SELECT UUID(), 'Restaurant Unit', TRUE, 'INR', '₹'
WHERE NOT EXISTS (SELECT 1 FROM units);

CREATE TABLE IF NOT EXISTS daily_token_counters (
    token_date DATE PRIMARY KEY,
    last_token INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS orders (
    id CHAR(36) PRIMARY KEY,

    token_date DATE NOT NULL,
    token_number INT NOT NULL,

    customer_name VARCHAR(120) NULL,

    payment_mode VARCHAR(40) NOT NULL DEFAULT 'COUNTER',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'NOT_APPLICABLE',
    order_status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    kitchen_status VARCHAR(30) NOT NULL DEFAULT 'NOT_SENT',
    sent_to_kitchen BOOLEAN NOT NULL DEFAULT FALSE,

    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_daily_token (
        token_date,
        token_number
    ),

    KEY idx_orders_status (
        order_status,
        created_at
    ),

    KEY idx_orders_payment_status (
        payment_status,
        created_at
    )
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    order_id CHAR(36) NOT NULL,

    item_id CHAR(36) NOT NULL,

    item_name VARCHAR(160) NOT NULL,

    quantity INT NOT NULL,

    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    line_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    KEY idx_order_items_order (
        order_id
    )
) ENGINE=InnoDB;

-- Migration: Add kitchen workflow timestamps and Razorpay payment tracking
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(64) NULL;