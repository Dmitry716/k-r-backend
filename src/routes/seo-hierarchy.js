const express = require('express');
const { eq, and } = require('drizzle-orm');
const { db } = require('../utils/db');
const { seoTemplates } = require('../models/schema');

const router = express.Router();

/**
 * GET /api/seo-hierarchy/:entityType/:categoryKey
 * Получить SEO данные с применённой иерархией:
 * 1. Если есть entity-specific SEO - вернуть его
 * 2. Если нет - вернуть template для этой категории
 * 3. Если нет template - вернуть null/defaults
 */
router.get('/:entityType/:categoryKey', async (req, res) => {
  try {
    const { entityType, categoryKey } = req.params;

    // Ищем шаблон для этой категории и типа сущности
    const template = await db
      .select()
      .from(seoTemplates)
      .where(
        and(
          eq(seoTemplates.entityType, entityType),
          eq(seoTemplates.categoryKey, categoryKey)
        )
      )
      .limit(1);

    if (template.length > 0) {
      res.json({
        success: true,
        template: {
          id: template[0].id,
          seoTitle: template[0].seoTitle,
          seoDescription: template[0].seoDescription,
          seoKeywords: template[0].seoKeywords,
          ogImage: template[0].ogImage
        }
      });
    } else {
      res.json({
        success: true,
        template: null
      });
    }
  } catch (error) {
    console.error('Ошибка получения SEO иерархии:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения SEO иерархии' });
  }
});

module.exports = router;
