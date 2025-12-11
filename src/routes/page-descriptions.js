const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { pageDescriptions } = require('../models/schema');

const router = express.Router();

// Получить описание страницы по slug для отображения на фронте
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await db.select().from(pageDescriptions).where(eq(pageDescriptions.pageSlug, slug));
    
    if (result.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const pageDescription = result[0];
    
    res.json({
      success: true,
      data: {
        id: pageDescription.id,
        pageSlug: pageDescription.pageSlug,
        pageTitle: pageDescription.pageTitle,
        blocks: pageDescription.blocks,
        createdAt: pageDescription.createdAt,
        updatedAt: pageDescription.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка получения описания страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения описания страницы'
    });
  }
});

module.exports = router;