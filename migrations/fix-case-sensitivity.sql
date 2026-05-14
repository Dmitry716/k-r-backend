-- Align exclusive monument image paths in DB with on-disk folder names.
-- Only materials where folders are UPPERCASE on CDN/static (verified on prod):
--   BalticGreen -> BALTICGREEN, Aurora -> AURORA, CuruGray -> CURUGRAY
-- Do NOT rewrite BluePearl / Pokost here: live assets use mixed case (BluePearl, Pokost).

-- Main product image
UPDATE products
SET image = regexp_replace(
  regexp_replace(
    regexp_replace(
      image,
      'K([0-9]+)_Aurora/',
      'K\1_AURORA/',
      'g'
    ),
    'K([0-9]+)_BalticGreen/',
    'K\1_BALTICGREEN/',
    'g'
  ),
  'K([0-9]+)_CuruGray/',
  'K\1_CURUGRAY/',
  'g'
)
WHERE category = 'Эксклюзивные'
  AND (
    image LIKE '%_Aurora/%'
    OR image LIKE '%_BalticGreen/%'
    OR image LIKE '%_CuruGray/%'
  );

-- colors JSON (string round-trip keeps valid jsonb)
UPDATE products
SET colors = regexp_replace(
  regexp_replace(
    regexp_replace(
      colors::text,
      'K([0-9]+)_Aurora',
      'K\1_AURORA',
      'g'
    ),
    'K([0-9]+)_BalticGreen',
    'K\1_BALTICGREEN',
    'g'
  ),
  'K([0-9]+)_CuruGray',
  'K\1_CURUGRAY',
  'g'
)::jsonb
WHERE category = 'Эксклюзивные'
  AND colors::text IS NOT NULL
  AND (
    colors::text LIKE '%_Aurora%'
    OR colors::text LIKE '%_BalticGreen%'
    OR colors::text LIKE '%_CuruGray%'
  );
