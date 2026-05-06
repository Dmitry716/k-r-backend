const ExcelJS = require('exceljs');
const path = require('path');

// Путь к файлу Excel
const excelPath = path.join(__dirname, '../../../frontend/exclusive.xlsx');

try {
  // Читаем файл
  const workbook = new ExcelJS.Workbook();
  workbook.xlsx.readFile(excelPath).then(() => {
    // Получаем первый лист
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      console.log('Файл пустой');
      return;
    }

    const rows = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const rowValues = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowValues[colNumber - 1] = cell.value?.result ?? cell.value ?? '';
      });
      rows.push(rowValues);
    });

    if (rows.length === 0) {
      console.log('Файл пустой');
      return;
    }

    // Первая строка - заголовки
    const headers = rows[0];
    console.log('Колонки в таблице:');
    headers.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`);
    });

    console.log(`\nВсего строк данных: ${rows.length - 1}`);

    // Показать первые 3 строки данных для примера
    if (rows.length > 1) {
      console.log('\nПример данных (первые 3 строки):');
      for (let i = 1; i <= Math.min(3, rows.length - 1); i++) {
        console.log(`Строка ${i}:`, rows[i]);
      }
    }
  }).catch((error) => {
    console.error('Ошибка при чтении файла:', error.message);
  });
} catch (error) {
  console.error('Ошибка при чтении файла:', error.message);
}