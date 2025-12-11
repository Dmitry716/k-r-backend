const express = require('express');
const { db } = require('../utils/db');
const { 
  products, 
  artisticMonuments,
  singleMonuments,
  doubleMonuments,
  crossMonuments,
  heartMonuments,
  compositeMonuments,
  europeMonuments,
  treeMonuments,
  complexMonuments,
  cheapMonuments
} = require('../models/schema');
const { eq } = require('drizzle-orm');
const { getAppliedSeoData } = require('../utils/seo-helper');

const router = express.Router();

// Маппинг категорий к таблицам памятников
const categoryToTable = {
  'single': singleMonuments,
  'одиночные': singleMonuments,
  'double': doubleMonuments,
  'двойные': doubleMonuments,
  'cheap': cheapMonuments,
  'недорогие': cheapMonuments,
  'cross': crossMonuments,
  'в-виде-креста': crossMonuments,
  'heart': heartMonuments,
  'в-виде-сердца': heartMonuments,
  'composite': compositeMonuments,
  'составные': compositeMonuments,
  'europe': europeMonuments,
  'европейские': europeMonuments,
  'artistic': artisticMonuments,
  'художественная-резка': artisticMonuments,
  'tree': treeMonuments,
  'в-виде-деревьев': treeMonuments,
  'complex': complexMonuments,
  'мемориальные-комплексы': complexMonuments,
  'exclusive': products, // используем таблицу products для эксклюзивных памятников
  'эксклюзивные': products,
};

// GET /api/admin/monuments - получить памятники по категории
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.json({ 
        success: false, 
        error: "Требуется параметр category" 
      });
    }

    const table = categoryToTable[category.toLowerCase()];
    
    if (!table) {
      return res.json({ 
        success: false, 
        error: "Неизвестная категория памятников" 
      });
    }

    const monuments = await db.select().from(table).orderBy(table.createdAt);
    
    res.json({ 
      success: true, 
      products: monuments,
      category: category,
      count: monuments.length 
    });
  } catch (error) {
    console.error("Ошибка при получении памятников:", error);
    res.status(500).json({ success: false, error: "Ошибка при получении памятников" });
  }
});

// POST /api/admin/monuments - обновить памятник
router.post('/', async (req, res) => {
  try {
    const { action, id, hit, popular, new: isNew, category, data } = req.body;

    if (action === "update_status") {
      if (!category) {
        return res.json({ success: false, error: "Требуется параметр category" });
      }

      const table = categoryToTable[category.toLowerCase()];
      
      if (!table) {
        return res.json({ success: false, error: "Неизвестная категория памятников" });
      }

      // Обновляем статусы hit, popular и new в соответствующей таблице
      const updateData = {};
      if (hit !== undefined) updateData.hit = hit;
      if (popular !== undefined) updateData.popular = popular;
      if (isNew !== undefined) updateData.new = isNew;

      const updatedProduct = await db
        .update(table)
        .set(updateData)
        .where(eq(table.id, id))
        .returning();

      if (updatedProduct.length === 0) {
        return res.json({ success: false, error: "Памятник не найден" });
      }

      res.json({ 
        success: true, 
        message: "Статус памятника обновлен",
        product: updatedProduct[0] 
      });
    }

    else if (action === "update_product") {
      if (!category || !data) {
        return res.json({ success: false, error: "Требуются параметры category и data" });
      }

      const table = categoryToTable[category.toLowerCase()];
      
      if (!table) {
        return res.json({ success: false, error: "Неизвестная категория памятников" });
      }

      // Обновляем данные памятника в соответствующей таблице
      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.oldPrice !== undefined) updateData.oldPrice = data.oldPrice;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.image !== undefined) updateData.image = data.image;
      if (data.options !== undefined) updateData.options = data.options;

      const updatedProduct = await db
        .update(table)
        .set(updateData)
        .where(eq(table.id, id))
        .returning();

      if (updatedProduct.length === 0) {
        return res.json({ success: false, error: "Памятник не найден" });
      }

      res.json({ 
        success: true, 
        message: "Памятник успешно обновлен",
        product: updatedProduct[0] 
      });
    }

    else if (action === "add_product") {
      if (!category || !data) {
        return res.json({ success: false, error: "Требуются параметры category и data" });
      }

      const table = categoryToTable[category.toLowerCase()];
      
      if (!table) {
        return res.json({ success: false, error: "Неизвестная категория памятников" });
      }

      // Создаем новый памятник в соответствующей таблице
      const insertData = {
        name: data.name || "Новый памятник",
        price: data.price || null,
        oldPrice: data.oldPrice || null,
        category: data.category || category,
        image: data.image || "",
        options: data.options || "{}",
        slug: data.name ? data.name.toLowerCase().replace(/[^а-яa-z0-9]/gi, '-').replace(/-+/g, '-') + '-' + Date.now() : `monument-${Date.now()}`,
        hit: false,
        popular: false
      };

      // Для exclusive памятников (products таблица) используем другие поля
      if (category === 'exclusive' || category === 'эксклюзивные') {
        insertData.colors = "[]"; // В products таблице обязательное поле
        insertData.availability = "под заказ";
      }

      // Применяем SEO шаблон если он существует и нет пользовательского SEO
      const seoData = await getAppliedSeoData(data, 'monuments', category);
      if (seoData.seoTitle) insertData.seoTitle = seoData.seoTitle;
      if (seoData.seoDescription) insertData.seoDescription = seoData.seoDescription;
      if (seoData.seoKeywords) insertData.seoKeywords = seoData.seoKeywords;
      if (seoData.ogImage) insertData.ogImage = seoData.ogImage;

      const newProduct = await db
        .insert(table)
        .values(insertData)
        .returning();

      res.json({ 
        success: true, 
        message: "Памятник успешно добавлен",
        product: newProduct[0] 
      });
    }

    else {
      res.json({ success: false, error: "Неизвестное действие" });
    }
  } catch (error) {
    console.error("Ошибка при обновлении памятника:", error);
    res.status(500).json({ success: false, error: "Ошибка при обновлении памятника" });
  }
});

module.exports = router;