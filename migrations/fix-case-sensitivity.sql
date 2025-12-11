-- Fix case sensitivity issues in exclusive monument image paths
-- This updates paths from mixed case (e.g., K10_Aurora) to uppercase (K10_AURORA)

-- Update main image paths
UPDATE products 
SET image = 
    REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(
            REPLACE(REPLACE(REPLACE(REPLACE(image,
        'K10_Aurora', 'K10_AURORA'),
        'K10_BalticGreen', 'K10_BALTICGREEN'),
        'K10_CuruGray', 'K10_CURUGRAY'),
        'K10_BluePearl', 'K10_BLUEPEARL'),
        'K10_Pokost', 'K10_POKOST'),
        'K11_Aurora', 'K11_AURORA'),
        'K11_BalticGreen', 'K11_BALTICGREEN'),
        'K11_BluePearl', 'K11_BLUEPEARL'),
        'K11_CuruGray', 'K11_CURUGRAY'),
        'K11_Pokost', 'K11_POKOST'),
        'K12_Aurora', 'K12_AURORA'),
        'K12_BalticGreen', 'K12_BALTICGREEN')
WHERE category = 'Эксклюзивные';

-- Update colors JSON array
-- This is more complex as we need to handle JSON strings within the array
-- Using a procedural approach would be better, but this SQL attempts to handle common cases

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K10_Aurora', 'K10_AURORA', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%Aurora%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K10_BalticGreen', 'K10_BALTICGREEN', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%BalticGreen%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K10_CuruGray', 'K10_CURUGRAY', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%CuruGray%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K10_BluePearl', 'K10_BLUEPEARL', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%BluePearl%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K10_Pokost', 'K10_POKOST', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%Pokost%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K([0-9]+)_Aurora', 'K\1_AURORA', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%Aurora%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K([0-9]+)_BalticGreen', 'K\1_BALTICGREEN', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%BalticGreen%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K([0-9]+)_CuruGray', 'K\1_CURUGRAY', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%CuruGray%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K([0-9]+)_BluePearl', 'K\1_BLUEPEARL', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%BluePearl%';

UPDATE products
SET colors = 
    REGEXP_REPLACE(colors::text, 'K([0-9]+)_Pokost', 'K\1_POKOST', 'g')::jsonb
WHERE category = 'Эксклюзивные' AND colors::text LIKE '%Pokost%';
