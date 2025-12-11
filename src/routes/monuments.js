const express = require('express');
const { db } = require('../utils/db');
const { 
  products, 
  artisticMonuments,
  singleMonuments,
  doubleMonuments,
  crossMonuments,
  heartMonuments,
  compositeMonuments,
  europeMonuments,
  treeMonuments,
  complexMonuments,
  cheapMonuments,
} = require('../models/schema');
const { eq, like, and, or, gte, lte, sql } = require('drizzle-orm');

const router = express.Router();

// Маппинг категорий к таблицам
const categoryTableMap = {
  'artistic': artisticMonuments,
  'single': singleMonuments,
  'double': doubleMonuments,
  'cross': crossMonuments,
  'heart': heartMonuments,
  'composite': compositeMonuments,
  'europe': europeMonuments,
  'tree': treeMonuments,
  'complex': complexMonuments,
  'exclusive': products, // эксклюзивные находятся в таблице products
  'cheap': cheapMonuments, // недорогие находятся в таблице cheap_monuments
  // Русские названия категорий (используем те же таблицы, но без дублей)
  'Художественные': artisticMonuments,
  'Одиночные': singleMonuments,
  'Двойные': doubleMonuments,
  'В виде креста': crossMonuments,
  'В виде сердца': heartMonuments,
  'Составные': compositeMonuments,
  'Европейские': europeMonuments,
  'В виде деревьев': treeMonuments,
  'Мемориальные Комплексы': complexMonuments,
  'Недорогие': cheapMonuments // используем cheapMonuments вместо budgetMonuments
  // УБИРАЕМ: 'Эксклюзивные': products - чтобы избежать дублей
};

// Уникальные таблицы только для получения всех памятников (без дублей)
const uniqueTables = [
  artisticMonuments,
  singleMonuments,
  doubleMonuments,
  crossMonuments,
  heartMonuments,
  compositeMonuments,
  europeMonuments,
  treeMonuments,
  complexMonuments,
    // budgetMonuments removed
  products, // эксклюзивные
  cheapMonuments
];

/**
 * Parse and normalize monument colors from potential double JSON encoding
 */
const parseMonumentColors = (monument) => {
  if (!monument || !monument.colors) return monument;

  let colors = monument.colors;
  
  // Handle potential double JSON encoding
  if (typeof colors === 'string') {
    try {
      colors = JSON.parse(colors);
      // Check if it's double-encoded (string within a string)
      if (typeof colors === 'string') {
        colors = JSON.parse(colors);
      }
    } catch (e) {
      console.warn('Failed to parse colors:', e.message);
      return monument;
    }
  }
  
  if (Array.isArray(colors)) {
    monument.colors = colors;
  }

  return monument;
};

// Функция для трансформации цены
const transformPrice = (price) => {
  if (typeof price === 'string') {
    return parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
  }
  return price || 0;
};

// Функция для валидации данных
const validateMonumentData = (data) => {
  const requiredFields = ['name', 'category'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }
  
  if (!categoryTableMap[data.category]) {
    return `Invalid category: ${data.category}`;
  }
  
  return null;
};

// GET /api/monuments - получить все памятники
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice,
      hit,
      popular,
      limit = 2000,
      offset = 0
    } = req.query;

    // Если указана категория, запрашиваем из конкретной таблицы
    if (category && categoryTableMap[category]) {
      let query = db.select().from(categoryTableMap[category]);
      const conditions = [];
      const table = categoryTableMap[category];
      
      // Специальная логика для эксклюзивных памятников
      if (category === 'exclusive') {
        conditions.push(eq(table.category, 'Эксклюзивные'));
      }

      // Поиск по названию
      if (search) {
        conditions.push(like(table.name, `%${search}%`));
      }

      // Фильтр по цене
      if (minPrice) {
        conditions.push(gte(table.price, parseInt(minPrice)));
      }
      if (maxPrice) {
        conditions.push(lte(table.price, parseInt(maxPrice)));
      }

      // Фильтры по статусам
      if (hit === 'true') {
        conditions.push(eq(table.hit, true));
      }
      if (popular === 'true') {
        conditions.push(eq(table.popular, true));
      }

      // Применяем условия
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Применяем лимит и смещение
      query = query.limit(parseInt(limit)).offset(parseInt(offset));
      query = query.orderBy(table.id);

      const monuments = await query;
      // Normalize paths for exclusive monuments
      const normalizedMonuments = monuments.map(m => parseMonumentColors(m));
      return res.json({ success: true, data: normalizedMonuments });
    }

    // Если категория не указана, получаем все памятники из всех таблиц
    let allMonuments = [];
    
    // Собираем памятники из уникальных таблиц (без дублей)
    for (const table of uniqueTables) {
      try {
        let query = db.select().from(table);
        const conditions = [];
        
        // Специальная логика для эксклюзивных памятников (только из products)
        if (table === products) {
          conditions.push(eq(table.category, 'Эксклюзивные'));
        }

        // Поиск по названию
        if (search) {
          conditions.push(like(table.name, `%${search}%`));
        }

        // Фильтр по цене
        if (minPrice) {
          conditions.push(gte(table.price, parseInt(minPrice)));
        }
        if (maxPrice) {
          conditions.push(lte(table.price, parseInt(maxPrice)));
        }

        // Фильтры по статусам
        if (hit === 'true') {
          conditions.push(eq(table.hit, true));
        }
        if (popular === 'true') {
          conditions.push(eq(table.popular, true));
        }

        // Применяем условия
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        const tableMonuments = await query;
        allMonuments = allMonuments.concat(tableMonuments);
      } catch (error) {
        console.warn(`Error fetching from table:`, error.message);
      }
    }

    // Сортируем по ID и применяем пагинацию
    allMonuments.sort((a, b) => a.id - b.id);
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMonuments = allMonuments.slice(startIndex, endIndex);

    // Normalize paths for all monuments
    const normalizedMonuments = paginatedMonuments.map(m => parseMonumentColors(m));
    res.json({ success: true, data: normalizedMonuments });
  } catch (error) {
    console.error('Error fetching monuments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monuments' });
  }
});

// GET /api/monuments/slug/:slug - получить памятник по slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Ищем в основной таблице products
    let monument = await db.select().from(products)
      .where(eq(products.slug, slug));

    if (monument.length === 0) {
      // Ищем по всем таблицам категорий
      for (const [categoryName, table] of Object.entries(categoryTableMap)) {
        monument = await db.select().from(table)
          .where(eq(table.slug, slug));
        
        if (monument.length > 0) {
          break;
        }
      }
    }

    if (monument.length === 0) {
      return res.status(404).json({ success: false, error: 'Monument not found' });
    }

    res.json({ success: true, data: parseMonumentColors(monument[0]) });
  } catch (error) {
    console.error('Error fetching monument by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monument' });
  }
});

// GET /api/monuments/:category/:slug - получить памятник по категории и slug
router.get('/:category/:slug', async (req, res) => {
  try {
    const { category, slug } = req.params;
    
    // Определяем таблицу для поиска
    let table = categoryTableMap[category];
    
    // Для эксклюзивной категории используем products таблицу с фильтром
    if (category === 'exclusive') {
      const monument = await db.select().from(products)
        .where(and(
          eq(products.slug, slug),
          eq(products.category, 'Эксклюзивные')
        ));
      
      if (monument.length === 0) {
        return res.status(404).json({ success: false, error: 'Monument not found' });
      }
      
      return res.json({ success: true, data: parseMonumentColors(monument[0]) });
    }
    
    // Для других категорий используем соответствующие таблицы
    if (!table) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    const monument = await db.select().from(table)
      .where(eq(table.slug, slug));
    
    if (monument.length === 0) {
      return res.status(404).json({ success: false, error: 'Monument not found' });
    }
    
    res.json({ success: true, data: parseMonumentColors(monument[0]) });
  } catch (error) {
    console.error('Error fetching monument by category and slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monument' });
  }
});

// GET /api/monuments/:category - получить памятники по категории
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { 
      search, 
      minPrice, 
      maxPrice,
      hit,
      popular,
      limit = 1000,
      offset = 0
    } = req.query;

    // Проверяем, является ли параметр числовым ID
    if (!isNaN(category)) {
      // Если это число, то это ID памятника
      const id = parseInt(category);
      const monument = await db.select().from(products)
        .where(eq(products.id, id));

      if (monument.length === 0) {
        return res.status(404).json({ success: false, error: 'Monument not found' });
      }

      return res.json({ success: true, data: parseMonumentColors(monument[0]) });
    }

    // Проверяем, существует ли такая категория
    if (!categoryTableMap[category]) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid category: ${category}. Available categories: ${Object.keys(categoryTableMap).join(', ')}` 
      });
    }

    const table = categoryTableMap[category];
    let query = db.select().from(table);
    const conditions = [];

    // Специальная логика для эксклюзивных памятников
    if (category === 'exclusive') {
      conditions.push(eq(table.category, 'Эксклюзивные'));
    }

    // Поиск по названию
    if (search) {
      conditions.push(like(table.name, `%${search}%`));
    }

    // Фильтр по цене
    if (minPrice) {
      conditions.push(gte(table.price, parseInt(minPrice)));
    }
    if (maxPrice) {
      conditions.push(lte(table.price, parseInt(maxPrice)));
    }

    // Фильтры по статусам
    if (hit === 'true') {
      conditions.push(eq(table.hit, true));
    }
    if (popular === 'true') {
      conditions.push(eq(table.popular, true));
    }

    // Применяем условия
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Применяем лимит и смещение
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    query = query.orderBy(table.id);

    const monuments = await query;

    // Normalize paths for all monuments
    const normalizedMonuments = monuments.map(m => parseMonumentColors(m));
    res.json({ success: true, data: normalizedMonuments });
  } catch (error) {
    console.error('Error fetching monuments by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monuments' });
  }
});

// GET /api/monuments/id/:id - получить памятник по ID
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    let monument;
    
    if (category && categoryTableMap[category]) {
      // Ищем в конкретной таблице категории
      monument = await db.select().from(categoryTableMap[category])
        .where(eq(categoryTableMap[category].id, parseInt(id)));
    } else {
      // Ищем в основной таблице products
      monument = await db.select().from(products)
        .where(eq(products.id, parseInt(id)));
    }

    if (monument.length === 0) {
      return res.status(404).json({ success: false, error: 'Monument not found' });
    }

    res.json({ success: true, data: parseMonumentColors(monument[0]) });
  } catch (error) {
    console.error('Error fetching monument by ID:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monument' });
  }
});

// POST /api/monuments - создать новый памятник
router.post('/', async (req, res) => {
  try {
    const monumentData = req.body;
    
    console.log('[CREATE] Incoming data with SEO:', {
      name: monumentData.name,
      category: monumentData.category,
      seoTitle: monumentData.seoTitle,
      seoDescription: monumentData.seoDescription,
      seoKeywords: monumentData.seoKeywords,
      ogImage: monumentData.ogImage
    });
    
    // Валидация
    const validationError = validateMonumentData(monumentData);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const table = categoryTableMap[monumentData.category] || products;

    // Получить максимальный ID в таблице и увеличить на 1
    const maxIdResult = await db.select({ maxId: sql`MAX(${table.id})` }).from(table);
    const nextId = (maxIdResult[0]?.maxId || 0) + 1;

    // Трансформация данных
    let processedData = {
      ...monumentData,
      id: nextId, // Автоматический ID
      price: transformPrice(monumentData.price),
      oldPrice: transformPrice(monumentData.oldPrice)
    };

    // Для эксклюзивных памятников преобразуем категорию в русское название
    if (monumentData.category === 'exclusive') {
      processedData.category = 'Эксклюзивные';
    }

    const newMonument = await db.insert(table).values(processedData).returning();
    const normalizedMonument = parseMonumentColors(newMonument[0]);

    console.log('[CREATE] Monument created:', {
      id: normalizedMonument.id,
      seoTitle: normalizedMonument.seoTitle,
      seoDescription: normalizedMonument.seoDescription,
      seoKeywords: normalizedMonument.seoKeywords,
      ogImage: normalizedMonument.ogImage
    });

    res.json({ success: true, data: normalizedMonument });
  } catch (error) {
    console.error('Error creating monument:', error);
    res.status(500).json({ success: false, error: 'Failed to create monument' });
  }
});

// PUT /api/monuments/id/:id - обновить памятник
router.put('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { category, ...updateData } = req.body;

    // Преобразуем английские названия категорий в ключи для поиска в categoryTableMap
    if (category === 'exclusive') {
      category = 'exclusive'; // Остается как есть для поиска в categoryTableMap
    }

    console.log(`[UPDATE] ID: ${id}, Category: ${category}, Data:`, updateData);
    console.log(`[UPDATE] categoryTableMap has "${category}":`, !!categoryTableMap[category]);

    // Трансформация данных
    if (updateData.price) {
      updateData.price = transformPrice(updateData.price);
    }
    if (updateData.oldPrice) {
      updateData.oldPrice = transformPrice(updateData.oldPrice);
    }

    // Удаляем поля со значением null или пустые строки чтобы избежать ошибок схемы
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === '') {
        delete updateData[key];
      }
    });

    const monumentId = parseInt(id);
    let table = category && categoryTableMap[category] ? categoryTableMap[category] : null;
    
    console.log(`[UPDATE] Selected table for ${category}:`, table ? 'found' : 'not found');
    console.log(`[UPDATE] Available categories:`, Object.keys(categoryTableMap));

    // Если table не определена, ищем памятник во всех таблицах
    if (!table) {
      const allTables = [
        products, artisticMonuments, singleMonuments, doubleMonuments,
        crossMonuments, heartMonuments, compositeMonuments, europeMonuments,
        treeMonuments, complexMonuments, cheapMonuments
      ];

      for (const tbl of allTables) {
        const found = await db.select().from(tbl).where(eq(tbl.id, monumentId));
        if (found.length > 0) {
          table = tbl;
          console.log(`[UPDATE] Found monument in table`);
          break;
        }
      }
    }

    if (!table) {
      return res.status(404).json({ success: false, error: 'Monument not found in any table' });
    }
    
    console.log(`[UPDATE] Filtered data:`, updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    
    // Пытаемся обновить, если есть ошибка схемы - пробуем без проблемных полей
    let updatedMonument;
    try {
      updatedMonument = await db.update(table)
        .set(updateData)
        .where(eq(table.id, monumentId))
        .returning();
    } catch (error) {
      if (error.message.includes('name')) {
        console.log('[UPDATE] Schema error, trying without problematic fields...');
        // Удаляем поля которые могут отсутствовать в схеме
        const safeData = { ...updateData };
        delete safeData.textPrice;
        delete safeData.description;
        delete safeData.colors;
        
        console.log('[UPDATE] Retry with safe data:', safeData);
        updatedMonument = await db.update(table)
          .set(safeData)
          .where(eq(table.id, monumentId))
          .returning();
      } else {
        throw error;
      }
    }

    if (updatedMonument.length === 0) {
      return res.status(404).json({ success: false, error: 'Monument not found' });
    }

    res.json({ success: true, data: parseMonumentColors(updatedMonument[0]) });
  } catch (error) {
    console.error('Error updating monument:', error);
    res.status(500).json({ success: false, error: 'Failed to update monument' });
  }
});

// DELETE /api/monuments/id/:id - удалить памятник
router.delete('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, slug } = req.query;

    const monumentId = parseInt(id);
    const table = category && categoryTableMap[category] ? categoryTableMap[category] : products;
    
    // Сначала находим памятник, чтобы проверить его существование
    const existingMonument = await db.select().from(table)
      .where(eq(table.id, monumentId));

    if (existingMonument.length === 0) {
      return res.status(404).json({ success: false, error: 'Monument not found' });
    }

    // Если предоставлен slug, проверяем его соответствие
    if (slug && existingMonument[0].slug !== slug) {
      return res.status(400).json({ 
        success: false, 
        error: 'Slug mismatch - attempting to delete wrong monument',
        details: { 
          expectedSlug: existingMonument[0].slug, 
          providedSlug: slug, 
          id: monumentId,
          table: category || 'products'
        }
      });
    }

    // Удаляем только найденный памятник
    const deletedMonument = await db.delete(table)
      .where(eq(table.id, monumentId))
      .returning();

    if (deletedMonument.length === 0) {
      return res.status(404).json({ success: false, error: 'Monument not found during deletion' });
    }

    console.log(`[DELETE] Monument deleted - ID: ${monumentId}, Slug: ${existingMonument[0].slug}, Name: ${existingMonument[0].name}, Category: ${category || 'products'}`);

    res.json({ success: true, message: 'Monument deleted successfully', data: deletedMonument[0] });
  } catch (error) {
    console.error('Error deleting monument:', error);
    res.status(500).json({ success: false, error: 'Failed to delete monument' });
  }
});

module.exports = router;
