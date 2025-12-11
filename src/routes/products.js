const express = require('express');
const { db } = require('../utils/db');
const { products } = require('../models/schema');
const { eq, like, and, gte, lte, or, sql } = require('drizzle-orm');

const router = express.Router();

// Функция для трансформации цены
const transformPrice = (price) => {
  if (typeof price === 'string') {
    return parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
  }
  return price || 0;
};

// GET /api/products - получить все продукты
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice,
      hit,
      popular,
      available,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(products);
    const conditions = [];

    // Фильтр по категории
    if (category) {
      conditions.push(eq(products.category, category));
    }

    // Поиск по названию
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }

    // Фильтр по цене
    if (minPrice) {
      conditions.push(gte(products.price, parseInt(minPrice)));
    }
    if (maxPrice) {
      conditions.push(lte(products.price, parseInt(maxPrice)));
    }

    // Фильтры по статусам
    if (hit === 'true') {
      conditions.push(eq(products.hit, true));
    }
    if (popular === 'true') {
      conditions.push(eq(products.popular, true));
    }
    if (available === 'true') {
      conditions.push(eq(products.availability, true));
    }

    // Применяем условия
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Применяем лимит и смещение
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    query = query.orderBy(products.id);

    const allProducts = await query;

    res.json({ success: true, data: allProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/products/slug/:slug - получить продукт по slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const product = await db.select().from(products)
      .where(eq(products.slug, slug));

    if (product.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product[0] });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// GET /api/products/:id - получить продукт по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await db.select().from(products)
      .where(eq(products.id, parseInt(id)));

    if (product.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// POST /api/products - создать новый продукт
router.post('/', async (req, res) => {
  try {
    const productData = req.body;

    // Базовая валидация
    if (!productData.name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    // Получить максимальный ID и увеличить на 1
    const maxIdResult = await db.select({ maxId: sql`MAX(${products.id})` }).from(products);
    const nextId = (maxIdResult[0]?.maxId || 0) + 1;

    // Трансформация данных
    const processedData = {
      ...productData,
      id: nextId, // Автоматический ID
      price: transformPrice(productData.price),
      oldPrice: transformPrice(productData.oldPrice),
      availability: productData.availability !== false, // по умолчанию true
      hit: productData.hit === true,
      popular: productData.popular === true
    };

    const newProduct = await db.insert(products).values(processedData).returning();

    res.json({ success: true, data: newProduct[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - обновить продукт
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Трансформация данных
    if (updateData.price) {
      updateData.price = transformPrice(updateData.price);
    }
    if (updateData.oldPrice) {
      updateData.oldPrice = transformPrice(updateData.oldPrice);
    }

    const updatedProduct = await db.update(products)
      .set(updateData)
      .where(eq(products.id, parseInt(id)))
      .returning();

    if (updatedProduct.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: updatedProduct[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - удалить продукт
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug } = req.query; // Получаем slug для дополнительной проверки

    const productId = parseInt(id);
    
    // Сначала находим продукт, чтобы проверить его существование
    const existingProduct = await db.select().from(products)
      .where(eq(products.id, productId));

    if (existingProduct.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Если предоставлен slug, проверяем его соответствие
    if (slug && existingProduct[0].slug !== slug) {
      return res.status(400).json({ 
        success: false, 
        error: 'Slug mismatch - attempting to delete wrong product',
        details: { expectedSlug: existingProduct[0].slug, providedSlug: slug, id: productId }
      });
    }

    // Удаляем только найденный продукт
    const deletedProduct = await db.delete(products)
      .where(eq(products.id, productId))
      .returning();

    if (deletedProduct.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found during deletion' });
    }

    console.log(`[DELETE] Product deleted - ID: ${productId}, Slug: ${existingProduct[0].slug}, Name: ${existingProduct[0].name}`);

    res.json({ success: true, message: 'Product deleted successfully', data: deletedProduct[0] });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

module.exports = router;