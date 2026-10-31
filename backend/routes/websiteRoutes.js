const express = require('express');
const router = express.Router();
const {
  getWebsites,
  registerWebsite,
  deleteWebsite,
} = require('../controllers/websiteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All website management routes are protected

router.route('/')
  .get(getWebsites)
  .post(registerWebsite);

router.route('/:id')
  .delete(deleteWebsite);

module.exports = router;
