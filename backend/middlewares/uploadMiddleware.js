const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `photo-${uniqueSuffix}${ext}`);
    },
});

// Filtrer les types de fichiers (images uniquement)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez JPG, JPEG ou PNG.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

// Upload en mémoire pour les fichiers CSV (pas besoin de les stocker sur disque)
const uploadCSV = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const nomOk = file.originalname.toLowerCase().endsWith('.csv');
        const typeOk = ['text/csv', 'application/vnd.ms-excel', 'application/octet-stream'].includes(file.mimetype);
        if (nomOk || typeOk) {
            cb(null, true);
        } else {
            cb(new Error('Veuillez fournir un fichier CSV.'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
    },
});

module.exports = upload;
module.exports.uploadCSV = uploadCSV;
