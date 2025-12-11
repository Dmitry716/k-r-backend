const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { accessories } = require('../models/schema');

const router = express.Router();

// GET /api/accessories - получить все аксессуары
router.get('/', async (req, res) => {
  try {
    const { slug, category, limit = 200, offset = 0 } = req.query;

    if (slug) {
      // Поиск по slug
      const accessory = await db.select().from(accessories).where(eq(accessories.slug, slug)).limit(1);
      
      if (accessory.length === 0) {
        return res.status(404).json({ success: false, error: 'Аксессуар не найден' });
      }
      
      return res.json({ success: true, data: accessory[0] });
    }

    // Получить все аксессуары с фильтрацией
    let query = db.select().from(accessories);

    if (category) {
      query = query.where(eq(accessories.category, category));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(accessories.id);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Ошибка получения аксессуаров:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/accessories - создать новый аксессуар
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
      .insert(accessories)
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

    res.status(201).json({ success: true, accessory: result[0] });
  } catch (error) {
    console.error('Ошибка создания аксессуара:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать аксессуар' });
  }
});

// PUT /api/accessories/:id - обновить аксессуар
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
      .update(accessories)
      .set(updateData)
      .where(eq(accessories.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Аксессуар не найден' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка обновления аксессуара:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить аксессуар' });
  }
});

// DELETE /api/accessories/:id - удалить аксессуар
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(accessories)
      .where(eq(accessories.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Аксессуар не найден' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Ошибка удаления аксессуара:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить аксессуар' });
  }
});

// GET /api/accessories/:category/:slug - получить аксессуар по категории и slug
router.get('/:category/:slug', async (req, res) => {
  try {
    const { category, slug } = req.params;

    const accessory = await db.select().from(accessories)
      .where(eq(accessories.slug, slug));

    if (accessory.length === 0) {
      return res.status(404).json({ success: false, error: 'Accessory not found' });
    }

    res.json({ success: true, data: accessory[0] });
  } catch (error) {
    console.error('Error fetching accessory by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accessory' });
  }
});

module.exports = router;