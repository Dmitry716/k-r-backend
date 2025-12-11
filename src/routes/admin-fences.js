const express = require('express');
const { eq, like, gte, lte, or } = require('drizzle-orm');
const { db } = require('../utils/db');
const { fences } = require('../models/schema');
const { getAppliedSeoData } = require('../utils/seo-helper');

const router = express.Router();

// GET /api/admin/fences - получить все ограды для админки
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let query = db.select().from(fences);

    // Фильтр по категории
    if (category && category !== 'all') {
      query = query.where(eq(fences.category, category));
    }

    // Поиск по названию
    if (search) {
      query = query.where(like(fences.name, `%${search}%`));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(fences.id);

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
    console.error('Ошибка получения оград для админки:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/admin/fences - создать новую ограду через админку
router.post('/', async (req, res) => {
  try {
    const { slug, name, price, textPrice, category, image, specifications, popular, description } = req.body;

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
    const seoData = await getAppliedSeoData(req.body, 'fences', category);

    const result = await db
      .insert(fences)
      .values({
        slug: autoSlug,
        name: name.trim(),
        price: price || null,
        textPrice: textPrice || null,
        category: category.trim(),
        image: image.trim(),
        specifications: specifications || {},
        popular: popular || false,
        description: description || null,
        seoTitle: seoData.seoTitle || null,
        seoDescription: seoData.seoDescription || null,
        seoKeywords: seoData.seoKeywords || null,
        ogImage: seoData.ogImage || null,
      })
      .returning();

    res.status(201).json({ success: true, fence: result[0] });
  } catch (error) {
    console.error('Ошибка создания ограды через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать ограду' });
  }
});

// PUT /api/admin/fences/:id - обновить ограду через админку
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, name, price, oldPrice, discount, textPrice, category, image, specifications, popular, description } = req.body;

    const updateData = {};
    if (slug !== undefined) updateData.slug = slug.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (oldPrice !== undefined) updateData.oldPrice = oldPrice;
    if (discount !== undefined) updateData.discount = discount;
    if (textPrice !== undefined) updateData.textPrice = textPrice;
    if (category !== undefined) updateData.category = category.trim();
    if (image !== undefined) updateData.image = image.trim();
    if (specifications !== undefined) updateData.specifications = specifications;
    if (popular !== undefined) updateData.popular = popular;
    if (description !== undefined) updateData.description = description;

    const result = await db
      .update(fences)
      .set(updateData)
      .where(eq(fences.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Ограда не найдена' });
    }

    res.json({ success: true, fence: result[0] });
  } catch (error) {
    console.error('Ошибка обновления ограды через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить ограду' });
  }
});

// DELETE /api/admin/fences/:id - удалить ограду через админку
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

    res.json({ success: true, message: 'Ограда успешно удалена', fence: result[0] });
  } catch (error) {
    console.error('Ошибка удаления ограды через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить ограду' });
  }
});

module.exports = router;