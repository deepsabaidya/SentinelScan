const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardHistory,
  getSeverityDistribution,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All dashboard statistics require authentication

router.get('/stats', getDashboardStats);
router.get('/history', getDashboardHistory);
router.get('/severity', getSeverityDistribution);

module.exports = router;
