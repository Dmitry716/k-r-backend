const { pgTable, serial, text, numeric, varchar, timestamp, jsonb, boolean } = require("drizzle-orm/pg-core");

const epitaphs = pgTable("epitaphs", {
  id: serial("id").primaryKey().notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const accessories = pgTable("accessories", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  textPrice: varchar("text_price"),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  colors: text("colors"), // Реальная колонка в базе
  specifications: jsonb("specifications").default({}),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const fences = pgTable("fences", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  textPrice: varchar("text_price"),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  specifications: jsonb("specifications").default({}),
  description: text("description"),
  popular: boolean("popular").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  featuredImage: text("featured_image"),
  images: jsonb("images").default([]), // массив путей к изображениям
  blocks: jsonb("blocks").default([]), // гибкие блоки контента
  tags: jsonb("tags").default([]), // теги
  products: jsonb("products").default([]), // массив ID товаров из разных категорий
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const landscape = pgTable("landscape", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  textPrice: varchar("text_price"),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  specifications: jsonb("specifications").default({}),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Таблицы для памятников по категориям

//Эксклюзивные памятники
const products = pgTable("products", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  colors: text("colors").notNull(), // JSON строка
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для одиночных памятников
const singleMonuments = pgTable("single_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для двойных памятников
const doubleMonuments = pgTable("double_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для недорогих памятников
const cheapMonuments = pgTable("cheap_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для памятников в виде креста
const crossMonuments = pgTable("cross_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для памятников в виде сердца
const heartMonuments = pgTable("heart_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для составных памятников
const compositeMonuments = pgTable("composite_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для европейских памятников
const europeMonuments = pgTable("europe_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для памятников с художественной резкой
const artisticMonuments = pgTable("artistic_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для памятников в виде деревьев
const treeMonuments = pgTable("tree_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица для мемориальных комплексов
const complexMonuments = pgTable("complex_monuments", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  height: varchar("height"),
  price: numeric("price", { precision: 10, scale: 2 }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  category: varchar("category").notNull(),
  image: text("image").notNull(),
  options: text("options").notNull(), // JSON строка
  description: text("description"),
  availability: varchar("availability").default("под заказ"), // в наличии / под заказ
  hit: boolean("hit").default(false),
  popular: boolean("popular").default(false),
  new: boolean("new").default(false),
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

const works = pgTable("works", {
  id: serial("id").primaryKey().notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  image: text("image").notNull(), // путь к изображению
  productId: varchar("product_id"), // ID продукта
  productType: varchar("product_type").notNull(), // тип продукта: monuments, fences, accessories, landscape
  category: varchar("category"), // категория для фильтрации
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const pageDescriptions = pgTable("page_descriptions", {
  id: serial("id").primaryKey().notNull(),
  pageSlug: varchar("page_slug").notNull().unique(),
  pageTitle: varchar("page_title").notNull(),
  blocks: jsonb("blocks").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const pageSeo = pgTable("page_seo", {
  id: serial("id").primaryKey().notNull(),
  pageSlug: varchar("page_slug").notNull().unique(),
  pageTitle: varchar("page_title").notNull(),
  
  // Основные SEO поля
  seoTitle: varchar("seo_title").notNull(),
  seoDescription: varchar("seo_description").notNull(),
  seoKeywords: varchar("seo_keywords"),
  
  // Open Graph (OG) теги для социальных сетей
  ogTitle: varchar("og_title"),
  ogDescription: varchar("og_description"),
  ogImage: varchar("og_image"),
  ogImageWidth: serial("og_image_width").default(1200),
  ogImageHeight: serial("og_image_height").default(630),
  
  // Twitter Card теги
  twitterTitle: varchar("twitter_title"),
  twitterDescription: varchar("twitter_description"),
  twitterImage: varchar("twitter_image"),
  
  // Дополнительные SEO поля
  canonicalUrl: varchar("canonical_url"),
  robotsMeta: varchar("robots_meta"),
  author: varchar("author"),
  
  // Структурированные данные (Schema.org JSON-LD)
  schemaMarkup: jsonb("schema_markup"),
  
  // Индексирование
  isIndexed: boolean("is_indexed").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const blogs = pgTable("blogs", {
  id: serial("id").primaryKey().notNull(),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  featuredImage: text("featured_image"),
  images: jsonb("images").default([]), // массив дополнительных изображений
  blocks: jsonb("blocks").default([]), // гибкие блоки контента
  tags: jsonb("tags").default([]), // теги
  // SEO поля
  seoTitle: varchar("seo_title"),
  seoDescription: varchar("seo_description"),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Таблица для SEO шаблонов категорий
const seoTemplates = pgTable("seo_templates", {
  id: serial("id").primaryKey().notNull(),
  categoryKey: varchar("category_key").notNull().unique(),
  categoryName: varchar("category_name").notNull(),
  entityType: varchar("entity_type").notNull(), // monuments, fences, accessories, landscape, sales, blogs
  seoTitle: varchar("seo_title").notNull(),
  seoDescription: varchar("seo_description").notNull(),
  seoKeywords: varchar("seo_keywords"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = {
  products,
  epitaphs,
  accessories,
  fences,
  landscape,
  campaigns,
  works,
  blogs,
  pageDescriptions,
  pageSeo,
  seoTemplates,
  // Все категории памятников
  singleMonuments,
  doubleMonuments,
  cheapMonuments,
  crossMonuments,
  heartMonuments,
  compositeMonuments,
  europeMonuments,
  artisticMonuments,
  treeMonuments,
  complexMonuments
};
