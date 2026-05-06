const express = require('express');
const { db } = require('../utils/db');
const { works } = require('../models/schema');
const { eq, and } = require('drizzle-orm');

const router = express.Router();

function tryFixMojibake(value) {
  if (typeof value !== 'string' || (!value.includes('Ð') && !value.includes('Ñ'))) {
    return value;
  }

  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8');
    // If conversion produced readable cyrillic, use it.
    if (/[А-Яа-яЁё]/.test(repaired)) {
      return repaired;
    }
  } catch (error) {
    // Ignore conversion errors and keep original value.
  }

  return value;
}

function normalizeWorkImage(workItem) {
  if (!workItem || typeof workItem !== 'object') return workItem;
  if (!workItem.image || typeof workItem.image !== 'string') return workItem;

  const image = workItem.image;
  const marker = '/api/static/';
  const markerIndex = image.indexOf(marker);
  if (markerIndex === -1) return workItem;

  const prefix = image.slice(0, markerIndex + marker.length);
  const pathPart = image.slice(markerIndex + marker.length);
  const fixedPathPart = pathPart
    .split('/')
    .map((segment) => tryFixMojibake(segment))
    .join('/');

  return {
    ...workItem,
    image: `${prefix}${fixedPathPart}`,
  };
}

// GET /api/works - получить все работы или отфильтрованные
router.get('/', async (req, res) => {
  try {
    const { productId, productType, category } = req.query;

    // Фильтрация по продукту (с учётом категории)
    if (productId && productType && category) {
      try {
        const productWorks = await db.select().from(works)
          .where(
            and(
              eq(works.productId, productId),
              eq(works.productType, productType),
              eq(works.category, category)
            )
          );
        return res.json({ success: true, data: productWorks.map(normalizeWorkImage) });
      } catch (error) {
        return res.json({ success: true, data: [] });
      }
    }

    // Фильтрация только по продукту (устаревшая логика, оставляем для совместимости)
    if (productId && productType) {
      try {
        const productWorks = await db.select().from(works)
          .where(
            and(
              eq(works.productId, productId),
              eq(works.productType, productType)
            )
          );
        return res.json({ success: true, data: productWorks.map(normalizeWorkImage) });
      } catch (error) {
        return res.json({ success: true, data: [] });
      }
    }

    // Фильтрация по категории
    if (category && category !== 'Все работы') {
      try {
        const filteredWorks = await db.select().from(works)
          .where(eq(works.category, category));
        return res.json({ success: true, data: filteredWorks.map(normalizeWorkImage) });
      } catch (error) {
        return res.json({ success: true, data: [] });
      }
    }

    // Все работы для админки - если таблица не существует, возвращаем пустой массив
    try {
      const allWorks = await db.select().from(works)
        .orderBy(works.createdAt);
      res.json({ success: true, data: allWorks.map(normalizeWorkImage) });
    } catch (error) {
      // Если таблица не существует, возвращаем пустой массив
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Error fetching works:', error);
    res.json({ success: true, data: [] });
  }
});

// POST /api/works - создать новую работу
router.post('/', async (req, res) => {
  try {
    const { title, description, image, productId, productType, category } = req.body;

    if (!title || !image || !productType) {
      return res.status(400).json({
        success: false,
        error: 'Title, image and productType are required'
      });
    }

    const newWork = await db.insert(works).values({
      title,
      description,
      image,
      productId,
      productType,
      category,
    }).returning();

    res.json({ success: true, data: newWork[0] });
  } catch (error) {
    console.error('Error creating work:', error);
    res.status(500).json({ success: false, error: 'Failed to create work' });
  }
});

// PUT /api/works/:id - обновить работу
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, productId, productType, category, isActive } = req.body;

    const updatedWork = await db.update(works)
      .set({
        title,
        description,
        image,
        productId,
        productType,
        category,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(works.id, parseInt(id)))
      .returning();

    if (updatedWork.length === 0) {
      return res.status(404).json({ success: false, error: 'Work not found' });
    }

    res.json({ success: true, data: updatedWork[0] });
  } catch (error) {
    console.error('Error updating work:', error);
    res.status(500).json({ success: false, error: 'Failed to update work' });
  }
});

// DELETE /api/works/:id - удалить работу
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedWork = await db.delete(works)
      .where(eq(works.id, parseInt(id)))
      .returning();

    if (deletedWork.length === 0) {
      return res.status(404).json({ success: false, error: 'Work not found' });
    }

    res.json({ success: true, message: 'Work deleted successfully' });
  } catch (error) {
    console.error('Error deleting work:', error);
    res.status(500).json({ success: false, error: 'Failed to delete work' });
  }
});

module.exports = router;