const express = require('express');
const { eq, like, gte, lte, or } = require('drizzle-orm');
const { db } = require('../utils/db');
const { fences } = require('../models/schema');

const router = express.Router();

// GET /api/fences - получить все ограды или найти по slug
router.get('/', async (req, res) => {
  try {
    const { slug, category, limit = 200, offset = 0 } = req.query;

    if (slug) {
      // Поиск по slug
      const fence = await db.select().from(fences).where(eq(fences.slug, slug)).limit(1);
      
      if (fence.length === 0) {
        return res.status(404).json({ success: false, error: 'Ограда не найдена' });
      }
      
      // Преобразуем price в число
      const transformed = {
        ...fence[0],
        price: fence[0].price ? parseFloat(fence[0].price) : null,
      };
      
      return res.json({ success: true, data: transformed });
    }

    // Получить все ограды с фильтрацией
    let query = db.select().from(fences);

    if (category) {
      query = query.where(eq(fences.category, category));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(fences.id);

    // Преобразуем данные
    const transformed = result.map(item => ({
      ...item,
      price: item.price ? parseFloat(item.price) : null,
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Ошибка получения оград:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/fences - создать новую ограду
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
      .insert(fences)
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

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка создания ограды:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать ограду' });
  }
});

// PUT /api/fences/:id - обновить ограду
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
      .update(fences)
      .set(updateData)
      .where(eq(fences.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Ограда не найдена' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка обновления ограды:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить ограду' });
  }
});

// DELETE /api/fences/:id - удалить ограду
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(fences)
      .where(eq(fences.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Ограда не найдена' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка удаления ограды:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить ограду' });
  }
});

// GET /api/fences/granite - получить все гранитные ограды
router.get('/granite', async (req, res) => {
  try {
    const { limit = 200, offset = 0 } = req.query;

    const result = await db.select()
      .from(fences)
      .where(eq(fences.category, 'Гранитные ограды'))
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(fences.id);

    // Преобразуем данные
    const transformed = result.map(item => ({
      ...item,
      price: item.price ? parseFloat(item.price) : null,
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Ошибка получения гранитных оград:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/fences/metal - получить все металлические ограды
router.get('/metal', async (req, res) => {
  try {
    const { limit = 200, offset = 0 } = req.query;

    const result = await db.select()
      .from(fences)
      .where(eq(fences.category, 'Металлические ограды'))
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(fences.id);

    // Преобразуем данные
    const transformed = result.map(item => ({
      ...item,
      price: item.price ? parseFloat(item.price) : null,
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Ошибка получения металлических оград:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/fences/polymer - получить все полимерные ограды
router.get('/polymer', async (req, res) => {
  try {
    const { limit = 200, offset = 0 } = req.query;

    const result = await db.select()
      .from(fences)
      .where(eq(fences.category, 'С полимерным покрытием'))
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(fences.id);

    // Преобразуем данные
    const transformed = result.map(item => ({
      ...item,
      price: item.price ? parseFloat(item.price) : null,
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Ошибка получения полимерных оград:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/fences/:category/:slug - получить ограду по категории и slug
router.get('/:category/:slug', async (req, res) => {
  try {
    const { category, slug } = req.params;

    const fence = await db.select().from(fences)
      .where(eq(fences.slug, slug));

    if (fence.length === 0) {
      return res.status(404).json({ success: false, error: 'Fence not found' });
    }

    res.json({ success: true, data: fence[0] });
  } catch (error) {
    console.error('Error fetching fence by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fence' });
  }
});

module.exports = router;