const { eq, and } = require('drizzle-orm');
const { db } = require('./db');
const { seoTemplates } = require('../models/schema');

/**
 * Получить SEO template для категории
 */
async function getSeoTemplateForCategory(entityType, categoryKey) {
  try {
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

    return template.length > 0 ? template[0] : null;
  } catch (error) {
    console.error('Error getting SEO template:', error);
    return null;
  }
}

/**
 * Получить SEO данные с применением иерархии
 * Если нет entity SEO - применить template
 */
async function getAppliedSeoData(entityData, entityType, categoryKey) {
  // Если есть собственный SEO - вернуть его
  if (entityData.seoTitle || entityData.seoDescription || entityData.seoKeywords || entityData.ogImage) {
    return {
      seoTitle: entityData.seoTitle,
      seoDescription: entityData.seoDescription,
      seoKeywords: entityData.seoKeywords,
      ogImage: entityData.ogImage,
    };
  }

  // Иначе получить template
  const template = await getSeoTemplateForCategory(entityType, categoryKey);
  
  if (template) {
    return {
      seoTitle: template.seoTitle,
      seoDescription: template.seoDescription,
      seoKeywords: template.seoKeywords,
      ogImage: template.ogImage,
    };
  }

  // Если нет ни того ни другого - вернуть defaults
  return {
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImage: null,
  };
}

module.exports = {
  getSeoTemplateForCategory,
  getAppliedSeoData,
};
