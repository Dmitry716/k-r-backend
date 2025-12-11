const https = require('https');

const API_URL = 'https://k-r.by/api';

async function checkCategoriesViaAPI() {
  console.log('=== ПРОВЕРКА КАТЕГОРИЙ ЧЕРЕЗ API ===\n');

  // Проверка оград
  console.log('📌 ОГРАДЫ (fences):');
  const fencesResp = await fetch(`${API_URL}/fences`);
  const fencesData = await fencesResp.json();
  if (fencesData.success) {
    const categories = [...new Set(fencesData.data.map(f => f.category))];
    categories.forEach(cat => {
      const count = fencesData.data.filter(f => f.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });
  }

  // Проверка аксессуаров
  console.log('\n📌 АКСЕССУАРЫ (accessories):');
  const accessoriesResp = await fetch(`${API_URL}/accessories`);
  const accessoriesData = await accessoriesResp.json();
  if (accessoriesData.success) {
    const categories = [...new Set(accessoriesData.data.map(a => a.category))];
    categories.forEach(cat => {
      const count = accessoriesData.data.filter(a => a.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });
  }

  // Проверка благоустройства
  console.log('\n📌 БЛАГОУСТРОЙСТВО (landscape):');
  const landscapeResp = await fetch(`${API_URL}/landscape`);
  const landscapeData = await landscapeResp.json();
  if (landscapeData.success) {
    const categories = [...new Set(landscapeData.data.map(l => l.category))];
    categories.forEach(cat => {
      const count = landscapeData.data.filter(l => l.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });
  }

  // Проверка эксклюзивных памятников
  console.log('\n📌 ЭКСКЛЮЗИВНЫЕ ПАМЯТНИКИ (products):');
  const productsResp = await fetch(`${API_URL}/monuments?category=exclusive`);
  const productsData = await productsResp.json();
  if (productsData.success && productsData.data) {
    const categories = [...new Set(productsData.data.map(p => p.category))];
    categories.forEach(cat => {
      const count = productsData.data.filter(p => p.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });
  }

  // Проверка одиночных памятников
  console.log('\n📌 ОДИНОЧНЫЕ ПАМЯТНИКИ (single):');
  const singleResp = await fetch(`${API_URL}/monuments?category=single`);
  const singleData = await singleResp.json();
  if (singleData.success && singleData.data) {
    const categories = [...new Set(singleData.data.map(s => s.category))];
    categories.forEach(cat => {
      const count = singleData.data.filter(s => s.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });
  }

  // Проверка двойных памятников
  console.log('\n📌 ДВОЙНЫЕ ПАМЯТНИКИ (double):');
  const doubleResp = await fetch(`${API_URL}/monuments?category=double`);
  const doubleData = await doubleResp.json();
  if (doubleData.success && doubleData.data) {
    const categories = [...new Set(doubleData.data.map(d => d.category))];
    categories.forEach(cat => {
      const count = doubleData.data.filter(d => d.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });
  }

  console.log('\n✅ Проверка завершена!');
}

checkCategoriesViaAPI().catch(console.error);
