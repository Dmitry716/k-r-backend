const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { landscape } = require('../models/schema');

const router = express.Router();

// GET /api/landscape - получить все элементы благоустройства
router.get('/', async (req, res) => {
  try {
    const { slug, category, limit = 200, offset = 0 } = req.query;

    if (slug) {
      // Поиск по slug
      const item = await db.select().from(landscape).where(eq(landscape.slug, slug)).limit(1);
      
      if (item.length === 0) {
        return res.status(404).json({ success: false, error: 'Элемент благоустройства не найден' });
      }
      
      return res.json({ success: true, data: item[0] });
    }

    // Получить все элементы благоустройства с фильтрацией
    let query = db.select().from(landscape);

    if (category) {
      query = query.where(eq(landscape.category, category));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(landscape.id);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Ошибка получения благоустройства:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/landscape - создать новый элемент благоустройства
router.post('/', async (req, res) => {
  try {
    const { slug, name, price, textPrice, category, image, specifications, seoTitle, seoDescription, seoKeywords, ogImage } = req.body;

    if (!slug || !name || !category || !image) {
      return res.status(400).json({
        success: false,
        error: 'Slug, name, category и image обязательны'
      });
    }

    const result = await db
      .insert(landscape)
      .values({
        slug: slug.trim(),
        name: name.trim(),
        price: price || undefined,
        textPrice: textPrice,
        category: category.trim(),
        image: image.trim(),
        specifications: specifications || {},
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        seoKeywords: seoKeywords || undefined,
        ogImage: ogImage || undefined,
      })
      .returning();

    res.status(201).json({ success: true, landscape: result[0] });
  } catch (error) {
    console.error('Ошибка создания элемента благоустройства:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать элемент благоустройства' });
  }
});

// PUT /api/landscape/:id - обновить элемент благоустройства
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name, price, textPrice, category, image, specifications, seoTitle, seoDescription, seoKeywords, ogImage } = req.body;

    const updateData = {};
    if (slug) updateData.slug = slug.trim();
    if (name) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (textPrice !== undefined) updateData.textPrice = textPrice;
    if (category) updateData.category = category.trim();
    if (image) updateData.image = image.trim();
    if (specifications) updateData.specifications = specifications;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (ogImage !== undefined) updateData.ogImage = ogImage;

    const result = await db
      .update(landscape)
      .set(updateData)
      .where(eq(landscape.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Элемент благоустройства не найден' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка обновления благоустройства:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить элемент благоустройства' });
  }
});

// DELETE /api/landscape/:id - удалить элемент благоустройства
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(landscape)
      .where(eq(landscape.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Элемент благоустройства не найден' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка удаления благоустройства:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить элемент благоустройства' });
  }
});

// GET /api/landscape/:category/:slug - получить элемент благоустройства по категории и slug
router.get('/:category/:slug', async (req, res) => {
  try {
    const { category, slug } = req.params;

    const item = await db.select().from(landscape)
      .where(eq(landscape.slug, slug));

    if (item.length === 0) {
      return res.status(404).json({ success: false, error: 'Landscape item not found' });
    }

    res.json({ success: true, data: item[0] });
  } catch (error) {
    console.error('Error fetching landscape item by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch landscape item' });
  }
});

module.exports = router;