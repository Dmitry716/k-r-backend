const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { pageSeo } = require('../models/schema');

const router = express.Router();

// GET / - получить все SEO страниц (для админки)
router.get('/', async (req, res) => {
  try {
    const allPageSeo = await db.select().from(pageSeo).orderBy(pageSeo.pageSlug);
    res.json({ success: true, data: allPageSeo });
  } catch (error) {
    console.error('Error fetching page SEO:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch page SEO' });
  }
});

// POST / - создать новое SEO страницы
router.post('/', async (req, res) => {
  try {
    const { pageSlug, pageTitle, seoTitle, seoDescription, seoKeywords, ogImage } = req.body;

    if (!pageSlug || !seoTitle || !seoDescription) {
      return res.status(400).json({
        success: false,
        error: 'pageSlug, seoTitle and seoDescription are required'
      });
    }

    // Проверяем, не существует ли уже SEO для этой страницы
    const existing = await db.select().from(pageSeo).where(eq(pageSeo.pageSlug, pageSlug));
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'SEO for this page already exists'
      });
    }

    const newPageSeo = await db.insert(pageSeo).values({
      pageSlug,
      pageTitle: pageTitle || pageSlug,
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywords || null,
      ogImage: ogImage || null
    }).returning();

    res.json({ success: true, data: newPageSeo[0] });
  } catch (error) {
    console.error('Error creating page SEO:', error);
    res.status(500).json({ success: false, error: 'Failed to create page SEO' });
  }
});

// PUT /:id - обновить SEO страницы
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pageSlug, pageTitle, seoTitle, seoDescription, seoKeywords, ogImage } = req.body;

    const updateData = {};
    if (pageSlug !== undefined) updateData.pageSlug = pageSlug;
    if (pageTitle !== undefined) updateData.pageTitle = pageTitle;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (ogImage !== undefined) updateData.ogImage = ogImage;

    const updated = await db.update(pageSeo)
      .set(updateData)
      .where(eq(pageSeo.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Page SEO not found' });
    }

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating page SEO:', error);
    res.status(500).json({ success: false, error: 'Failed to update page SEO' });
  }
});

// DELETE /:id - удалить SEO страницы
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await db.delete(pageSeo)
      .where(eq(pageSeo.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ success: false, error: 'Page SEO not found' });
    }

    res.json({ success: true, message: 'Page SEO deleted successfully' });
  } catch (error) {
    console.error('Error deleting page SEO:', error);
    res.status(500).json({ success: false, error: 'Failed to delete page SEO' });
  }
});

// GET /by-slug/:slug - Получить полные SEO данные конкретной страницы по slug
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await db.select().from(pageSeo).where(eq(pageSeo.pageSlug, slug));
    
    if (result.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Ошибка получения SEO данных страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения SEO данных страницы'
    });
  }
});

// GET /public/:slug - Получить SEO данные конкретной страницы по slug (публичный, минимум информации)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await db.select().from(pageSeo).where(eq(pageSeo.pageSlug, slug));
    
    if (result.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const seoData = result[0];
    
    res.json({
      success: true,
      data: {
        seoTitle: seoData.seoTitle,
        seoDescription: seoData.seoDescription,
        seoKeywords: seoData.seoKeywords,
        ogImage: seoData.ogImage
      }
    });
  } catch (error) {
    console.error('Ошибка получения SEO данных страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения SEO данных страницы'
    });
  }
});

module.exports = router;
