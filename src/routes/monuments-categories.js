const express = require('express');
const { eq, like, gte, lte, or, sql } = require('drizzle-orm');
const { db } = require('../utils/db');
const { 
  singleMonuments, doubleMonuments, cheapMonuments, crossMonuments, heartMonuments,
  compositeMonuments, europeMonuments, artisticMonuments, treeMonuments, 
  complexMonuments
} = require('../models/schema');

const router = express.Router();

// Маппинг категорий на таблицы
const categoryMapping = {
  'single': { table: singleMonuments, name: 'одиночные' },
  'double': { table: doubleMonuments, name: 'двойные' },
  'cheap': { table: cheapMonuments, name: 'дешевые' },
  'cross': { table: crossMonuments, name: 'кресты' },
  'heart': { table: heartMonuments, name: 'сердца' },
  'composite': { table: compositeMonuments, name: 'составные' },
  'europe': { table: europeMonuments, name: 'европейские' },
  'artistic': { table: artisticMonuments, name: 'художественные' },
  'tree': { table: treeMonuments, name: 'деревья' },
  'complex': { table: complexMonuments, name: 'комплексные' }
};

// GET /api/monuments-categories/:category - получить памятники определенной категории
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = '50', offset = '0', search = '', minPrice, maxPrice, height } = req.query;

    // Проверяем существование категории
    const categoryConfig = categoryMapping[category];
    if (!categoryConfig) {
      return res.status(404).json({ 
        error: 'Категория не найдена',
        availableCategories: Object.keys(categoryMapping)
      });
    }

    // Строим запрос с фильтрами
    let query = db.select().from(categoryConfig.table);

    // Применяем фильтры
    if (search) {
      query = query.where(
        or(
          like(categoryConfig.table.name, `%${search}%`),
          like(categoryConfig.table.description, `%${search}%`)
        )
      );
    }

    if (minPrice) {
      query = query.where(gte(categoryConfig.table.price, minPrice));
    }

    if (maxPrice) {
      query = query.where(lte(categoryConfig.table.price, maxPrice));
    }

    if (height) {
      query = query.where(eq(categoryConfig.table.height, height));
    }

    // Применяем лимит и смещение
    query = query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(categoryConfig.table.id);

    const monuments = await query;

    res.json({
      category: categoryConfig.name,
      total: monuments.length,
      data: monuments
    });

  } catch (error) {
    console.error('Ошибка получения памятников категории:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/monuments-categories - получить список всех категорий
router.get('/', async (req, res) => {
  try {
    const categories = [];
    
    for (const [key, config] of Object.entries(categoryMapping)) {
      try {
        const count = await db.select({ count: sql`count(*)` }).from(config.table);
        categories.push({
          key,
          name: config.name,
          count: parseInt(count[0].count)
        });
      } catch (error) {
        categories.push({
          key,
          name: config.name,
          count: 0
        });
      }
    }

    res.json({
      categories,
      total: categories.reduce((sum, cat) => sum + cat.count, 0)
    });

  } catch (error) {
    console.error('Ошибка получения категорий памятников:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/monuments-categories/:category/:id - получить конкретный памятник
router.get('/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;

    const categoryConfig = categoryMapping[category];
    if (!categoryConfig) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    const monument = await db.select()
      .from(categoryConfig.table)
      .where(eq(categoryConfig.table.id, parseInt(id)))
      .limit(1);

    if (monument.length === 0) {
      return res.status(404).json({ error: 'Памятник не найден' });
    }

    res.json(monument[0]);

  } catch (error) {
    console.error('Ошибка получения памятника:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;