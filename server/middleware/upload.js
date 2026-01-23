const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
// Use /tmp for Cloud Run compatibility
const uploadDir = path.join('/tmp'); // Cloud-Native Temp Dir
// Local fallback if /tmp doesn't exist (e.g. Windows dev)
const useLocal = !fs.existsSync('/tmp');
const activeDir = useLocal ? path.join(__dirname, '../uploads') : '/tmp';

if (useLocal && !fs.existsSync(activeDir)) {
    fs.mkdirSync(activeDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, activeDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp-original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept PDF, CSV, XLSX, and Images (JPG, PNG)
    const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.warn(`Blocked file type: ${file.mimetype}`);
        cb(new Error('Invalid file type. Only PDF, Excel, CSV, and Images allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = upload;
