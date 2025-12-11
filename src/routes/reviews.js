const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

// Google Place ID для компании
const GOOGLE_PLACE_ID = 'ChIJHzEQ5jdxxUYRpiADXE1IZ88';

// Yandex Maps organization ID
const YANDEX_ORG_ID = '131130763398';

// Кэш для отзывов (чтобы не парсить каждый раз)
let reviewsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 час в миллисекундах

/**
 * Очистка кэша (для тестирования)
 */
function clearCache() {
  reviewsCache = null;
  cacheTimestamp = null;
  console.log('Cache cleared');
}

/**
 * Получение отзывов с Google Maps через Puppeteer (headless browser)
 * Полностью бесплатно, без регистраций и API ключей
 */
async function fetchGoogleReviews() {
  let browser = null;
  
  try {
    console.log('Starting Google Maps reviews scraping with Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--lang=ru-RU'
      ]
    });

    const page = await browser.newPage();
    
    // Устанавливаем viewport и user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Устанавливаем куки для обхода страницы согласия Google
    await page.setCookie({
      name: 'CONSENT',
      value: 'YES+cb.20210720-07-p0.en+FX+410',
      domain: '.google.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'None'
    }, {
      name: 'SOCS',
      value: 'CAESHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzIaAmVuIAEaBgiAo_CmBg',
      domain: '.google.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    });
    
    // Используем прямой URL к бизнесу через CID (Customer ID)
    // Этот формат обычно не требует согласия
    const url = `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`;
    console.log('Navigating to:', url);
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Ждём загрузки
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Проверяем, не попали ли мы на страницу согласия
      const pageUrl = page.url();
      console.log('Current URL:', pageUrl);
      
      if (pageUrl.includes('consent.google.com')) {
        console.log('Still on consent page despite cookies, Google Maps reviews unavailable');
        await browser.close();
        return [];
      }
      
      // Ищем и кликаем на кнопку отзывов
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, div[role="tab"]'));
          const reviewTab = buttons.find(b => {
            const text = b.textContent || '';
            return text.includes('Отзывы') || text.includes('отзыв') || text.includes('Reviews');
          });
          if (reviewTab) {
            reviewTab.click();
            console.log('Clicked on reviews tab');
          }
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.log('Could not find/click reviews button');
      }
      
      // Прокручиваем для загрузки отзывов
      await page.evaluate(() => {
        const scrollableElements = document.querySelectorAll('[role="main"], div[class*="scrollable"]');
        scrollableElements.forEach(el => {
          if (el) {
            for (let i = 0; i < 3; i++) {
              el.scrollTop = el.scrollHeight;
            }
          }
        });
        window.scrollBy(0, 1000);
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (navError) {
      console.error('Navigation error:', navError.message);
      await browser.close();
      return [];
    }

    // Парсим отзывы с множественными вариантами селекторов
    const reviews = await page.evaluate(() => {
      const results = [];
      
      // Пробуем все возможные селекторы для контейнеров отзывов
      const selectors = [
        'div.jftiEf',
        'div[data-review-id]',
        'div[jslog*="review"]',
        'div[class*="review-container"]',
        'div[data-attrid*="review"]',
        '[role="article"]'
      ];
      
      let reviewElements = [];
      for (const selector of selectors) {
        reviewElements = document.querySelectorAll(selector);
        if (reviewElements.length > 0) {
          console.log(`Found ${reviewElements.length} reviews using selector: ${selector}`);
          break;
        }
      }
      
      if (reviewElements.length === 0) {
        console.log('No review elements found with any selector');
        return [];
      }
      
      reviewElements.forEach((element, index) => {
        try {
          // Имя - пробуем все варианты
          let name = 'Аноним';
          const nameSelectors = [
            'div.d4r55',
            'button[aria-label]',
            'div[class*="author"]',
            'span[class*="author"]',
            'a[class*="author"]',
            'div[data-attrid*="author"]'
          ];
          
          for (const sel of nameSelectors) {
            const nameEl = element.querySelector(sel);
            if (nameEl) {
              const nameText = nameEl.getAttribute('aria-label') || nameEl.textContent;
              if (nameText && nameText.trim().length > 0 && nameText.length < 100) {
                name = nameText.trim();
                break;
              }
            }
          }

          // Рейтинг
          let rating = 5;
          const ratingSelectors = [
            'span.kvMYJc',
            'span[role="img"][aria-label*="звезд"]',
            'span[aria-label*="stars"]',
            'div[class*="rating"]'
          ];
          
          for (const sel of ratingSelectors) {
            const ratingEl = element.querySelector(sel);
            if (ratingEl) {
              const ariaLabel = ratingEl.getAttribute('aria-label') || '';
              const match = ariaLabel.match(/(\d+)/);
              if (match) {
                rating = parseInt(match[1]);
                break;
              }
            }
          }

          // Текст отзыва
          let text = '';
          const textSelectors = [
            'span.wiI7pd',
            'div.MyEned',
            'span[data-expandable-section]',
            'div[class*="review-text"]',
            'div[class*="review-content"]',
            'span[jslog*="review"]'
          ];
          
          for (const sel of textSelectors) {
            const textEl = element.querySelector(sel);
            if (textEl) {
              const textContent = textEl.textContent.trim();
              if (textContent && textContent.length > 10) {
                text = textContent;
                break;
              }
            }
          }

          // Дата
          let dateText = '';
          const dateSelectors = [
            'span.rsqaWe',
            'span[class*="date"]',
            'div[class*="date"]'
          ];
          
          for (const sel of dateSelectors) {
            const dateEl = element.querySelector(sel);
            if (dateEl) {
              dateText = dateEl.textContent;
              if (dateText) break;
            }
          }
          
          // Преобразуем дату
          let isoDate = new Date().toISOString();
          if (dateText) {
            if (dateText.includes('день') || dateText.includes('дня') || dateText.includes('дней')) {
              const days = parseInt(dateText.match(/\d+/)?.[0] || 0);
              const date = new Date();
              date.setDate(date.getDate() - days);
              isoDate = date.toISOString();
            } else if (dateText.includes('месяц') || dateText.includes('месяца') || dateText.includes('месяцев')) {
              const months = parseInt(dateText.match(/\d+/)?.[0] || 0);
              const date = new Date();
              date.setMonth(date.getMonth() - months);
              isoDate = date.toISOString();
            } else if (dateText.includes('год') || dateText.includes('года') || dateText.includes('лет')) {
              const years = parseInt(dateText.match(/\d+/)?.[0] || 0);
              const date = new Date();
              date.setFullYear(date.getFullYear() - years);
              isoDate = date.toISOString();
            }
          }

          // Аватар
          let avatar = null;
          const avatarSelectors = [
            'img.NBa7we',
            'img[src*="googleusercontent"]',
            'img[class*="avatar"]',
            'img[class*="profile"]'
          ];
          
          for (const sel of avatarSelectors) {
            const avatarEl = element.querySelector(sel);
            if (avatarEl && avatarEl.src) {
              avatar = avatarEl.src;
              break;
            }
          }

          // Добавляем если есть хоть что-то полезное
          if (text || (name !== 'Аноним' && name.length > 2)) {
            results.push({
              id: `google-${results.length}-${Date.now()}`,
              name: name,
              date: isoDate,
              rating: rating,
              text: text,
              source: 'Google Maps',
              avatar: avatar,
              photos: []
            });
          }
        } catch (error) {
          console.error('Error parsing review:', error.message);
        }
      });

      console.log(`Parsed ${results.length} Google reviews`);
      return results;
    });

    console.log(`Successfully scraped ${reviews.length} Google reviews`);
    await browser.close();
    return reviews;

  } catch (error) {
    console.error('Error fetching Google reviews with Puppeteer:', error.message);
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    return [];
  }
}

/**
 * Получение отзывов с Яндекс.Карт через Puppeteer
 */
async function fetchYandexReviews() {
  let browser = null;
  
  try {
    console.log('Starting Yandex Maps reviews scraping with Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=ru-RU'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9'
    });
    
    const url = `https://yandex.ru/maps/org/kamennaya_roza/${YANDEX_ORG_ID}/reviews`;
    console.log('Navigating to:', url);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Сохраняем для отладки
    await page.screenshot({ path: 'yandex-maps-debug.png', fullPage: true });
    const html = await page.content();
    require('fs').writeFileSync('yandex-maps-debug.html', html);
    console.log('Yandex debug files saved');

    // Прокручиваем для загрузки отзывов
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const reviews = await page.evaluate(() => {
      const results = [];
      const seenTexts = new Set(); // Для отслеживания дубликатов
      
      // Пробуем несколько вариантов селекторов для Яндекса
      console.log('Searching for Yandex reviews...');
      
      let reviewCards = [];
      
      // Вариант 1: Ищем по schema.org разметке
      const schemaReviews = document.querySelectorAll('[itemtype="http://schema.org/Review"]');
      console.log('Schema.org reviews:', schemaReviews.length);
      if (schemaReviews.length > 0) {
        reviewCards = Array.from(schemaReviews);
      }
      
      // Вариант 2: Ищем по классам бизнес-отзывов
      if (reviewCards.length === 0) {
        const businessReviews = document.querySelectorAll('[class*="business-review"]');
        console.log('Business review cards:', businessReviews.length);
        if (businessReviews.length > 0) {
          reviewCards = Array.from(businessReviews);
        }
      }
      
      // Вариант 3: Ищем любые блоки с отзывами
      if (reviewCards.length === 0) {
        const allReviews = document.querySelectorAll('[class*="review"]');
        console.log('All review elements:', allReviews.length);
        // Фильтруем только те, что содержат текст
        reviewCards = Array.from(allReviews).filter(el => {
          const text = el.textContent || '';
          return text.length > 50; // Минимальная длина отзыва
        });
      }
      
      console.log('Processing', reviewCards.length, 'review cards');

      reviewCards.forEach((card, index) => {
        try {
          // Имя автора - несколько вариантов
          let name = 'Аноним';
          const nameEl = card.querySelector('[itemprop="author"] [itemprop="name"]') || 
                        card.querySelector('[class*="business-review-view__author"]') ||
                        card.querySelector('[class*="author-name"]') ||
                        card.querySelector('[class*="user-name"]');
          if (nameEl) {
            name = nameEl.textContent.trim();
          }

          // Рейтинг
          let rating = 5;
          const ratingEl = card.querySelector('[itemprop="ratingValue"]') ||
                          card.querySelector('[class*="business-rating-badge-view__rating"]') ||
                          card.querySelector('[class*="rating"]');
          if (ratingEl) {
            const ratingValue = ratingEl.getAttribute('content') || ratingEl.textContent;
            rating = parseInt(ratingValue) || 5;
          }

          // Текст отзыва
          let text = '';
          const textEl = card.querySelector('[itemprop="reviewBody"]') ||
                        card.querySelector('[class*="business-review-view__body-text"]') ||
                        card.querySelector('[class*="review-text"]') ||
                        card.querySelector('[class*="comment"]');
          if (textEl) {
            text = textEl.textContent.trim();
          }

          // Дата
          let date = new Date().toISOString();
          const dateEl = card.querySelector('[itemprop="datePublished"]') ||
                        card.querySelector('[class*="business-review-view__date"]') ||
                        card.querySelector('[class*="review-date"]');
          if (dateEl) {
            const dateValue = dateEl.getAttribute('content') || dateEl.textContent;
            if (dateValue) {
              date = dateValue;
            }
          }

          // Аватар
          const avatarEl = card.querySelector('img[class*="user-icon"]') ||
                          card.querySelector('img[class*="avatar"]') ||
                          card.querySelector('[itemprop="image"]');
          const avatar = avatarEl ? avatarEl.src : null;

          // Проверяем на дубликаты и добавляем только уникальные отзывы с текстом
          if (text && text.length > 10 && !seenTexts.has(text)) {
            seenTexts.add(text);
            console.log(`Found Yandex review ${results.length}:`, name, rating, text.substring(0, 30));
            results.push({
              id: `yandex-${results.length}-${Date.now()}`,
              name: name,
              date: date,
              rating: rating,
              text: text,
              source: 'Яндекс.Карты',
              avatar: avatar,
              photos: []
            });
          }
        } catch (error) {
          console.error('Error parsing Yandex review:', error);
        }
      });

      console.log('Total Yandex reviews found:', results.length);
      return results;
    });

    console.log(`Successfully scraped ${reviews.length} Yandex reviews`);
    
    await browser.close();
    return reviews;

  } catch (error) {
    console.error('Error fetching Yandex reviews with Puppeteer:', error.message);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}

// GET /api/reviews - получить все отзывы
router.get('/', async (req, res) => {
  try {
    // Проверяем кэш
    const now = Date.now();
    if (reviewsCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('Returning cached reviews');
      return res.json({
        success: true,
        data: reviewsCache,
        total: reviewsCache.length,
        cached: true
      });
    }

    console.log('Fetching fresh reviews...');

    // Получаем отзывы параллельно (но это медленно, ~5-10 секунд)
    const [googleReviews, yandexReviews] = await Promise.all([
      fetchGoogleReviews(),
      fetchYandexReviews()
    ]);

    const allReviews = [...googleReviews, ...yandexReviews];

    // Сохраняем в кэш
    reviewsCache = allReviews;
    cacheTimestamp = now;

    res.json({
      success: true,
      data: allReviews,
      total: allReviews.length,
      cached: false
    });
  } catch (error) {
    console.error('Error in /api/reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

// GET /api/reviews/clear-cache - очистить кэш (для тестирования)
router.get('/clear-cache', (req, res) => {
  clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

module.exports = router;
