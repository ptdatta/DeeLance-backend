// const path = require('path');

// const multer = require('multer');

// // Configure multer storage (although files will be deleted afterward)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '.././uploads'));
//   },
//   filename: (req, file, cb) => {
//     const fileExt = path.extname(file.originalname);
//     const uniqueId = Date.now();
//     const filename = `${file.originalname}-${uniqueId}${fileExt}`;
//     cb(null, filename);
//   },
// });

// const upload = multer({ storage });
// module.exports = { upload };

const path = require('path');
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '.././uploads')); // Store uploaded files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname); // Get file extension
    const uniqueId = Date.now(); // Create unique ID for each file
    const filename = `${file.originalname}-${uniqueId}${fileExt}`; // Final filename
    cb(null, filename);
  },
});

// File type validation (PDF, ZIP, and Images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', // PDF files
    'application/zip', // ZIP files
    'image/jpeg', // JPEG images
    'image/png', // PNG images
    'image/gif', // GIF images
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error('Only images (JPEG, PNG, GIF), PDFs, or ZIP files are allowed'),
      false,
    );
  }

  cb(null, true); // Accept the file
};

// File size limit (e.g., 10 MB max)
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = { upload };
