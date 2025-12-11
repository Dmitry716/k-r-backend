const { db } = require('../src/utils/db');
const { 
  fences, 
  accessories, 
  landscape,
  products,
  singleMonuments,
  doubleMonuments,
  cheapMonuments,
  crossMonuments,
  heartMonuments,
  compositeMonuments,
  europeMonuments,
  artisticMonuments,
  treeMonuments,
  complexMonuments
} = require('../src/models/schema');

async function checkCategories() {
  try {
    console.log('=== ПРОВЕРКА РЕАЛЬНЫХ КАТЕГОРИЙ В БД ===\n');

    // Ограды
    console.log('📌 ОГРАДЫ (fences):');
    const fencesData = await db.select().from(fences).limit(100);
    const fenceCategories = [...new Set(fencesData.map(f => f.category))];
    fenceCategories.forEach(cat => {
      const count = fencesData.filter(f => f.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Аксессуары
    console.log('\n📌 АКСЕССУАРЫ (accessories):');
    const accessoriesData = await db.select().from(accessories).limit(100);
    const accessoryCategories = [...new Set(accessoriesData.map(a => a.category))];
    accessoryCategories.forEach(cat => {
      const count = accessoriesData.filter(a => a.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Благоустройство
    console.log('\n📌 БЛАГОУСТРОЙСТВО (landscape):');
    const landscapeData = await db.select().from(landscape).limit(100);
    const landscapeCategories = [...new Set(landscapeData.map(l => l.category))];
    landscapeCategories.forEach(cat => {
      const count = landscapeData.filter(l => l.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Эксклюзивные памятники
    console.log('\n📌 ЭКСКЛЮЗИВНЫЕ ПАМЯТНИКИ (products):');
    const productsData = await db.select().from(products).limit(100);
    const productCategories = [...new Set(productsData.map(p => p.category))];
    productCategories.forEach(cat => {
      const count = productsData.filter(p => p.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Одиночные памятники
    console.log('\n📌 ОДИНОЧНЫЕ ПАМЯТНИКИ (single_monuments):');
    const singleData = await db.select().from(singleMonuments).limit(100);
    const singleCategories = [...new Set(singleData.map(s => s.category))];
    singleCategories.forEach(cat => {
      const count = singleData.filter(s => s.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Двойные памятники
    console.log('\n📌 ДВОЙНЫЕ ПАМЯТНИКИ (double_monuments):');
    const doubleData = await db.select().from(doubleMonuments).limit(100);
    const doubleCategories = [...new Set(doubleData.map(d => d.category))];
    doubleCategories.forEach(cat => {
      const count = doubleData.filter(d => d.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Недорогие памятники
    console.log('\n📌 НЕДОРОГИЕ ПАМЯТНИКИ (cheap_monuments):');
    const cheapData = await db.select().from(cheapMonuments).limit(100);
    const cheapCategories = [...new Set(cheapData.map(c => c.category))];
    cheapCategories.forEach(cat => {
      const count = cheapData.filter(c => c.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Кресты
    console.log('\n📌 ПАМЯТНИКИ-КРЕСТЫ (cross_monuments):');
    const crossData = await db.select().from(crossMonuments).limit(100);
    const crossCategories = [...new Set(crossData.map(c => c.category))];
    crossCategories.forEach(cat => {
      const count = crossData.filter(c => c.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Сердца
    console.log('\n📌 ПАМЯТНИКИ-СЕРДЦА (heart_monuments):');
    const heartData = await db.select().from(heartMonuments).limit(100);
    const heartCategories = [...new Set(heartData.map(h => h.category))];
    heartCategories.forEach(cat => {
      const count = heartData.filter(h => h.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Составные
    console.log('\n📌 СОСТАВНЫЕ ПАМЯТНИКИ (composite_monuments):');
    const compositeData = await db.select().from(compositeMonuments).limit(100);
    const compositeCategories = [...new Set(compositeData.map(c => c.category))];
    compositeCategories.forEach(cat => {
      const count = compositeData.filter(c => c.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Европейские
    console.log('\n📌 ЕВРОПЕЙСКИЕ ПАМЯТНИКИ (europe_monuments):');
    const europeData = await db.select().from(europeMonuments).limit(100);
    const europeCategories = [...new Set(europeData.map(e => e.category))];
    europeCategories.forEach(cat => {
      const count = europeData.filter(e => e.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Художественные
    console.log('\n📌 ХУДОЖЕСТВЕННЫЕ ПАМЯТНИКИ (artistic_monuments):');
    const artisticData = await db.select().from(artisticMonuments).limit(100);
    const artisticCategories = [...new Set(artisticData.map(a => a.category))];
    artisticCategories.forEach(cat => {
      const count = artisticData.filter(a => a.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Деревья
    console.log('\n📌 ПАМЯТНИКИ-ДЕРЕВЬЯ (tree_monuments):');
    const treeData = await db.select().from(treeMonuments).limit(100);
    const treeCategories = [...new Set(treeData.map(t => t.category))];
    treeCategories.forEach(cat => {
      const count = treeData.filter(t => t.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    // Комплексы
    console.log('\n📌 МЕМОРИАЛЬНЫЕ КОМПЛЕКСЫ (complex_monuments):');
    const complexData = await db.select().from(complexMonuments).limit(100);
    const complexCategories = [...new Set(complexData.map(c => c.category))];
    complexCategories.forEach(cat => {
      const count = complexData.filter(c => c.category === cat).length;
      console.log(`  - "${cat}" (${count} шт.)`);
    });

    console.log('\n✅ Проверка завершена!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkCategories();
