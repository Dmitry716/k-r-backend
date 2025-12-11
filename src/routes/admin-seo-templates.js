const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { seoTemplates } = require('../models/schema');

const router = express.Router();

// Получить все SEO шаблоны
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(seoTemplates).orderBy(seoTemplates.entityType, seoTemplates.categoryName);
    
    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        categoryKey: row.categoryKey,
        categoryName: row.categoryName,
        entityType: row.entityType,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        seoKeywords: row.seoKeywords,
        ogImage: row.ogImage,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }))
    });
  } catch (error) {
    console.error('Ошибка получения SEO шаблонов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения SEO шаблонов'
    });
  }
});

// Получить SEO шаблон по categoryKey
router.get('/:categoryKey', async (req, res) => {
  try {
    const { categoryKey } = req.params;
    
    const result = await db.select().from(seoTemplates).where(eq(seoTemplates.categoryKey, categoryKey));
    
    if (result.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Шаблон не найден'
      });
    }

    const template = result[0];
    
    res.json({
      success: true,
      data: {
        id: template.id,
        categoryKey: template.categoryKey,
        categoryName: template.categoryName,
        entityType: template.entityType,
        seoTitle: template.seoTitle,
        seoDescription: template.seoDescription,
        seoKeywords: template.seoKeywords,
        ogImage: template.ogImage,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка получения SEO шаблона:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения SEO шаблона'
    });
  }
});

// Создать новый SEO шаблон
router.post('/', async (req, res) => {
  try {
    const {
      categoryKey,
      categoryName,
      entityType,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage
    } = req.body;

    // Валидация обязательных полей
    if (!categoryKey || !categoryName || !entityType || !seoTitle || !seoDescription) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля: categoryKey, categoryName, entityType, seoTitle, seoDescription'
      });
    }

    // Валидация длины
    if (seoTitle.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'SEO Title не должен превышать 255 символов'
      });
    }

    if (seoDescription.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'SEO Description не должна превышать 500 символов'
      });
    }

    // Проверим, есть ли уже шаблон с этим categoryKey
    const existingCheck = await db.select().from(seoTemplates).where(eq(seoTemplates.categoryKey, categoryKey));
    
    if (existingCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Шаблон с этим categoryKey уже существует'
      });
    }

    const result = await db.insert(seoTemplates).values({
      categoryKey,
      categoryName,
      entityType,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage
    }).returning();

    const newTemplate = result[0];

    res.json({
      success: true,
      data: {
        id: newTemplate.id,
        categoryKey: newTemplate.categoryKey,
        categoryName: newTemplate.categoryName,
        entityType: newTemplate.entityType,
        seoTitle: newTemplate.seoTitle,
        seoDescription: newTemplate.seoDescription,
        seoKeywords: newTemplate.seoKeywords,
        ogImage: newTemplate.ogImage,
        createdAt: newTemplate.createdAt,
        updatedAt: newTemplate.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка создания SEO шаблона:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания SEO шаблона'
    });
  }
});

// Обновить SEO шаблон
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryName,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage
    } = req.body;

    // Валидация обязательных полей
    if (!categoryName || !seoTitle || !seoDescription) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля: categoryName, seoTitle, seoDescription'
      });
    }

    // Валидация длины
    if (seoTitle.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'SEO Title не должен превышать 255 символов'
      });
    }

    if (seoDescription.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'SEO Description не должна превышать 500 символов'
      });
    }

    const updateData = {
      categoryName,
      seoTitle,
      seoDescription,
      seoKeywords,
      ogImage,
      updatedAt: new Date()
    };

    const result = await db.update(seoTemplates)
      .set(updateData)
      .where(eq(seoTemplates.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SEO шаблон не найден'
      });
    }

    const updatedTemplate = result[0];

    res.json({
      success: true,
      data: {
        id: updatedTemplate.id,
        categoryKey: updatedTemplate.categoryKey,
        categoryName: updatedTemplate.categoryName,
        entityType: updatedTemplate.entityType,
        seoTitle: updatedTemplate.seoTitle,
        seoDescription: updatedTemplate.seoDescription,
        seoKeywords: updatedTemplate.seoKeywords,
        ogImage: updatedTemplate.ogImage,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка обновления SEO шаблона:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления SEO шаблона'
    });
  }
});

// Удалить SEO шаблон
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.delete(seoTemplates)
      .where(eq(seoTemplates.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SEO шаблон не найден'
      });
    }

    res.json({
      success: true,
      message: 'SEO шаблон удален'
    });
  } catch (error) {
    console.error('Ошибка удаления SEO шаблона:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка удаления SEO шаблона'
    });
  }
});

module.exports = router;
