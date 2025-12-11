const { Client } = require('pg');
require('dotenv').config();

console.log('🔄 Starting database seeding...');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Добавляем тестовые эпитафии
    await client.query(`
      INSERT INTO epitaphs (text) VALUES 
      ('В памяти наших сердец ты останешься навсегда'),
      ('Твоя любовь и доброта будут жить в наших сердцах'),
      ('Покойся с миром, дорогой наш человек'),
      ('Светлая память о тебе навсегда в наших сердцах'),
      ('Твоя душа обрела вечный покой')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Seeded epitaphs');

    // Добавляем тестовые готовые работы
    await client.query(`
      INSERT INTO works (title, description, image, product_type, category) VALUES 
      ('Памятник из черного гранита', 'Одиночный памятник с художественной гравировкой', '/works/1.webp', 'monuments', 'Одиночные'),
      ('Двойной памятник с розами', 'Элегантный двойной памятник с цветочным орнаментом', '/works/2.webp', 'monuments', 'Двойные'),
      ('Памятник в виде креста', 'Классический крест из серого гранита', '/works/3.webp', 'monuments', 'В виде креста'),
      ('Гранитная ограда премиум', 'Красивая ограда из полированного гранита', '/works/4.webp', 'fences', 'Гранитные ограды'),
      ('Металлическая ограда с ковкой', 'Элегантная металлическая ограда', '/works/5.webp', 'fences', 'Металлические ограды')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Seeded works');

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();