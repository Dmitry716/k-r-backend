const express = require('express');
const { eq, like, gte, lte, or } = require('drizzle-orm');
const { db } = require('../utils/db');
const { blogs } = require('../models/schema');
const { getAppliedSeoData } = require('../utils/seo-helper');

const router = express.Router();

// GET /api/admin/blogs - получить все блоги для админки
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let query = db.select().from(blogs);

    // Поиск по названию
    if (search) {
      query = query.where(like(blogs.title, `%${search}%`));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(blogs.id);

    res.json({ 
      success: true, 
      blogs: result,
      count: result.length 
    });
  } catch (error) {
    console.error('Ошибка получения блогов для админки:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/admin/blogs - создать новый блог через админку
router.post('/', async (req, res) => {
  try {
    const { slug, title, description, content, metaTitle, metaDescription, featuredImage, images, blocks, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title и content обязательны'
      });
    }

    // Автогенерация slug если не указан
    const autoSlug = slug || title.toLowerCase()
      .replace(/[^a-zA-Z0-9а-яё\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Применяем SEO шаблон если он существует
    const seoData = await getAppliedSeoData(req.body, 'blogs', 'blogs');

    const result = await db
      .insert(blogs)
      .values({
        slug: autoSlug,
        title: title.trim(),
        description: description || null,
        content: content.trim(),
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        featuredImage: featuredImage || null,
        images: images || [],
        blocks: blocks || [],
        tags: tags || [],
        seoTitle: seoData.seoTitle || null,
        seoDescription: seoData.seoDescription || null,
        seoKeywords: seoData.seoKeywords || null,
        ogImage: seoData.ogImage || null,
      })
      .returning();

    res.status(201).json({ success: true, blog: result[0] });
  } catch (error) {
    console.error('Ошибка создания блога через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать блог' });
  }
});

// PUT /api/admin/blogs/:id - обновить блог через админку
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, description, content, metaTitle, metaDescription, featuredImage, images, blocks, tags } = req.body;

    const updateData = { updatedAt: new Date() };
    if (slug !== undefined) updateData.slug = slug.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content.trim();
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (images !== undefined) updateData.images = images;
    if (blocks !== undefined) updateData.blocks = blocks;
    if (tags !== undefined) updateData.tags = tags;

    const result = await db
      .update(blogs)
      .set(updateData)
      .where(eq(blogs.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Блог не найден' });
    }

    res.json({ success: true, blog: result[0] });
  } catch (error) {
    console.error('Ошибка обновления блога через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить блог' });
  }
});

// DELETE /api/admin/blogs/:id - удалить блог через админку
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(blogs)
      .where(eq(blogs.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Блог не найден' });
    }

    res.json({ success: true, message: 'Блог успешно удален', blog: result[0] });
  } catch (error) {
    console.error('Ошибка удаления блога через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить блог' });
  }
});

module.exports = router;