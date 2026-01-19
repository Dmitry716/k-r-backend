const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Простая настройка multer - как в оригинале
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /upload - точно как в оригинальном route.ts
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const folder = req.body.folder;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file provided"
      });
    }

    if (!folder || !["accessories", "fences", "landscape", "promo", "products", "blog", "campaigns", "works", "monuments", "pages"].includes(folder)) {
      return res.status(400).json({
        success: false,
        error: "Invalid folder parameter"
      });
    }

    // Проверяем расширение файла
    const allowedExtensions = [".webp", ".png", ".jpg", ".jpeg"];
    const fileExtension = "." + file.originalname.split(".").pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        error: "Only .webp, .png, .jpg files are allowed"
      });
    }

    // Путь для сохранения - в public папку фронтенда
    const publicPath = path.join(process.env.FRONTEND_PUBLIC_PATH, folder);
    
    // Создаем папку если её нет
    try {
      await fs.mkdir(publicPath, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
    }

    // Сохраняем файл с оригинальным названием
    const filePath = path.join(publicPath, file.originalname);
    const buffer = await fs.readFile(req.file.path);
    await fs.writeFile(filePath, buffer);

    // Удаляем временный файл
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        filename: file.originalname,
        path: `https://k-r.by/api/static/${folder}/${file.originalname}`
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: "Failed to upload file"
    });
  }
});

module.exports = router;