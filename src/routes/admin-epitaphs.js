const express = require('express');
const { eq, like, gte, lte, or, asc } = require('drizzle-orm');
const { db } = require('../utils/db');
const { epitaphs } = require('../models/schema');

const router = express.Router();

// GET /api/admin/epitaphs - получить все эпитафии для админки
router.get('/', async (req, res) => {
  try {
    const { search, limit = 200, offset = 0 } = req.query;

    let query = db.select().from(epitaphs);

    // Поиск по тексту
    if (search) {
      query = query.where(like(epitaphs.text, `%${search}%`));
    }

    const result = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(asc(epitaphs.id));

    res.json({ 
      success: true, 
      epitaphs: result,
      count: result.length 
    });
  } catch (error) {
    console.error('Ошибка получения эпитафий для админки:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// POST /api/admin/epitaphs - создать новую эпитафию через админку
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text обязателен'
      });
    }

    const result = await db
      .insert(epitaphs)
      .values({
        text: text.trim(),
      })
      .returning();

    res.status(201).json({ success: true, epitaph: result[0] });
  } catch (error) {
    console.error('Ошибка создания эпитафии через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать эпитафию' });
  }
});

// PUT /api/admin/epitaphs/:id - обновить эпитафию через админку
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text обязателен'
      });
    }

    const result = await db
      .update(epitaphs)
      .set({ text: text.trim() })
      .where(eq(epitaphs.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Эпитафия не найдена' });
    }

    res.json({ success: true, epitaph: result[0] });
  } catch (error) {
    console.error('Ошибка обновления эпитафии через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось обновить эпитафию' });
  }
});

// DELETE /api/admin/epitaphs/:id - удалить эпитафию через админку
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(epitaphs)
      .where(eq(epitaphs.id, parseInt(id)))
      .returning();

    if (!result.length) {
      return res.status(404).json({ success: false, error: 'Эпитафия не найдена' });
    }

    res.json({ success: true, message: 'Эпитафия успешно удалена', epitaph: result[0] });
  } catch (error) {
    console.error('Ошибка удаления эпитафии через админку:', error);
    res.status(500).json({ success: false, error: 'Не удалось удалить эпитафию' });
  }
});

module.exports = router;