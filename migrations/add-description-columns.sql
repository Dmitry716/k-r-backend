-- Добавляем колонки description для хранения описаний товаров

-- Проверяем и добавляем колонку description в таблицу fences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fences' AND column_name = 'description'
    ) THEN
        ALTER TABLE fences ADD COLUMN description TEXT;
        RAISE NOTICE 'Добавлена колонка description в таблицу fences';
    ELSE
        RAISE NOTICE 'Колонка description уже существует в таблице fences';
    END IF;
END $$;

-- Проверяем и добавляем колонку description в таблицу monuments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'monuments' AND column_name = 'description'
    ) THEN
        ALTER TABLE monuments ADD COLUMN description TEXT;
        RAISE NOTICE 'Добавлена колонка description в таблицу monuments';
    ELSE
        RAISE NOTICE 'Колонка description уже существует в таблице monuments';
    END IF;
END $$;