const XLSX = require('xlsx');
const path = require('path');

// Путь к файлу Excel
const excelPath = path.join(__dirname, '../../../frontend/exclusive.xlsx');

try {
  // Читаем файл
  const workbook = XLSX.readFile(excelPath);

  // Получаем первый лист
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Конвертируем в JSON
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length === 0) {
    console.log('Файл пустой');
    return;
  }

  // Первая строка - заголовки
  const headers = data[0];
  console.log('Колонки в таблице:');
  headers.forEach((header, index) => {
    console.log(`${index + 1}. ${header}`);
  });

  console.log(`\nВсего строк данных: ${data.length - 1}`);

  // Показать первые 3 строки данных для примера
  if (data.length > 1) {
    console.log('\nПример данных (первые 3 строки):');
    for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
      console.log(`Строка ${i}:`, data[i]);
    }
  }

} catch (error) {
  console.error('Ошибка при чтении файла:', error.message);
}