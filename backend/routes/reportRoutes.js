const express = require('express');
const router = express.Router();
const {
  downloadPDFReport,
  downloadCSVReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Reports require user authentication

router.get('/:assessmentId/pdf', downloadPDFReport);
router.get('/:assessmentId/csv', downloadCSVReport);

module.exports = router;
