const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { pageSeo } = require('../models/schema');

const router = express.Router();

// Получить все SEO данные страниц
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(pageSeo).orderBy(pageSeo.pageTitle);
    
    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        pageSlug: row.pageSlug,
        pageTitle: row.pageTitle,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        seoKeywords: row.seoKeywords,
        ogImage: row.ogImage,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }))
    });
  } catch (error) {
    console.error('Ошибка получения SEO данных:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения SEO данных'
    });
  }
});

// Получить SEO данные конкретной страницы по slug
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

    const seoData = result[0];
    
    res.json({
      success: true,
      data: {
        id: seoData.id,
        pageSlug: seoData.pageSlug,
        pageTitle: seoData.pageTitle,
        seoTitle: seoData.seoTitle,
        seoDescription: seoData.seoDescription,
        seoKeywords: seoData.seoKeywords,
        ogImage: seoData.ogImage,
        createdAt: seoData.createdAt,
        updatedAt: seoData.updatedAt
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

// Создать новые SEO данные страницы
router.post('/', async (req, res) => {
  try {
    const {
      pageSlug,
      pageTitle,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage
    } = req.body;

    // Валидация обязательных полей
    if (!pageSlug || !pageTitle || !seoTitle || !seoDescription) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля: pageSlug, pageTitle, seoTitle, seoDescription'
      });
    }

    // Валидация длины SEO title (макс 60 символов)
    if (seoTitle.length > 60) {
      return res.status(400).json({
        success: false,
        error: 'SEO Title не должен превышать 60 символов'
      });
    }

    // Валидация длины description (макс 160 символов)
    if (seoDescription.length > 160) {
      return res.status(400).json({
        success: false,
        error: 'SEO Description не должна превышать 160 символов'
      });
    }

    // Проверим, есть ли уже SEO данные для этой страницы
    const existingCheck = await db.select().from(pageSeo).where(eq(pageSeo.pageSlug, pageSlug));
    
    if (existingCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'SEO данные для этой страницы уже существуют'
      });
    }

    const result = await db.insert(pageSeo).values({
      pageSlug,
      pageTitle,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage
    }).returning();

    const newSeoData = result[0];

    res.json({
      success: true,
      data: {
        id: newSeoData.id,
        pageSlug: newSeoData.pageSlug,
        pageTitle: newSeoData.pageTitle,
        seoTitle: newSeoData.seoTitle,
        seoDescription: newSeoData.seoDescription,
        seoKeywords: newSeoData.seoKeywords,
        ogImage: newSeoData.ogImage,
        createdAt: newSeoData.createdAt,
        updatedAt: newSeoData.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка создания SEO данных страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания SEO данных страницы'
    });
  }
});

// Обновить SEO данные страницы
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pageSlug,
      pageTitle,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage
    } = req.body;

    // Валидация обязательных полей
    if (!pageSlug || !pageTitle || !seoTitle || !seoDescription) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля'
      });
    }

    // Валидация длины SEO title
    if (seoTitle && seoTitle.length > 60) {
      return res.status(400).json({
        success: false,
        error: 'SEO Title не должен превышать 60 символов'
      });
    }

    // Валидация длины description
    if (seoDescription && seoDescription.length > 160) {
      return res.status(400).json({
        success: false,
        error: 'SEO Description не должна превышать 160 символов'
      });
    }

    const updateData = {
      pageSlug,
      pageTitle,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage,
      updatedAt: new Date()
    };

    const result = await db.update(pageSeo)
      .set(updateData)
      .where(eq(pageSeo.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SEO данные страницы не найдены'
      });
    }

    const updatedSeoData = result[0];

    res.json({
      success: true,
      data: {
        id: updatedSeoData.id,
        pageSlug: updatedSeoData.pageSlug,
        pageTitle: updatedSeoData.pageTitle,
        seoTitle: updatedSeoData.seoTitle,
        seoDescription: updatedSeoData.seoDescription,
        seoKeywords: updatedSeoData.seoKeywords,
        ogImage: updatedSeoData.ogImage,
        createdAt: updatedSeoData.createdAt,
        updatedAt: updatedSeoData.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка обновления SEO данных страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления SEO данных страницы'
    });
  }
});

// Удалить SEO данные страницы
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.delete(pageSeo)
      .where(eq(pageSeo.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SEO данные страницы не найдены'
      });
    }

    res.json({
      success: true,
      message: 'SEO данные страницы удалены'
    });
  } catch (error) {
    console.error('Ошибка удаления SEO данных страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка удаления SEO данных страницы'
    });
  }
});

module.exports = router;
