const { Client } = require('pg');
require('dotenv').config();

console.log('🔄 Starting database migration...');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Создаем таблицу products (памятники)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        height VARCHAR(100),
        price DECIMAL(10,2),
        old_price DECIMAL(10,2),
        discount DECIMAL(10,2),
        category VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        colors TEXT NOT NULL,
        options TEXT NOT NULL,
        availability VARCHAR(50) DEFAULT 'под заказ',
        hit BOOLEAN DEFAULT false,
        popular BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created table: products');

    // Создаем таблицу epitaphs
    await client.query(`
      CREATE TABLE IF NOT EXISTS epitaphs (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: epitaphs');

    // Создаем таблицу accessories
    await client.query(`
      CREATE TABLE IF NOT EXISTS accessories (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        text_price VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        colors TEXT,
        specifications JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: accessories');

    // Создаем таблицу fences
    await client.query(`
      CREATE TABLE IF NOT EXISTS fences (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        text_price VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        specifications JSONB DEFAULT '{}',
        popular BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: fences');

    // Создаем таблицу landscape
    await client.query(`
      CREATE TABLE IF NOT EXISTS landscape (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        text_price VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        specifications JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: landscape');

    // Создаем таблицу campaigns
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image TEXT,
        discount_percent INTEGER,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: campaigns');

    // Создаем таблицу works
    await client.query(`
      CREATE TABLE IF NOT EXISTS works (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image TEXT NOT NULL,
        product_id VARCHAR(255),
        product_type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: works');

    // Создаем таблицу blogs
    await client.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        meta_title VARCHAR(255),
        meta_description TEXT,
        featured_image TEXT,
        images JSONB DEFAULT '[]',
        blocks JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created table: blogs');

    console.log('🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();