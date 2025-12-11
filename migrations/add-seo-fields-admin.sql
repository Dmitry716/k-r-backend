-- SQL команды для добавления SEO полей
-- Выполнить с правами суперпользователя (postgres)

-- === ПАМЯТНИКИ ===

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

-- === ОГРАДЫ ===

ALTER TABLE fences ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE fences ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE fences ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE fences ADD COLUMN IF NOT EXISTS og_image TEXT;

-- === АКСЕССУАРЫ ===

ALTER TABLE accessories ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE accessories ADD COLUMN IF NOT EXISTS og_image TEXT;

-- === БЛАГОУСТРОЙСТВО ===

ALTER TABLE landscape ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE landscape ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE landscape ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE landscape ADD COLUMN IF NOT EXISTS og_image TEXT;

-- === АКЦИИ ===

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS og_image TEXT;

-- === БЛОГ ===

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_description VARCHAR(500);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500);
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS og_image TEXT;

-- === ВЫДАТЬ ПРАВА ЮЗЕРУ ===

-- Если нужно выдать права stonerose_user на изменение таблиц:
GRANT ALTER ON TABLE single_monuments TO stonerose_user;
GRANT ALTER ON TABLE double_monuments TO stonerose_user;
GRANT ALTER ON TABLE cheap_monuments TO stonerose_user;
GRANT ALTER ON TABLE cross_monuments TO stonerose_user;
GRANT ALTER ON TABLE heart_monuments TO stonerose_user;
GRANT ALTER ON TABLE composite_monuments TO stonerose_user;
GRANT ALTER ON TABLE europe_monuments TO stonerose_user;
GRANT ALTER ON TABLE artistic_monuments TO stonerose_user;
GRANT ALTER ON TABLE tree_monuments TO stonerose_user;
GRANT ALTER ON TABLE complex_monuments TO stonerose_user;
GRANT ALTER ON TABLE fences TO stonerose_user;
GRANT ALTER ON TABLE accessories TO stonerose_user;
GRANT ALTER ON TABLE landscape TO stonerose_user;
GRANT ALTER ON TABLE campaigns TO stonerose_user;
GRANT ALTER ON TABLE blogs TO stonerose_user;
