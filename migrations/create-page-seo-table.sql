-- Создание таблицы для SEO метаданных страниц
CREATE TABLE IF NOT EXISTS page_seo (
    id SERIAL PRIMARY KEY,
    page_slug VARCHAR(255) UNIQUE NOT NULL,
    page_title VARCHAR(255) NOT NULL,
    
    -- Основные SEO поля
    seo_title VARCHAR(60) NOT NULL,
    seo_description VARCHAR(160) NOT NULL,
    seo_keywords VARCHAR(255),
    
    -- Open Graph (OG) теги для социальных сетей
    og_title VARCHAR(100),
    og_description VARCHAR(160),
    og_image VARCHAR(500),
    og_image_width INTEGER DEFAULT 1200,
    og_image_height INTEGER DEFAULT 630,
    
    -- Twitter Card теги
    twitter_title VARCHAR(70),
    twitter_description VARCHAR(200),
    twitter_image VARCHAR(500),
    
    -- Дополнительные SEO поля
    canonical_url VARCHAR(500),
    robots_meta VARCHAR(100),
    author VARCHAR(100),
    
    -- Структурированные данные (Schema.org JSON-LD)
    schema_markup JSONB,
    
    -- Индексирование
    is_indexed BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_page_seo_slug ON page_seo(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_seo_is_indexed ON page_seo(is_indexed);
CREATE INDEX IF NOT EXISTS idx_page_seo_created_at ON page_seo(created_at);

-- Комментарии к таблице и полям
COMMENT ON TABLE page_seo IS 'SEO метаданные для всех страниц сайта (title, description, OG теги и т.д.)';
COMMENT ON COLUMN page_seo.page_slug IS 'Уникальный slug страницы';
COMMENT ON COLUMN page_seo.page_title IS 'Название страницы (для админки)';
COMMENT ON COLUMN page_seo.seo_title IS 'Title тег для браузера (макс 60 символов)';
COMMENT ON COLUMN page_seo.seo_description IS 'Meta description (макс 160 символов)';
COMMENT ON COLUMN page_seo.seo_keywords IS 'Ключевые слова/теги (разделенные запятой)';
COMMENT ON COLUMN page_seo.og_title IS 'Open Graph title для социальных сетей (макс 100 символов)';
COMMENT ON COLUMN page_seo.og_description IS 'Open Graph description (макс 160 символов)';
COMMENT ON COLUMN page_seo.og_image IS 'Open Graph изображение (минимум 1200x630px)';
COMMENT ON COLUMN page_seo.twitter_title IS 'Twitter Card title (макс 70 символов)';
COMMENT ON COLUMN page_seo.twitter_description IS 'Twitter Card description (макс 200 символов)';
COMMENT ON COLUMN page_seo.twitter_image IS 'Twitter Card изображение';
COMMENT ON COLUMN page_seo.canonical_url IS 'Canonical URL для избежания дублирования контента';
COMMENT ON COLUMN page_seo.robots_meta IS 'Robots meta теги (index, noindex, follow, nofollow)';
COMMENT ON COLUMN page_seo.author IS 'Автор страницы';
COMMENT ON COLUMN page_seo.schema_markup IS 'Структурированные данные в формате JSON-LD (Schema.org)';
COMMENT ON COLUMN page_seo.is_indexed IS 'Флаг для индексирования поисковыми системами';
