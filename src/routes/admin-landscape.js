const express = require('express');
const { eq, like, gte, lte, or } = require('drizzle-orm');
const { db } = require('../utils/db');
const { landscape } = require('../models/schema');
const { getAppliedSeoData } = require('../utils/seo-helper');

const router = express.Router();

// GET /api/admin/landscape - получить все ландшафтные элементы для админки
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let query = db.select().from(landscape);

    // Фильтр по категории
    if (category && category !== 'all') {
      query = query.where(eq(landscape.category, category));
    }

    // Поиск по названию
    if (search) {
      query = query.where(like(landscape.name, `%${search}%`));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(landscape.id);

    // Преобразуем данные для админки
    const transformed = result.map(item => ({
      ...item,
      price: item.price ? parseFloat(item.price) : null,
    }));

    res.json({ 
      success: true, 
      products: transformed,
      category: category || 'all',
      count: transformed.length 
    });
  } catch (error) {
    console.error('Ошибка получения ландшафтных элементов для админки:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/admin/landscape - создать новый ландшафтный элемент через админку
router.post('/', async (req, res) => {
  try {
    const { slug, name, price, textPrice, category, image, specifications } = req.body;

    if (!name || !category || !image) {
      return res.status(400).json({
        success: false,
        error: 'Name, category и image обязательны'
      });
    }

    // Автогенерация slug если не указан
    const autoSlug = slug || name.toLowerCase()
      .replace(/[^a-zA-Z0-9а-яё\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Применяем SEO шаблон если он существует
    const seoData = await getAppliedSeoData(req.body, 'landscape', category);

    const result = await db
      .insert(landscape)
      .values({
        slug: autoSlug,
        name: name.trim(),
        price: price || null,
        textPrice: textPrice || null,
        category: category.trim(),
        image: image.trim(),
        specifications: specifications || {},
        seoTitle: seoData.seoTitle || null,
        seoDescription: seoData.seoDescription || null,
        seoKeywords: seoData.seoKeywords || null,
        ogImage: seoData.ogImage || null,
      })
      .returning();

    res.status(201).json({ success: true, landscape: result[0] });
  } catch (error) {
    console.error('Ошибка создания ландшафтного элемента через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать ландшафтный элемент' });
  }
});

// PUT /api/admin/landscape/:id - обновить ландшафтный элемент через админку
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name, price, textPrice, category, image, specifications } = req.body;

    const updateData = {};
    if (slug !== undefined) updateData.slug = slug.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (textPrice !== undefined) updateData.textPrice = textPrice;
    if (category !== undefined) updateData.category = category.trim();
    if (image !== undefined) updateData.image = image.trim();
    if (specifications !== undefined) updateData.specifications = specifications;

    const result = await db
      .update(landscape)
      .set(updateData)
      .where(eq(landscape.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Ландшафтный элемент не найден' });
    }

    res.json({ success: true, landscape: result[0] });
  } catch (error) {
    console.error('Ошибка обновления ландшафтного элемента через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить ландшафтный элемент' });
  }
});

// DELETE /api/admin/landscape/:id - удалить ландшафтный элемент через админку
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(landscape)
      .where(eq(landscape.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Ландшафтный элемент не найден' });
    }

    res.json({ success: true, message: 'Ландшафтный элемент успешно удален', landscape: result[0] });
  } catch (error) {
    console.error('Ошибка удаления ландшафтного элемента через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить ландшафтный элемент' });
  }
});

module.exports = router;