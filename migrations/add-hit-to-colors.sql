-- Миграция для добавления поля hit к цветам эксклюзивных памятников
-- Этот скрипт обновляет JSON в поле colors, добавляя hit: false для всех цветов

DO $$
DECLARE
    rec RECORD;
    colors_json jsonb;
    updated_colors jsonb := '[]'::jsonb;
    color_item jsonb;
BEGIN
    -- Обновляем таблицу products (эксклюзивные памятники)
    FOR rec IN SELECT id, colors FROM products WHERE colors IS NOT NULL AND colors != ''
    LOOP
        BEGIN
            -- Парсим JSON из текстового поля
            colors_json := rec.colors::jsonb;
            updated_colors := '[]'::jsonb;
            
            -- Проходим по каждому цвету и добавляем поле hit
            FOR color_item IN SELECT * FROM jsonb_array_elements(colors_json)
            LOOP
                -- Добавляем hit: false, если его нет
                IF NOT (color_item ? 'hit') THEN
                    color_item := color_item || '{"hit": false}'::jsonb;
                END IF;
                
                -- Добавляем обновленный цвет в массив
                updated_colors := updated_colors || color_item;
            END LOOP;
            
            -- Обновляем запись
            UPDATE products 
            SET colors = updated_colors::text 
            WHERE id = rec.id;
            
            RAISE NOTICE 'Updated product ID: %, colors: %', rec.id, updated_colors;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing product ID: %, Error: %', rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully for products table';
END $$;