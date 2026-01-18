const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const router = express.Router();

// Инициализация подключения к БД
let client;
async function initDb() {
  if (!client) {
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'stonerose',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    try {
      await client.connect();
    } catch (err) {
      console.error('DB connection error:', err);
      client = null;
    }
  }
  return client;
}

// Функция для хэширования пароля
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

// Генерация JWT токена
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * POST /api/auth/login
 * Вход администратора
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны',
      });
    }

    const db = await initDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка подключения к БД',
      });
    }

    // Ищем пользователя в БД
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }

    const user = result.rows[0];

    // Проверяем пароль
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }

    // Обновляем last_login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Генерируем токен
    const token = generateToken(user);

    // Возвращаем успешный ответ
    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

/**
 * POST /api/auth/logout
 * Выход администратора
 */
router.post('/logout', (req, res) => {
  // На фронте просто удалятся localStorage
  res.json({
    success: true,
    message: 'Вы вышли из системы',
  });
});

/**
 * GET /api/auth/me
 * Проверка текущего пользователя
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не найден',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const db = await initDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка подключения к БД',
      });
    }

    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Токен невалидный',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Смена пароля текущего пользователя
 */
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Валидация входных данных
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Новые пароли не совпадают',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен быть не менее 8 символов',
      });
    }

    // Проверяем сложность пароля
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>?/~`])[A-Za-z\d!@#$%^&*()_\-+=\[\]{};':"\\|,.<>?/~`]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать прописные буквы, цифры и спецсимволы',
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не найден',
      });
    }

    // Декодируем токен
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Токен невалидный или истекший',
      });
    }

    const db = await initDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка подключения к БД',
      });
    }

    // Получаем пользователя
    const userResult = await db.query(
      'SELECT id, password FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    const user = userResult.rows[0];

    // Проверяем текущий пароль
    const hashedCurrentPassword = hashPassword(currentPassword);
    if (user.password !== hashedCurrentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Текущий пароль введён неправильно',
      });
    }

    // Обновляем пароль
    const newHashedPassword = hashPassword(newPassword);
    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [newHashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Пароль успешно изменён',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

module.exports = router;
