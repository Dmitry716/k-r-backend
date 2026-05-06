import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { singleMonuments, doubleMonuments, compositeMonuments } from '../src/models/schema.js';

/**
 * УНИВЕРСАЛЬНЫЙ СКРИПТ ДЛЯ ИМПОРТА ПАМЯТНИКОВ
 * 
 * Поддерживает:
 * - Одиночные памятники (single_monuments)
 * - Двойные памятники (double_monuments)
 * - Составные памятники (composite_monuments)
 * 
 * Использование:
 * node backend/scripts/import-monuments.js <тип> <файл>
 * 
 * Примеры:
 * node backend/scripts/import-monuments.js single "Памятники1.xlsx"
 * node backend/scripts/import-monuments.js double "Памятники1.xlsx"
 * node backend/scripts/import-monuments.js composite "Составные.xlsx"
 */

// Загружаем переменные окружения
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL не найден в .env.local');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

function normalizeCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value?.result !== undefined) {
    return String(value.result ?? '').trim();
  }
  return String(value).trim();
}

function worksheetToJsonRows(worksheet) {
  const headerRow = worksheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = normalizeCellValue(cell.value);
  });

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const result = {};
    let hasData = false;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      const value = normalizeCellValue(cell.value);
      if (value !== '') hasData = true;
      result[header] = value;
    });

    if (hasData) {
      rows.push(result);
    }
  });

  return rows;
}

// Конфигурация типов памятников
const MONUMENT_TYPES = {
  single: {
    table: singleMonuments,
    category: 'Одиночные',
    sheetName: 'Одиночные' | 'одиночные' | null,
    imageFolder: 'Одиночные',
    description: 'Одиночные памятники'
  },
  double: {
    table: doubleMonuments,
    category: 'Двойные',
    sheetName: 'Двойные' | 'двойные' | null,
    imageFolder: 'Двойные',
    description: 'Двойные памятники'
  },
  composite: {
    table: compositeMonuments,
    category: 'Составные',
    sheetName: 'Составные' | 'составные' | null, // использует первый лист
    imageFolder: 'Составные',
    description: 'Составные памятники',
    hasComplexSizes: true // размеры в формате "Д/Ш/В"
  }
};

// Функция для генерации slug из названия
function generateSlug(name) {
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => translitMap[char] || char)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

// Функция для конвертации значения в булево
function convertToBoolean(value) {
  if (!value) return false;
  return String(value).toLowerCase() === 'да' || 
         String(value).toLowerCase() === 'yes' || 
         String(value) === '1';
}

// Функция для парсинга размеров из строки формата "133x75x140" 
function parseDimensions(dimensionStr) {
  if (!dimensionStr) return { length: 0, width: 0, height: 0 };
  
  // Убираем "см" и прочие символы, оставляем только цифры и разделители
  const cleaned = String(dimensionStr).replace(/[^\d\s\xх]/g, '');
  
  // Разделяем по x или х (русская х)
  const parts = cleaned.split(/[xх\s]+/).filter(Boolean);
  
  if (parts.length >= 3) {
    return {
      width: `${parts[0]} см`,
      length: `${parts[1]} см`,
      height: `${parts[2]} см`,
      heightValue: parts[2]
    };
  }
  
  return { width: '', length: '', height: '' };
}

// Функция для обработки строки памятника
function processMonumentRow(row, monumentType, rowIndex) {
  const config = MONUMENT_TYPES[monumentType];
  
  // Колонка A - Модель (название фото)
  const photoName = row['Модель'] || row['модель'] || row['A'] || '';
  if (!photoName || !String(photoName).trim()) {
    return null;
  }
  
  // Генерируем название памятника
  const baseName = String(photoName).replace(/\.(jpg|jpeg|png|webp)$/i, '');
  const name = baseName;
  
  // Генерируем slug
  const slug = generateSlug(name);
  
  // Полный путь к изображению
  const image = `/Памятники/${config.imageFolder}/800x800/${photoName}`;
  
  // Колонка B - Наличие товара
  const availabilityRaw = row['Наличие товара'] || row['B'] || '';
  const availability = String(availabilityRaw).toLowerCase().includes('наличи') ? 'в наличии' : 'под заказ';
  
  // Обработка размеров
  let height = null;
  let options = {};
  
  if (config.hasComplexSizes) {
    // Составные: размер в формате "Д/Ш/В"
    const dimensionRaw = row['Размер в см. Д/Ш/В'] || row['C'] || '';
    const dimensions = parseDimensions(dimensionRaw);
    
    if (dimensions.width) options['Ширина'] = dimensions.width;
    if (dimensions.length) options['Длина'] = dimensions.length;
    if (dimensions.height) options['Высота'] = dimensions.height;
    
    height = dimensions.heightValue ? `${dimensions.heightValue} см` : null;
  } else {
    // Одиночные/Двойные: отдельные колонки для размеров
    const stela = row['Стела'] || row['C'] || '';
    const tumba = row['Тумба'] || row['D'] || '';
    const tumba2 = row['Тумба2'] || row['E'] || '';
    const cvetnik = row['Цветник'] || row['F'] || '';
    
    if (stela) options['Стела'] = `${stela} см`;
    if (tumba) options['Тумба'] = `${tumba} см`;
    if (tumba2) options['Тумба 2'] = `${tumba2} см`;
    if (cvetnik) options['Цветник'] = `${cvetnik} см`;
    
    // Общая высота (разное место в зависимости от типа)
    const heightRaw = row['Общая высота в см'] || row['F'] || '';
    height = heightRaw ? `${heightRaw} см` : null;
  }
  
  // Колонки для Хит и Популярность (могут быть разные в зависимости от типа)
  let hitColumn, popularColumn, priceColumn, discountColumn, finalPriceColumn;
  
  if (config.hasComplexSizes) {
    // Составные
    hitColumn = 'Хит продаж';
    popularColumn = 'Популярные товары';
    priceColumn = 'Цена в бел.руб. от';
    discountColumn = 'Скидка %';
    finalPriceColumn = 'Цена со СКИДКОЙ в бел.руб';
  } else {
    // Одиночные/Двойные
    hitColumn = 'Хит продаж';
    popularColumn = 'Популярные товары';
    priceColumn = 'Цена в бел. руб';
    discountColumn = 'Скидка %';
    finalPriceColumn = 'Цена со СКИДКОЙ в бел.руб';
  }
  
  // Получаем значения колонок
  const hitRaw = row[hitColumn] || '';
  const hit = convertToBoolean(hitRaw);
  
  const popularRaw = row[popularColumn] || '';
  const popular = convertToBoolean(popularRaw);
  
  // Цены
  const basePriceRaw = row[priceColumn] || '';
  const basePrice = basePriceRaw ? parseFloat(String(basePriceRaw).replace(/[^\d.,]/g, '').replace(',', '.')) : null;
  
  const discountRaw = row[discountColumn] || '';
  const discount = discountRaw ? parseFloat(String(discountRaw).replace(/[^\d.,]/g, '').replace(',', '.')) : null;
  
  const finalPriceRaw = row[finalPriceColumn] || '';
  const finalPrice = finalPriceRaw ? parseFloat(String(finalPriceRaw).replace(/[^\d.,]/g, '').replace(',', '.')) : null;
  
  // Определяем цены: если есть скидка, то price = скидочная, oldPrice = базовая
  const price = discount && finalPrice ? finalPrice : basePrice;
  const oldPrice = discount && finalPrice ? basePrice : null;
  
  return {
    name,
    slug,
    height,
    price,
    oldPrice,
    discount,
    category: config.category,
    image,
    options: JSON.stringify(options),
    description: null,
    availability,
    hit,
    popular,
    new: false
  };
}

async function importMonuments(monumentType, filePath) {
  try {
    const config = MONUMENT_TYPES[monumentType];
    
    if (!config) {
      console.error(`❌ Неизвестный тип памятников: ${monumentType}`);
      console.error(`Доступные типы: ${Object.keys(MONUMENT_TYPES).join(', ')}`);
      process.exit(1);
    }
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📌 ИМПОРТ: ${config.description}`);
    console.log(`${'═'.repeat(80)}\n`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Файл не найден: ${filePath}`);
      process.exit(1);
    }
    
    // Читаем Excel файл
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
    console.log(`📊 Найдено листов в файле: ${sheetNames.length}`);
    console.log(`📋 Листы: ${sheetNames.join(', ')}\n`);
    
    // Определяем лист для чтения
    let sheetName = config.sheetName;
    
    if (!sheetName) {
      // Для составных используем первый лист
      sheetName = sheetNames[0];
      console.log(`📄 Используем лист: "${sheetName}"`);
    } else {
      // Проверяем наличие листа
      if (!sheetNames.includes(sheetName)) {
        console.error(`❌ Лист "${sheetName}" не найден в файле`);
        console.error(`Доступные листы: ${sheetNames.join(', ')}`);
        process.exit(1);
      }
      console.log(`📄 Обрабатываем лист: "${sheetName}"`);
    }
    
    // Читаем данные из листа
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      console.error(`❌ Лист "${sheetName}" не найден в файле`);
      process.exit(1);
    }
    const jsonData = worksheetToJsonRows(worksheet);
    
    console.log(`📊 Найдено строк данных: ${jsonData.length}\n`);
    
    if (jsonData.length === 0) {
      console.error(`❌ Лист пуст`);
      process.exit(1);
    }
    
    // Обрабатываем каждую строку
    const monumentsToImport = [];
    const errors = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      try {
        const monument = processMonumentRow(row, monumentType, i);
        
        if (monument) {
          monumentsToImport.push(monument);
        }
      } catch (error) {
        errors.push(`Строка ${i + 2}: ${error.message}`);
      }
    }
    
    console.log(`✅ Подготовлено памятников: ${monumentsToImport.length}/${jsonData.length}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Ошибки при обработке (${errors.length}):`);
      errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
      if (errors.length > 5) {
        console.log(`   ... и ещё ${errors.length - 5} ошибок`);
      }
      console.log('');
    }
    
    // Импортируем в БД с логикой UPSERT
    if (monumentsToImport.length > 0) {
      try {
        console.log(`🔄 Загружаю существующие памятники из БД...`);
        const existingMonuments = await db.select().from(config.table);
        console.log(`   Найдено ${existingMonuments.length} существующих памятников\n`);
        
        let created = 0;
        let updated = 0;
        const skipped = [];
        
        for (const newMonument of monumentsToImport) {
          // Ищем по slug или по name
          let existing = existingMonuments.find(m => m.slug === newMonument.slug);
          
          if (!existing) {
            // Если не найдено по slug, ищем по name
            existing = existingMonuments.find(m => m.name === newMonument.name);
          }
          
          if (existing) {
            // ОБНОВЛЯЕМ существующий памятник
            console.log(`   📝 Обновляю: "${newMonument.name}" (ID: ${existing.id})`);
            await db.update(config.table)
              .set(newMonument)
              .where({ id: existing.id });
            updated++;
          } else {
            // СОЗДАЁМ новый памятник
            console.log(`   ✨ Создаю: "${newMonument.name}"`);
            await db.insert(config.table).values(newMonument);
            created++;
          }
        }
        
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`📊 РЕЗУЛЬТАТЫ ИМПОРТА:`);
        console.log(`${'═'.repeat(80)}`);
        console.log(`✨ Создано памятников: ${created}`);
        console.log(`📝 Обновлено памятников: ${updated}`);
        console.log(`⏭️  Всего обработано: ${created + updated}`);
        
        if (skipped.length > 0) {
          console.log(`⚠️  Пропущено: ${skipped.length}`);
        }
        
        // Выводим примеры
        console.log(`\n📋 Примеры обработанных памятников:`);
        console.log(`${'─'.repeat(80)}`);
        monumentsToImport.slice(0, 3).forEach((monument, idx) => {
          const isNew = !existingMonuments.find(m => m.slug === monument.slug || m.name === monument.name);
          console.log(`\n${idx + 1}. ${monument.name}`);
          console.log(`   Статус: ${isNew ? '✨ НОВЫЙ' : '📝 ОБНОВЛЕН'}`);
          console.log(`   Slug: ${monument.slug}`);
          console.log(`   Изображение: ${monument.image}`);
          console.log(`   Высота: ${monument.height}`);
          console.log(`   Цена: ${monument.price}${monument.oldPrice ? ` (было ${monument.oldPrice})` : ''}`);
          console.log(`   Наличие: ${monument.availability}`);
          console.log(`   Хит: ${monument.hit ? '✅' : '❌'}, Популярный: ${monument.popular ? '✅' : '❌'}`);
        });
        
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`✅ ИМПОРТ ЗАВЕРШЕН УСПЕШНО!`);
        console.log(`${'═'.repeat(80)}\n`);
        
      } catch (error) {
        console.error(`❌ Ошибка при импорте:`, error.message);
        console.error(error);
        process.exit(1);
      }
    } else {
      console.error(`❌ Нет валидных памятников для импорта`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при импорте:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Получаем аргументы командной строки
const monumentType = process.argv[2];
const filePath = process.argv[3];

if (!monumentType || !filePath) {
  console.error(`
❌ Неверное использование скрипта

Синтаксис:
  node backend/scripts/import-monuments.js <тип> <файл>

Типы:
  - single      Одиночные памятники
  - double      Двойные памятники
  - composite   Составные памятники

Примеры:
  node backend/scripts/import-monuments.js single "Памятники1.xlsx"
  node backend/scripts/import-monuments.js double "Памятники1.xlsx"
  node backend/scripts/import-monuments.js composite "Составные.xlsx"
  `);
  process.exit(1);
}

// Запуск импорта
importMonuments(monumentType, filePath);
