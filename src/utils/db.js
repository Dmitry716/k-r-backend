const { drizzle } = require('drizzle-orm/node-postgres');
const { Client } = require('pg');

// Создаем клиент PostgreSQL
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Подключаемся к базе данных
client.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection error:', err));

// Создаем экземпляр Drizzle ORM
const db = drizzle(client);

module.exports = { db, client };