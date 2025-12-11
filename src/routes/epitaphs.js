const express = require('express');
const { asc } = require('drizzle-orm');
const { db } = require('../utils/db');
const { epitaphs } = require('../models/schema');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const allEpitaphs = await db.select().from(epitaphs).orderBy(asc(epitaphs.id));
    res.json({ success: true, data: allEpitaphs });
  } catch (error) {
    console.error('Error fetching epitaphs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch epitaphs' });
  }
});

module.exports = router;