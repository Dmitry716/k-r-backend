#!/usr/bin/env node
/**
 * Скрипт запуска миграции: Добавление SEO полей к таблицам сущностей
 * Использование: node scripts/migrate-add-seo-fields.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MIGRATION_FILE = path.join(__dirname, '../migrations/add-seo-fields-to-entities.sql');

// Создаем пул подключений к БД
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  console.log('🚀 Запуск миграции: Добавление SEO полей...\n');
  console.log(`📌 Подключение к БД: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);

  try {
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Разбиваем SQL на отдельные команды
    const rawStatements = sql.split(';');
    const statements = [];
    
    for (const stmt of rawStatements) {
      const trimmed = stmt
        .trim()
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
    }

    console.log(`📋 Всего SQL команд: ${statements.length}\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Выполнение команды ${i + 1}/${statements.length}...`);
      
      try {
        await client.query(statement);
        console.log(`✅ Команда ${i + 1} успешна\n`);
      } catch (err) {
        // IF NOT EXISTS, поэтому ошибки игнорируем если таблица/колонка уже существует
        if (err.message.includes('already exists') || 
            err.message.includes('duplicate column') ||
            err.message.includes('must be owner of table')) {
          console.log(`⚠️  Команда ${i + 1} - ${err.message} (пропускаем)\n`);
        } else {
          throw err;
        }
      }
    }

    console.log('✨ Миграция завершена успешно!\n');
    console.log('📝 Что было добавлено:');
    console.log('  - SEO поля (seoTitle, seoDescription, seoKeywords, ogImage) к таблицам:');
    console.log('    • single_monuments, double_monuments, cheap_monuments');
    console.log('    • cross_monuments, heart_monuments, composite_monuments');
    console.log('    • europe_monuments, artistic_monuments, tree_monuments');
    console.log('    • complex_monuments, fences, accessories, landscape');
    console.log('    • campaigns (акции), blogs');
    console.log('  - Таблица seo_templates для управления шаблонами');
    console.log('  - Индексы для быстрого поиска\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    console.error('\nПолная ошибка:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Запуск миграции
runMigration();
