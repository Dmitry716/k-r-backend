-- === STEP 1: CREATE SEO TEMPLATES TABLE FIRST ===
CREATE TABLE IF NOT EXISTS seo_templates (
  id SERIAL PRIMARY KEY,
  category_key VARCHAR(100) UNIQUE NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  seo_title VARCHAR(255),
  seo_description VARCHAR(500),
  seo_keywords VARCHAR(500),
  og_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- === STEP 2: CREATE INDEXES ===
CREATE INDEX IF NOT EXISTS idx_seo_templates_entity_type ON seo_templates(entity_type);
CREATE INDEX IF NOT EXISTS idx_seo_templates_category_key ON seo_templates(category_key);

-- === STEP 3: ADD SEO COLUMNS TO MONUMENTS ===
ALTER TABLE single_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE single_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE single_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE single_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE double_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE double_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE double_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE double_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE cheap_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE cheap_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE cheap_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE cheap_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE cross_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE cross_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE cross_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE cross_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE heart_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE heart_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE heart_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE heart_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE composite_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE composite_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE composite_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE composite_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE europe_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE europe_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE europe_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE europe_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE artistic_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE artistic_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE artistic_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE artistic_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE tree_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE tree_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE tree_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE tree_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE complex_monuments ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE complex_monuments ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE complex_monuments ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE complex_monuments ADD COLUMN IF NOT EXISTS og_image TEXT;

-- === STEP 4: ADD SEO COLUMNS TO OTHER TABLES ===
ALTER TABLE fences ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE fences ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE fences ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE fences ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE accessories ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE landscape ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE landscape ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE landscape ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE landscape ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS og_image TEXT;
