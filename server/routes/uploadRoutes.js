const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadFile);

module.exports = router;
