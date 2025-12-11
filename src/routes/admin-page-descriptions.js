const express = require('express');
const { eq } = require('drizzle-orm');
const { db } = require('../utils/db');
const { pageDescriptions } = require('../models/schema');

const router = express.Router();

// Получить все описания страниц
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(pageDescriptions).orderBy(pageDescriptions.pageTitle);
    
    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        pageSlug: row.pageSlug,
        pageTitle: row.pageTitle,
        blocks: row.blocks,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }))
    });
  } catch (error) {
    console.error('Ошибка получения описаний страниц:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения описаний страниц'
    });
  }
});

// Получить описание конкретной страницы по slug
router.get('/by-slug/:slug', async (req, res) => {
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

// Создать новое описание страницы
router.post('/', async (req, res) => {
  try {
    const { pageSlug, pageTitle, blocks } = req.body;

    if (!pageSlug || !pageTitle || blocks === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля'
      });
    }

    // Проверим, есть ли уже описание для этой страницы
    const existingCheck = await db.select().from(pageDescriptions).where(eq(pageDescriptions.pageSlug, pageSlug));
    
    if (existingCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Описание для этой страницы уже существует'
      });
    }

    const result = await db.insert(pageDescriptions).values({
      pageSlug,
      pageTitle,
      blocks
    }).returning();

    const newDescription = result[0];

    res.json({
      success: true,
      data: {
        id: newDescription.id,
        pageSlug: newDescription.pageSlug,
        pageTitle: newDescription.pageTitle,
        blocks: newDescription.blocks,
        createdAt: newDescription.createdAt,
        updatedAt: newDescription.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка создания описания страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания описания страницы'
    });
  }
});

// Обновить описание страницы
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pageSlug, pageTitle, blocks } = req.body;

    if (!pageSlug || !pageTitle || blocks === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля'
      });
    }

    const result = await db.update(pageDescriptions)
      .set({
        pageSlug,
        pageTitle,
        blocks,
        updatedAt: new Date()
      })
      .where(eq(pageDescriptions.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Описание страницы не найдено'
      });
    }

    const updatedDescription = result[0];

    res.json({
      success: true,
      data: {
        id: updatedDescription.id,
        pageSlug: updatedDescription.pageSlug,
        pageTitle: updatedDescription.pageTitle,
        blocks: updatedDescription.blocks,
        createdAt: updatedDescription.createdAt,
        updatedAt: updatedDescription.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка обновления описания страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления описания страницы'
    });
  }
});

// Удалить описание страницы
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.delete(pageDescriptions)
      .where(eq(pageDescriptions.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Описание страницы не найдено'
      });
    }

    res.json({
      success: true,
      message: 'Описание страницы удалено'
    });
  } catch (error) {
    console.error('Ошибка удаления описания страницы:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка удаления описания страницы'
    });
  }
});

module.exports = router;