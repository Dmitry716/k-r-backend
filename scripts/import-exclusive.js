const ExcelJS = require("exceljs");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
const { config } = require("dotenv");

// Загружаем переменные окружения
config({ path: '.env.local' });

// === MATERIAL MAPPING (копия из ../scripts/materials-mapping.js) ===
const materialMapping = {
  Дымовский: { en: "DYMOVSKY", color: "#5C4033" },
  Амфиболит: { en: "AMFIBOLITGRANATOVY", color: "#4A3728" },
  Мансуровский: { en: "MANSUR", color: "#556B2F" },
  Покостовский: { en: "Pokost", color: "#696969" },
  "Балтик Грин": { en: "BALTICGREEN", color: "#228B22" },
  "Балморал Рэд": { en: "BALMORALRED", color: "#8B0000" },
  Аврора: { en: "AURORA", color: "#FFB6C1" },
  "Куру Грей": { en: "CURUGRAY", color: "#808080" },
  Лезниковский: { en: "LEZNIKI", color: "#505050" },
  "Блю Перл": { en: "BluePearl", color: "#1E90FF" },
  Амадеус: { en: "AMADEUS", color: "#CD7F32" },
  Мрамор: { en: "MUGLAWHITE", color: "#F5F5DC" },
};

// === GET CELL VALUE (handles formulas) ===
function getCellValue(cell) {
  if (!cell || !cell.value) return null;

  // If it's a formula cell with result
  if (typeof cell.value === "object" && cell.value.result) {
    return String(cell.value.result).trim();
  }

  // If it's a regular string
  if (typeof cell.value === "string") {
    return cell.value.trim();
  }

  // If it's a number
  if (typeof cell.value === "number") {
    return String(cell.value);
  }

  // Try to convert to string
  try {
    return String(cell.value).trim();
  } catch (e) {
    return null;
  }
}

// === CHECK IF CELL HAS RED BACKGROUND (default color indicator) ===
function isCellRed(cell) {
  if (!cell || !cell.fill) return false;
  const fill = cell.fill;

  try {
    // Check pattern fill with red color
    if (fill.type === "pattern" && fill.pattern === "solid") {
      const argb = fill.fgColor?.argb || "";
      const rgb = fill.fgColor?.rgb || "";

      // ARGB format: FFFF0000 (alpha + red), or just FF0000
      return (
        argb === "FFFF0000" ||
        argb === "FF0000" ||
        rgb === "FF0000" ||
        argb?.includes("FF0000") ||
        rgb?.includes("FF0000")
      );
    }

    // Check solid fill with red
    if (fill.type === "solid") {
      const argb = fill.fgColor?.argb || "";
      const rgb = fill.fgColor?.rgb || "";
      return (
        argb === "FFFF0000" ||
        argb === "FF0000" ||
        rgb === "FF0000" ||
        argb?.includes("FF0000") ||
        rgb?.includes("FF0000")
      );
    }
  } catch (e) {
    return false;
  }

  return false;
}

// === GENERATE SLUG ===
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[а-я]/g, (char) => {
      const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// === GET IMAGE PATH ===
function getImagePath(modelNum, material) {
  const materialData = materialMapping[material] || {
    en: material.toUpperCase(),
    color: "#A9A9A9",
  };
  const modelNumDigits = String(modelNum).replace(/[^\d]/g, "");
  return `/Эксклюзивные/K${modelNumDigits}_${materialData.en}/800x800/frame_0001.jpg`;
}

// === PARSE SIZE ===
function parseSizes(sizeStr) {
  if (!sizeStr) return { length: 0, width: 0, height: 0 };

  let parts;
  if (String(sizeStr).includes("/")) {
    parts = String(sizeStr)
      .split("/")
      .map((p) => parseInt(p.trim(), 10));
  } else {
    parts = String(sizeStr)
      .replace(/[xх]/gi, "/")
      .replace(/,/g, ".")
      .split("/")
      .map((p) => parseInt(p.trim(), 10));
  }

  return {
    length: parts[0] || 0,
    width: parts[1] || 0,
    height: parts[2] || 0,
  };
}

// === MAIN IMPORT FUNCTION ===
async function importExclusive() {
  console.log("🚀 Starting import from Эксклюзивные.xlsx...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL не найден в .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
  });

  try {
    // Ищем файл в текущей директории или папке data
    let excelPath = path.join(process.cwd(), "Эксклюзивные.xlsx");
    if (!fs.existsSync(excelPath)) {
      excelPath = path.join(process.cwd(), "data", "Эксклюзивные.xlsx");
    }
    if (!fs.existsSync(excelPath)) {
      excelPath = path.join(process.cwd(), "../data", "Эксклюзивные.xlsx");
    }

    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Excel file not found: Эксклюзивные.xlsx`);
      console.error(`   Ищу в: ${excelPath}`);
      process.exit(1);
    }

    // === READ EXCEL WITH STYLES ===
    console.log("📖 Reading Excel file with ExcelJS...");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    console.log("📋 Проверяю таблицу products...");

    // Проверяем существование колонок и добавляем их если не существуют
    const columnsToCheck = ['description', 'availability', 'hit', 'popular', 'new'];

    for (const column of columnsToCheck) {
      try {
        const result = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = $1
        `, [column]);

        if (result.rows.length === 0) {
          console.log(`   ⚠️  Колонка "${column}" отсутствует, добавляю...`);

          let alterQuery = '';
          switch (column) {
            case 'description':
              alterQuery = `ALTER TABLE products ADD COLUMN description TEXT`;
              break;
            case 'availability':
              alterQuery = `ALTER TABLE products ADD COLUMN availability VARCHAR(100) DEFAULT 'под заказ'`;
              break;
            case 'hit':
              alterQuery = `ALTER TABLE products ADD COLUMN hit BOOLEAN DEFAULT false`;
              break;
            case 'popular':
              alterQuery = `ALTER TABLE products ADD COLUMN popular BOOLEAN DEFAULT false`;
              break;
            case 'new':
              alterQuery = `ALTER TABLE products ADD COLUMN new BOOLEAN DEFAULT false`;
              break;
          }

          await pool.query(alterQuery);
          console.log(`      ✓ Колонка "${column}" добавлена`);
        }
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`   ⚠️  Ошибка при проверке колонки ${column}:`, error.message);
        }
      }
    }

    console.log("✓ Таблица products проверена и готова\n");

    const products = [];
    let sheetIndex = 0;

    // === PROCESS EACH SHEET ===
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;

      // Skip header sheet
      if (sheetName === "Sheet1" || !sheetName.match(/^К\d+/)) {
        continue;
      }

      console.log(`📄 Processing sheet: ${sheetName}`);
      sheetIndex++;

      const rows = [];
      let headerRow = null;

      // === READ DATA FROM SHEET ===
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          headerRow = row;
          return;
        }

        const material = getCellValue(row.getCell("A"));
        const availability = getCellValue(row.getCell("B"));
        const size = getCellValue(row.getCell("C"));
        const hitSales = getCellValue(row.getCell("D"));
        const popularProducts = getCellValue(row.getCell("E"));
        const price = Math.round(parseFloat(String(getCellValue(row.getCell("F")) || 0).replace(",", ".")) * 100) / 100;
        const discountPercent = parseInt(String(getCellValue(row.getCell("G")) || 0).replace(/[^0-9]/g, ""), 10) || 0;
        const priceWithDiscount = Math.round(parseFloat(String(getCellValue(row.getCell("H")) || 0).replace(",", ".")) * 100) / 100;

        // Check if this row has red background (default color)
        const isDefault = isCellRed(row.getCell("A"));

        if (material && material !== "Материал") {
          rows.push({
            material,
            availability,
            size,
            hitSales,
            popularProducts,
            price,
            discountPercent,
            priceWithDiscount,
            isDefault,
          });
        }
      });

      if (rows.length === 0) {
        console.log(`   ⚠ No valid rows found\n`);
        continue;
      }

      console.log(`   ✓ Parsed ${rows.length} materials`);

      // === CREATE PRODUCT ===
      // Sort materials: default first, then others
      const defaultMaterial = rows.find((r) => r.isDefault);
      const otherMaterials = rows.filter((r) => !r.isDefault);
      const sortedRows = defaultMaterial ? [defaultMaterial, ...otherMaterials] : rows;

      // Use default material for base price, or first material if no default
      const baseRow = defaultMaterial || rows[0];
      const sizes = parseSizes(baseRow.size);

      // Build colors array - FILTER ONLY 12 ACTIVE MATERIALS
      const colors = sortedRows
        .filter((row) => {
          // Only include materials in our mapping (12 active materials)
          if (!materialMapping[row.material]) {
            return false;
          }

          // Check if folder exists
          const materialData = materialMapping[row.material];
          const modelNumDigits = String(sheetName).replace(/[^\d]/g, "");
          const folderPath = path.join(
            process.cwd(),
            "public",
            "Эксклюзивные",
            `K${modelNumDigits}_${materialData.en}`
          );
          return fs.existsSync(folderPath);
        })
        .map((row) => {
          const materialData = materialMapping[row.material];

          // Calculate oldPrice and discount for this specific material
          let oldPrice = null;
          let discount = null;
          if (row.discountPercent > 0) {
            discount = row.discountPercent;
            oldPrice = Math.round(row.priceWithDiscount / (1 - row.discountPercent / 100));
          }

          return {
            name: row.material,
            color: materialData.color,
            image: getImagePath(sheetName, row.material),
            price: row.priceWithDiscount || row.price,
            oldPrice,
            discount,
          };
        });

      if (colors.length === 0) {
        console.log(`   ⚠ No valid materials with existing folders\n`);
        continue;
      }

      const productName = `Эксклюзивный памятник ${sheetName}`;
      const slug = generateSlug(productName);

      // Calculate old price if discount exists
      let oldPrice = null;
      let discount = null;
      if (baseRow.discountPercent > 0) {
        discount = baseRow.discountPercent;
        oldPrice = Math.round(baseRow.priceWithDiscount / (1 - baseRow.discountPercent / 100));
      }

      const options = {
        "Наличие": baseRow.availability || "под заказ",
        "Общая длина": `${sizes.length} см`,
        "Общая ширина": `${sizes.width} см`,
        "Общая высота": `${sizes.height} см`,
      };

      const product = {
        slug,
        name: productName,
        height: sizes.height > 0 ? `${sizes.height} см` : undefined,
        price: baseRow.priceWithDiscount || baseRow.price,
        oldPrice,
        discount,
        category: "Эксклюзивные",
        image: colors[0].image, // First color (default)
        colors,
        options,
        description: null,
        availability: baseRow.availability || "под заказ",
        hit: false,
        popular: false,
        new: false
      };

      products.push(product);
      console.log(`   ✓ Created: ${product.name}`);
      console.log(`   📦 Materials: ${product.colors.length}`);
      console.log("");
    }

    console.log(`\n💾 Обработка ${products.length} товаров...\n`);

    // Загружаем существующие товары
    const existingResult = await pool.query("SELECT id, slug, name FROM products WHERE category = $1", ["Эксклюзивные"]);
    const existingProducts = existingResult.rows;

    let insertedCount = 0;
    let updatedCount = 0;

    for (const product of products) {
      try {
        // Ищем по slug или по name
        let existing = existingProducts.find(p => p.slug === product.slug);

        if (!existing) {
          // Если не найдено по slug, ищем по name
          existing = existingProducts.find(p => p.name === product.name);
        }

        if (existing) {
          // ОБНОВЛЯЕМ существующий товар
          console.log(`   📝 Обновляю: "${product.name}" (ID: ${existing.id})`);
          await pool.query(
            `UPDATE products 
             SET slug = $1, name = $2, height = $3, price = $4, old_price = $5, 
                 discount = $6, category = $7, image = $8, colors = $9, options = $10,
                 description = $11, availability = $12, hit = $13, popular = $14, new = $15
             WHERE id = $16`,
            [
              product.slug,
              product.name,
              product.height,
              product.price,
              product.oldPrice,
              product.discount,
              product.category,
              product.image,
              JSON.stringify(product.colors),
              JSON.stringify(product.options),
              product.description,
              product.availability,
              product.hit,
              product.popular,
              product.new,
              existing.id
            ]
          );
          updatedCount++;
        } else {
          // СОЗДАЁМ новый товар
          console.log(`   ✨ Создаю: "${product.name}"`);
          await pool.query(
            `INSERT INTO products (slug, name, height, price, old_price, discount, category, image, colors, options, description, availability, hit, popular, new)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              product.slug,
              product.name,
              product.height,
              product.price,
              product.oldPrice,
              product.discount,
              product.category,
              product.image,
              JSON.stringify(product.colors),
              JSON.stringify(product.options),
              product.description,
              product.availability,
              product.hit,
              product.popular,
              product.new
            ]
          );
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Ошибка при обработке ${product.name}:`, error.message);
      }
    }

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📊 РЕЗУЛЬТАТЫ ИМПОРТА:`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`✨ Создано товаров: ${insertedCount}`);
    console.log(`📝 Обновлено товаров: ${updatedCount}`);
    console.log(`⏭️  Всего обработано: ${insertedCount + updatedCount}`);

    // === SUMMARY ===
    const result = await pool.query("SELECT COUNT(*) as count FROM products WHERE category = $1", ["Эксклюзивные"]);
    const totalInDb = result.rows[0].count;

    console.log(`\n📊 В базе данных:`);
    console.log(`   Всего эксклюзивных памятников: ${totalInDb}`);
    console.log(`   Всего листов обработано: ${sheetIndex}`);
    console.log(`   Товаров создано в этом запуске: ${insertedCount}`);
    console.log(`   Товаров обновлено в этом запуске: ${updatedCount}`);

    await pool.end();

    console.log("\n" + "═".repeat(80));
    console.log("✅ ИМПОРТ ЗАВЕРШЕН УСПЕШНО!");
    console.log("═".repeat(80) + "\n");
  } catch (error) {
    console.error("❌ Import failed:", error);
    await pool.end();
    process.exit(1);
  }
}

// === RUN ===
importExclusive().catch((error) => {
  console.error("❌ Import failed:", error);
  process.exit(1);
});
