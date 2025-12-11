const express = require('express');
const router = express.Router();
const { db } = require('../utils/db');
const { eq } = require('drizzle-orm');
const {
  products,
  singleMonuments,
  doubleMonuments,
  cheapMonuments,
  crossMonuments,
  heartMonuments,
  compositeMonuments,
  europeMonuments,
  artisticMonuments,
  treeMonuments,
  complexMonuments,
  fences,
  accessories,
  landscape,
  campaigns,
  blogs,
} = require('../models/schema');

/**
 * PUT /api/admin/:entityType/:entityId/seo
 * Сохраняет SEO данные для конкретной сущности
 */
router.put('/:entityType/:entityId/seo', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { seoTitle, seoDescription, seoKeywords, ogImage } = req.body;

    // Валидация входных данных
    if (seoTitle && seoTitle.length > 255) {
      return res.status(400).json({ message: 'SEO title too long' });
    }
    if (seoDescription && seoDescription.length > 500) {
      return res.status(400).json({ message: 'SEO description too long' });
    }

    // Маппинг типов сущностей на таблицы (используются Drizzle таблицы)
    const tableMap = {
      'single-monuments': singleMonuments,
      'double-monuments': doubleMonuments,
      'cheap-monuments': cheapMonuments,
      'cross-monuments': crossMonuments,
      'heart-monuments': heartMonuments,
      'composite-monuments': compositeMonuments,
      'europe-monuments': europeMonuments,
      'artistic-monuments': artisticMonuments,
      'tree-monuments': treeMonuments,
      'complex-monuments': complexMonuments,
      fences,
      accessories,
      landscape,
      campaigns,
      blogs,
    };

    const table = tableMap[entityType];
    if (!table) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    // Подготавливаем данные для обновления
    // Отправляем все поля, даже если они пустые строки (для сохранения пустых значений)
    const updateData = {
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      ogImage: ogImage || null,
    };

    // Обновляем SEO поля
    const result = await db
      .update(table)
      .set(updateData)
      .where(eq(table.id, parseInt(entityId)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    res.json({
      message: 'SEO fields updated successfully',
      data: {
        id: result[0].id,
        seoTitle: result[0].seoTitle,
        seoDescription: result[0].seoDescription,
        seoKeywords: result[0].seoKeywords,
        ogImage: result[0].ogImage,
      },
    });
  } catch (error) {
    console.error('Error updating SEO fields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


/**
 * GET /api/admin/:entityType/:entityId/seo
 * Получает SEO данные для конкретной сущности
 */
router.get('/:entityType/:entityId/seo', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // Маппинг типов сущностей на таблицы (используются Drizzle таблицы)
    const tableMap = {
      'single-monuments': singleMonuments,
      'double-monuments': doubleMonuments,
      'cheap-monuments': cheapMonuments,
      'cross-monuments': crossMonuments,
      'heart-monuments': heartMonuments,
      'composite-monuments': compositeMonuments,
      'europe-monuments': europeMonuments,
      'artistic-monuments': artisticMonuments,
      'tree-monuments': treeMonuments,
      'complex-monuments': complexMonuments,
      fences,
      accessories,
      landscape,
      campaigns,
      blogs,
    };

    const table = tableMap[entityType];
    if (!table) {
      return res.status(400).json({ message: 'Invalid entity type' });
    }

    const result = await db
      .select()
      .from(table)
      .where(eq(table.id, parseInt(entityId)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    res.json({
      seoTitle: result[0].seoTitle || null,
      seoDescription: result[0].seoDescription || null,
      seoKeywords: result[0].seoKeywords || null,
      ogImage: result[0].ogImage || null,
    });
  } catch (error) {
    console.error('Error fetching SEO fields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
