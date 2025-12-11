-- Создание таблицы для динамических описаний страниц
CREATE TABLE IF NOT EXISTS page_descriptions (
    id SERIAL PRIMARY KEY,
    page_slug VARCHAR(255) UNIQUE NOT NULL,
    page_title VARCHAR(255) NOT NULL,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_page_descriptions_slug ON page_descriptions(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_descriptions_created_at ON page_descriptions(created_at);

-- Комментарии к таблице и полям
COMMENT ON TABLE page_descriptions IS 'Динамические описания страниц с блочной структурой контента';
COMMENT ON COLUMN page_descriptions.page_slug IS 'Уникальный slug страницы';
COMMENT ON COLUMN page_descriptions.page_title IS 'Название страницы';
COMMENT ON COLUMN page_descriptions.blocks IS 'JSON массив блоков контента (заголовки, текст, списки, изображения, цитаты)';
COMMENT ON COLUMN page_descriptions.created_at IS 'Дата создания';
COMMENT ON COLUMN page_descriptions.updated_at IS 'Дата последнего обновления';