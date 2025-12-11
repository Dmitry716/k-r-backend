const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'stonerose',
  });

  try {
    console.log('🔄 Запуск миграции: создание таблицы page_descriptions...');
    
    // Читаем SQL файл миграции
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/create-page-descriptions-table.sql'), 
      'utf8'
    );
    
    // Выполняем миграцию
    await pool.query(migrationSQL);
    
    console.log('✅ Миграция успешно выполнена!');
    console.log('📋 Создана таблица page_descriptions с индексами');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запускаем миграцию
runMigration();