const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
}

const storage = multer.diskStorage({

    //  Enregistrement dans le dossier "images"
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    // Génération du nom du fichier : nom d'origine + numero unique + . + extension
    filename: (req, file, cb) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        cb(null, name + Date.now() + '.' + extension);
    }
})

module.exports = multer({storage : storage});