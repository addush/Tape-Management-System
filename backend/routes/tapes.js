const express = require('express');
const router = express.Router();
const tapeController = require('../controllers/tapeController');
const multer = require('multer');
const path = require('path');
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

router.get('/', tapeController.getAllTapes);
router.post('/', tapeController.createTape);
router.put('/:id', tapeController.updateTape);
router.post('/:id/signature', upload.single('signatureFile'), tapeController.uploadSignature);

module.exports = router;
