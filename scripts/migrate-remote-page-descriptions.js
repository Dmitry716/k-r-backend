const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runRemoteMigration() {
  // Настройки для удаленной базы данных
  const pool = new Pool({
    user: 'stonerose_user',
    password: 'goDefa8Nexus!stone', // Замените на актуальный пароль
    host: '193.47.42.105',
    port: 5432,
    database: 'stonerose_db',
    ssl: false // Если требуется SSL
  });

  try {
    console.log('🔄 Подключение к удаленной БД на 193.47.42.105...');
    
    // Проверяем подключение
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение к удаленной БД установлено!');
    
    console.log('🔄 Запуск миграции: создание таблицы page_descriptions...');
    
    // Читаем SQL файл миграции
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/create-page-descriptions-table.sql'), 
      'utf8'
    );
    
    // Выполняем миграцию
    await pool.query(migrationSQL);
    
    console.log('✅ Миграция в удаленную БД успешно выполнена!');
    console.log('📋 Создана таблица page_descriptions с индексами на сервере');
    
  } catch (error) {
    console.error('❌ Ошибка при подключении к удаленной БД или выполнении миграции:');
    console.error('Детали ошибки:', error.message);
    
    if (error.code) {
      console.error('Код ошибки:', error.code);
    }
    
    // Возможные причины ошибок:
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Возможные причины:');
      console.error('   - PostgreSQL не запущен на сервере');
      console.error('   - Порт 5432 заблокирован файерволом');
      console.error('   - Неверный хост или порт');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Хост не найден, проверьте IP адрес сервера');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Ошибка аутентификации, проверьте логин и пароль');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запускаем миграцию
runRemoteMigration();