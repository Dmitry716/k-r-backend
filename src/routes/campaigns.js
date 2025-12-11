const express = require('express');
const { db } = require('../utils/db');
const { campaigns } = require('../models/schema');
const { eq, like, and, gte, lte } = require('drizzle-orm');

const router = express.Router();

// GET /api/campaigns - получить все кампании
router.get('/', async (req, res) => {
  try {
    const { 
      active,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(campaigns);
    const conditions = [];

    // Фильтр по активности
    if (active === 'true') {
      conditions.push(eq(campaigns.isActive, true));
    } else if (active === 'false') {
      conditions.push(eq(campaigns.isActive, false));
    }

    // Поиск по названию
    if (search) {
      conditions.push(like(campaigns.title, `%${search}%`));
    }

    // Применяем условия
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Применяем лимит и смещение
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    query = query.orderBy(campaigns.id);

    const allCampaigns = await query;

    res.json({ success: true, data: allCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/by-slug/:slug - получить кампанию по slug (для SEO метаданных)
// ВНИМАНИЕ: этот маршрут должен быть ДО /:id чтобы избежать конфликта
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const campaign = await db.select().from(campaigns)
      .where(eq(campaigns.slug, slug));

    if (campaign.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign[0] });
  } catch (error) {
    console.error('Error fetching campaign by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign by slug' });
  }
});

// GET /api/campaigns/:id - получить кампанию по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await db.select().from(campaigns)
      .where(eq(campaigns.id, parseInt(id)));

    if (campaign.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign[0] });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - создать новую кампанию
router.post('/', async (req, res) => {
  try {
    const { title, slug, description, content, metaTitle, metaDescription, featuredImage, images, blocks, tags, products, seoTitle, seoDescription, seoKeywords, ogImage, ...rest } = req.body;

    // Базовая валидация
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Campaign title is required'
      });
    }

    const newCampaign = await db.insert(campaigns).values({
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
      products: products || [],
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      seoKeywords: seoKeywords || undefined,
      ogImage: ogImage || undefined,
      ...rest
    }).returning();

    res.json({ success: true, data: newCampaign[0] });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// PUT /api/campaigns/:id - обновить кампанию
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, content, metaTitle, metaDescription, featuredImage, images, blocks, tags, products, seoTitle, seoDescription, seoKeywords, ogImage, ...rest } = req.body;

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
    if (products !== undefined) updateData.products = products;
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

    const updatedCampaign = await db.update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();

    if (updatedCampaign.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, data: updatedCampaign[0] });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id - удалить кампанию
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCampaign = await db.delete(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();

    if (deletedCampaign.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
});

module.exports = router;