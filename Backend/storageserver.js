const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Create upload directories at startup (more efficient)
const uploadDirs = ['all', 'documents', 'images', 'others'];
uploadDirs.forEach(dir => {
  fs.mkdirSync(path.join(__dirname, 'uploads', dir), { recursive: true });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads', 'all'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(file.originalname).toLowerCase();
    let category = 'others';

    if (['.pdf', '.docx'].includes(ext)) category = 'documents';
    else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) category = 'images';

    const targetPath = path.join(__dirname, 'uploads', category, file.filename);
    fs.renameSync(file.path, targetPath);

    res.json({ 
      success: true,
      message: 'File uploaded successfully',
      category,
      path: `/uploads/${category}/${file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
});
