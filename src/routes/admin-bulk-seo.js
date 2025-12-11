const express = require('express');
const { eq, and, isNull, or } = require('drizzle-orm');
const { db } = require('../utils/db');
const {
  seoTemplates,
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
  complexMonuments,
  fences,
  accessories,
  landscape,
  campaigns,
  blogs,
} = require('../models/schema');

const router = express.Router();

// Маппинг категорий памятников на таблицы
const MONUMENT_CATEGORY_TABLES = {
  'exclusive': products,
  'single': singleMonuments,
  'double': doubleMonuments,
  'cheap': cheapMonuments,
  'cross': crossMonuments,
  'heart': heartMonuments,
  'composite': compositeMonuments,
  'europe': europeMonuments,
  'artistic': artisticMonuments,
  'tree': treeMonuments,
  'complex': complexMonuments,
};

// Маппинг типов сущностей на таблицы
const ENTITY_TYPE_TABLES = {
  'fences': fences,
  'accessories': accessories,
  'landscape': landscape,
  'campaigns': campaigns,
  'blogs': blogs,
};

// Маппинг categoryKey на реальные значения category в БД для оград
const FENCE_CATEGORY_MAPPING = {
  'granite': 'Гранитные ограды',
  'metal': 'Металлические ограды',
  'polymer': 'С полимерным покрытием',
};

// Маппинг categoryKey на реальные значения category в БД для аксессуаров
const ACCESSORIES_CATEGORY_MAPPING = {
  'vases': 'Вазы',
  'lamps': 'Лампады',
  'tables': 'Столы',
  'benches': 'Скамейки',
  'urns': 'Урны',
  'portrait': 'Портреты',
  'sculptures': 'Скульптуры',
};

// Маппинг categoryKey на реальные значения category в БД для благоустройства
const LANDSCAPE_CATEGORY_MAPPING = {
  'tiles': 'Плитка',
  'borders': 'Бордюры',
  'coverage': 'Покрытие',
  'foundation': 'Фундамент',
  'installation': 'Монтаж',
  'gravel': 'Щебень',
  'tables-benches': 'Столы и скамейки',
};

// Маппинг categoryKey памятников на реальные значения category в БД
// В БД у памятников хранятся русские названия, а не английские ключи
const MONUMENT_CATEGORY_NAME_MAPPING = {
  'exclusive': 'Эксклюзивные',
  'single': 'Одиночные',
  'double': 'Двойные',
  'cheap': 'Недорогие',
  'cross': 'В виде креста',
  'heart': 'В виде сердца',
  'composite': 'Составные',
  'europe': 'Европейские',
  'artistic': 'Художественная резка',
  'tree': 'В виде дерева',
  'complex': 'Мемориальные комплексы',
};

// Функция получения реального значения category из categoryKey
const getRealCategoryValue = (entityType, categoryKey) => {
  if (entityType === 'monuments') {
    return MONUMENT_CATEGORY_NAME_MAPPING[categoryKey] || categoryKey;
  }
  if (entityType === 'fences') {
    return FENCE_CATEGORY_MAPPING[categoryKey] || categoryKey;
  }
  if (entityType === 'accessories') {
    return ACCESSORIES_CATEGORY_MAPPING[categoryKey] || categoryKey;
  }
  if (entityType === 'landscape') {
    return LANDSCAPE_CATEGORY_MAPPING[categoryKey] || categoryKey;
  }
  return categoryKey;
};

/**
 * GET /api/admin/bulk-seo/preview/:entityType/:categoryKey
 * Предпросмотр изменений перед массовым обновлением
 */
router.get('/preview/:entityType/:categoryKey', async (req, res) => {
  try {
    const { entityType, categoryKey } = req.params;
    const { forceUpdate } = req.query;

    // Найти шаблон
    const template = await db
      .select()
      .from(seoTemplates)
      .where(
        and(
          eq(seoTemplates.entityType, entityType),
          eq(seoTemplates.categoryKey, categoryKey)
        )
      )
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SEO шаблон не найден для данной категории'
      });
    }

    // Определить таблицу для поиска
    let table;
    let whereCondition;

    if (entityType === 'monuments') {
      table = MONUMENT_CATEGORY_TABLES[categoryKey];
      if (!table) {
        return res.status(400).json({
          success: false,
          error: 'Неверная категория памятников'
        });
      }
    } else if (entityType === 'blogs' || entityType === 'campaigns') {
      table = ENTITY_TYPE_TABLES[entityType];
    } else {
      table = ENTITY_TYPE_TABLES[entityType];
      if (!table) {
        return res.status(400).json({
          success: false,
          error: 'Неверный тип сущности'
        });
      }
    }

    // Получить реальное значение категории для поиска в БД
    const realCategoryValue = getRealCategoryValue(entityType, categoryKey);
    
    // Условие для выборки записей
    if (forceUpdate === 'true') {
      // Все записи категории
      whereCondition = entityType === 'monuments' || (entityType !== 'blogs' && entityType !== 'campaigns')
        ? eq(table.category, realCategoryValue)
        : undefined;
    } else {
      // Только записи без SEO
      whereCondition = entityType === 'monuments' || (entityType !== 'blogs' && entityType !== 'campaigns')
        ? and(
            eq(table.category, realCategoryValue),
            or(
              isNull(table.seoTitle),
              eq(table.seoTitle, '')
            )
          )
        : or(
            isNull(table.seoTitle),
            eq(table.seoTitle, '')
          );
    }

    // Подсчитать количество записей
    const query = whereCondition 
      ? db.select().from(table).where(whereCondition)
      : db.select().from(table);
    
    const records = await query;
    const totalCount = records.length;
    
    // Подсчитать записи без SEO
    const withoutSeoQuery = entityType === 'monuments' || (entityType !== 'blogs' && entityType !== 'campaigns')
      ? db.select().from(table).where(
          and(
            eq(table.category, realCategoryValue),
            or(isNull(table.seoTitle), eq(table.seoTitle, ''))
          )
        )
      : db.select().from(table).where(
          or(isNull(table.seoTitle), eq(table.seoTitle, ''))
        );
    
    const withoutSeoRecords = await withoutSeoQuery;
    const withoutSeoCount = withoutSeoRecords.length;

    res.json({
      success: true,
      preview: {
        templateName: template[0].categoryName,
        entityType,
        categoryKey,
        totalInCategory: totalCount,
        withoutSeo: withoutSeoCount,
        willBeUpdated: forceUpdate === 'true' ? totalCount : withoutSeoCount,
        template: {
          seoTitle: template[0].seoTitle,
          seoDescription: template[0].seoDescription,
          seoKeywords: template[0].seoKeywords,
          ogImage: template[0].ogImage,
        }
      }
    });
  } catch (error) {
    console.error('Ошибка предпросмотра массового обновления SEO:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка предпросмотра массового обновления SEO'
    });
  }
});

/**
 * POST /api/admin/bulk-seo/update/:entityType/:categoryKey
 * Массовое обновление SEO для товаров/сущностей категории
 */
router.post('/update/:entityType/:categoryKey', async (req, res) => {
  try {
    const { entityType, categoryKey } = req.params;
    const { forceUpdate = false } = req.body;

    console.log(`[Bulk SEO Update] Starting for ${entityType}/${categoryKey}, force=${forceUpdate}`);

    // Найти шаблон
    const template = await db
      .select()
      .from(seoTemplates)
      .where(
        and(
          eq(seoTemplates.entityType, entityType),
          eq(seoTemplates.categoryKey, categoryKey)
        )
      )
      .limit(1);

    if (template.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'SEO шаблон не найден для данной категории'
      });
    }

    const seoTemplate = template[0];
    console.log('[Bulk SEO Update] Template found:', seoTemplate.categoryName);

    // Определить таблицу для обновления
    let table;
    if (entityType === 'monuments') {
      table = MONUMENT_CATEGORY_TABLES[categoryKey];
      if (!table) {
        return res.status(400).json({
          success: false,
          error: 'Неверная категория памятников'
        });
      }
    } else if (entityType === 'blogs' || entityType === 'campaigns') {
      table = ENTITY_TYPE_TABLES[entityType];
    } else {
      table = ENTITY_TYPE_TABLES[entityType];
      if (!table) {
        return res.status(400).json({
          success: false,
          error: 'Неверный тип сущности'
        });
      }
    }

    // Получить реальное значение категории для поиска в БД
    const realCategoryValue = getRealCategoryValue(entityType, categoryKey);
    
    // Получить записи для обновления
    let recordsToUpdate;
    
    if (forceUpdate) {
      // Принудительное обновление всех записей категории
      if (entityType === 'monuments' || (entityType !== 'blogs' && entityType !== 'campaigns')) {
        recordsToUpdate = await db
          .select()
          .from(table)
          .where(eq(table.category, realCategoryValue))
          .limit(1000); // Ограничение безопасности
      } else {
        // Для блогов и акций без категорий
        recordsToUpdate = await db
          .select()
          .from(table)
          .limit(1000);
      }
    } else {
      // Обновление только записей без SEO
      if (entityType === 'monuments' || (entityType !== 'blogs' && entityType !== 'campaigns')) {
        recordsToUpdate = await db
          .select()
          .from(table)
          .where(
            and(
              eq(table.category, realCategoryValue),
              or(
                isNull(table.seoTitle),
                eq(table.seoTitle, '')
              )
            )
          )
          .limit(1000);
      } else {
        recordsToUpdate = await db
          .select()
          .from(table)
          .where(
            or(
              isNull(table.seoTitle),
              eq(table.seoTitle, '')
            )
          )
          .limit(1000);
      }
    }

    console.log(`[Bulk SEO Update] Found ${recordsToUpdate.length} records to update`);

    if (recordsToUpdate.length === 0) {
      return res.json({
        success: true,
        stats: {
          total: 0,
          updated: 0,
          skipped: 0,
          errors: 0
        },
        message: 'Нет записей для обновления'
      });
    }

    // Выполнить массовое обновление
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    // Обновляем в транзакции (батчами по 100)
    const batchSize = 100;
    for (let i = 0; i < recordsToUpdate.length; i += batchSize) {
      const batch = recordsToUpdate.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          // Пропустить если не принудительное обновление и SEO уже заполнено
          if (!forceUpdate && record.seoTitle && record.seoTitle.trim() !== '') {
            skipped++;
            continue;
          }

          await db
            .update(table)
            .set({
              seoTitle: seoTemplate.seoTitle,
              seoDescription: seoTemplate.seoDescription,
              seoKeywords: seoTemplate.seoKeywords,
              ogImage: seoTemplate.ogImage || null,
            })
            .where(eq(table.id, record.id));

          updated++;
        } catch (err) {
          console.error(`[Bulk SEO Update] Error updating record ${record.id}:`, err);
          errors++;
          errorDetails.push({
            id: record.id,
            error: err.message
          });
        }
      }
    }

    console.log(`[Bulk SEO Update] Completed: ${updated} updated, ${skipped} skipped, ${errors} errors`);

    res.json({
      success: true,
      stats: {
        total: recordsToUpdate.length,
        updated,
        skipped,
        errors
      },
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      message: `Успешно обновлено ${updated} записей`
    });
  } catch (error) {
    console.error('Ошибка массового обновления SEO:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка массового обновления SEO',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/bulk-seo/check-template/:entityType/:categoryKey
 * Проверить наличие шаблона для категории
 */
router.get('/check-template/:entityType/:categoryKey', async (req, res) => {
  try {
    const { entityType, categoryKey } = req.params;

    const template = await db
      .select()
      .from(seoTemplates)
      .where(
        and(
          eq(seoTemplates.entityType, entityType),
          eq(seoTemplates.categoryKey, categoryKey)
        )
      )
      .limit(1);

    res.json({
      success: true,
      hasTemplate: template.length > 0,
      template: template.length > 0 ? {
        id: template[0].id,
        categoryName: template[0].categoryName,
        seoTitle: template[0].seoTitle,
        seoDescription: template[0].seoDescription,
      } : null
    });
  } catch (error) {
    console.error('Ошибка проверки шаблона:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка проверки шаблона'
    });
  }
});

module.exports = router;
