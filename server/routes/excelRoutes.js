const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { previewImport, executeImport, exportData } = require('../controllers/excelController');

router.post('/preview-import', upload.single('file'), previewImport);
router.post('/import', executeImport);
router.get('/export/:entity', exportData);

module.exports = router;
