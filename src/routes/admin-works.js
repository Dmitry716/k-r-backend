const express = require('express');
const { db } = require('../utils/db');
const { works } = require('../models/schema');
const { eq, desc } = require('drizzle-orm');

const router = express.Router();

// GET /api/admin/works - получить все работы
router.get('/', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const worksData = await db
      .select()
      .from(works)
      .orderBy(desc(works.createdAt))
      .limit(parseInt(limit));

    res.json({ 
      success: true, 
      data: worksData,
      count: worksData.length 
    });
  } catch (error) {
    console.error("Ошибка при получении работ:", error);
    res.status(500).json({ success: false, error: "Ошибка при получении работ" });
  }
});

// POST /api/admin/works - создать новую работу
router.post('/', async (req, res) => {
  try {
    const { title, description, image, productId, productType, category } = req.body;

    if (!title || !image) {
      return res.status(400).json({
        success: false, 
        error: "Требуются поля title и image"
      });
    }

    const newWork = await db
      .insert(works)
      .values({
        title,
        description: description || null,
        image,
        productId: productId || null,
        productType: productType || "monuments",
        category: category || null,
        isActive: true,
      })
      .returning();

    res.json({ 
      success: true, 
      message: "Работа успешно создана",
      data: newWork[0] 
    });
  } catch (error) {
    console.error("Ошибка при создании работы:", error);
    res.status(500).json({ success: false, error: "Ошибка при создании работы" });
  }
});

// PUT /api/admin/works/:id - обновить работу
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: "Неверный ID работы" });
    }

    const { title, description, image, productId, productType, category } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (productId !== undefined) updateData.productId = productId;
    if (productType !== undefined) updateData.productType = productType;
    if (category !== undefined) updateData.category = category;

    const updatedWork = await db
      .update(works)
      .set(updateData)
      .where(eq(works.id, parseInt(id)))
      .returning();

    if (updatedWork.length === 0) {
      return res.status(404).json({ success: false, error: "Работа не найдена" });
    }

    res.json({ 
      success: true, 
      message: "Работа успешно обновлена",
      data: updatedWork[0] 
    });
  } catch (error) {
    console.error("Ошибка при обновлении работы:", error);
    res.status(500).json({ success: false, error: "Ошибка при обновлении работы" });
  }
});

// DELETE /api/admin/works/:id - удалить работу
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, error: "Неверный ID работы" });
    }

    const deletedWork = await db
      .delete(works)
      .where(eq(works.id, parseInt(id)))
      .returning();

    if (deletedWork.length === 0) {
      return res.status(404).json({ success: false, error: "Работа не найдена" });
    }

    res.json({ 
      success: true, 
      message: "Работа успешно удалена" 
    });
  } catch (error) {
    console.error("Ошибка при удалении работы:", error);
    res.status(500).json({ success: false, error: "Ошибка при удалении работы" });
  }
});

module.exports = router;