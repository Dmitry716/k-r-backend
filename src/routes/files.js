const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/files/images?folder=fences - получить список изображений из указанной папки
router.get('/images', (req, res) => {
  try {
    const { folder } = req.query;
    
    if (!folder) {
      return res.status(400).json({
        success: false,
        error: 'Folder parameter is required'
      });
    }

    // Разрешенные папки для безопасности
    const allowedFolders = [
      'accessories', 'fences', 'landscape', 'blog', 'campaigns', 
      'works', 'monuments', 'products', 'promo', 'sliders'
    ];

    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid folder name'
      });
    }

    const targetDir = path.join(process.cwd(), '..', 'frontend', 'public', folder);
    
    let files = [];
    
    try {
      // Получаем список всех файлов в указанной папке
      files = fs.readdirSync(targetDir).filter(file => {
        // Фильтруем только изображения
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
      }).map(file => {
        // Возвращаем полный путь для использования в img src
        return `/${folder}/${file}`;
      });
    } catch (error) {
      // Если папки не существует, создадим пустой массив
      console.log(`Directory ${folder} not found, returning empty array`);
      files = [];
    }

    res.json({ 
      success: true, 
      data: files.sort() 
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read directory'
    });
  }
});

// GET /api/files/works - получить список файлов из папки works
router.get('/works', (req, res) => {
  try {
    const worksDir = path.join(process.cwd(), '..', 'frontend', 'public', 'works');
    
    let files = [];
    
    try {
      // Получаем список всех файлов в папке /public/works
      files = fs.readdirSync(worksDir).filter(file => {
        // Фильтруем только изображения
        return /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
      });
    } catch (error) {
      // Если папки не существует, создадим пустой массив
      console.log('Works directory not found, returning empty array');
      files = [];
    }

    res.json({ 
      success: true, 
      files: files.sort() 
    });
  } catch (error) {
    console.error('Error reading works directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read works directory'
    });
  }
});

module.exports = router;