const express = require('express');
const { db } = require('../utils/db');
const { blogs } = require('../models/schema');
const { eq, like, and } = require('drizzle-orm');

const router = express.Router();

// GET /api/blogs - получить все блоги
router.get('/', async (req, res) => {
  try {
    const {
      search,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(blogs);
    const conditions = [];

    // Поиск по названию
    if (search) {
      conditions.push(like(blogs.title, `%${search}%`));
    }

    // Применяем условия
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Применяем лимит и смещение
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    query = query.orderBy(blogs.id);

    const allBlogs = await query;

    res.json({ success: true, data: allBlogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blogs' });
  }
});

// GET /api/blogs/by-slug/:slug - получить блог по slug (для SEO метаданных)
// ВНИМАНИЕ: этот маршрут должен быть ДО /:id чтобы избежать конфликта
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await db.select().from(blogs)
      .where(eq(blogs.slug, slug));

    if (blog.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    res.json({ success: true, data: blog[0] });
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blog by slug' });
  }
});

// GET /api/blogs/:id - получить блог по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await db.select().from(blogs)
      .where(eq(blogs.id, parseInt(id)));

    if (blog.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    res.json({ success: true, data: blog[0] });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blog' });
  }
});

// POST /api/blogs - создать новый блог
router.post('/', async (req, res) => {
  try {
    const { title, slug, description, content, metaTitle, metaDescription, featuredImage, images, blocks, tags, seoTitle, seoDescription, seoKeywords, ogImage, ...rest } = req.body;

    // Базовая валидация
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Blog title and content are required'
      });
    }

    const newBlog = await db.insert(blogs).values({
      title: title.trim(),
      slug: slug || undefined,
      description: description || undefined,
      content: content || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      featuredImage: featuredImage || undefined,
      images: images || [],
      blocks: blocks || [],
      tags: tags || [],
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      seoKeywords: seoKeywords || undefined,
      ogImage: ogImage || undefined,
      ...rest
    }).returning();

    res.json({ success: true, data: newBlog[0] });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id - обновить блог
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, content, metaTitle, metaDescription, featuredImage, images, blocks, tags, seoTitle, seoDescription, seoKeywords, ogImage, ...rest } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (images !== undefined) updateData.images = images;
    if (blocks !== undefined) updateData.blocks = blocks;
    if (tags !== undefined) updateData.tags = tags;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (ogImage !== undefined) updateData.ogImage = ogImage;

    // Добавляем остальные поля
    Object.keys(rest).forEach(key => {
      if (rest[key] !== undefined) {
        updateData[key] = rest[key];
      }
    });

    const updatedBlog = await db.update(blogs)
      .set(updateData)
      .where(eq(blogs.id, parseInt(id)))
      .returning();

    if (updatedBlog.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    res.json({ success: true, data: updatedBlog[0] });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, error: 'Failed to update blog' });
  }
});

// DELETE /api/blogs/:id - удалить блог
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBlog = await db.delete(blogs)
      .where(eq(blogs.id, parseInt(id)))
      .returning();

    if (deletedBlog.length === 0) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }

    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ success: false, error: 'Failed to delete blog' });
  }
});

module.exports = router;