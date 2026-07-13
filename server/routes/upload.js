const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = path.join(uploadDir, req.body.type || 'general');
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    // Some devices/browsers upload with generic MIME for known file extensions.
    'application/octet-stream',
  ];

  const extension = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  const hasAllowedExtension = allowedExtensions.includes(extension);
  const hasAllowedMime = allowedMimes.includes(mime);

  if (hasAllowedExtension || hasAllowedMime) {
    cb(null, true);
    return;
  }

  cb(new Error('File type not supported. Please upload JPG, PNG, GIF or PDF.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const fileUrl = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

module.exports = router;
