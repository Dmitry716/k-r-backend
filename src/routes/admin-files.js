const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/admin/images?folder=fences - получить список изображений из указанной папки
router.get('/images', (req, res) => {
  try {
    const { folder } = req.query;
    
    if (!folder) {
      return res.status(400).json({
        success: false,
        error: 'Folder parameter is required'
      });
    }

    // Разрешенные папки для безопасности (точно как в старом коде)
    const allowedFolders = ['accessories', 'fences', 'landscape', 'promo', 'blog', 'campaigns', 'works', 'monuments', 'products', 'pages'];

    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder parameter'
      });
    }

    // Путь к public папке frontend проекта (на сервере будет /var/www/stonerose-frontend/public)
    const publicPath = '/var/www/stonerose-frontend/public/' + folder;
    
    let files = [];
    
    try {
      // Читаем содержимое папки
      const allItems = fs.readdirSync(publicPath);
      // Фильтруем только изображения и делаем полные пути
      files = allItems
        .filter(item => item.endsWith('.webp') || item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.jpeg'))
        .map(item => `https://k-r.by/api/static/${folder}/${item}`)
        .sort();
    } catch (error) {
      console.error(`Error reading folder ${folder}:`, error);
      // Если папка не существует, возвращаем пустой массив
      files = [];
    }

    res.json({ 
      success: true, 
      data: files 
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
});

// Upload функционал перенесен в /api/upload роут

module.exports = router;