const express = require('express');
const { appendConsentLog } = require('../utils/pd-journal');

const router = express.Router();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

async function sendTelegramMessage(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { sent: false, reason: 'Telegram is not configured' };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { sent: false, reason: errorText };
  }

  return { sent: true };
}

router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      source,
      consentAccepted,
      consentVersion,
      policyUrl,
      product,
    } = req.body || {};

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone is required' });
    }

    if (consentAccepted !== true) {
      return res.status(400).json({ error: 'Consent is required' });
    }

    const now = new Date().toISOString();
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referer = req.headers.referer || req.headers.referrer || null;

    const consentLogEntry = {
      type: 'personal_data_consent',
      createdAt: now,
      source: source || 'unknown',
      person: {
        name: name || null,
        phone,
      },
      consent: {
        accepted: true,
        version: consentVersion || 'policy-v1',
        policyUrl: policyUrl || '/policy',
      },
      context: {
        ip: clientIp,
        userAgent,
        referer,
      },
      product: product || null,
    };

    appendConsentLog(consentLogEntry);

    let telegramText = `📞 Новая заявка\n\n`;
    telegramText += `Источник: ${source || 'unknown'}\n`;
    telegramText += `Имя: ${name || 'Клиент'}\n`;
    telegramText += `Телефон: ${phone}\n`;
    telegramText += `Согласие ПД: да (${consentVersion || 'policy-v1'})\n`;
    telegramText += `IP: ${clientIp}`;

    if (product && product.name) {
      telegramText += `\nТовар: ${product.name}`;
      if (product.category) telegramText += `\nКатегория: ${product.category}`;
      if (product.price) telegramText += `\nЦена: ${product.price}`;
    }

    const telegramResult = await sendTelegramMessage(telegramText);

    return res.json({
      success: true,
      consentLogged: true,
      telegramSent: telegramResult.sent,
      telegramReason: telegramResult.reason || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to process lead request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
