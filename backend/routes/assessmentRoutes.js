const express = require('express');
const router = express.Router();
const {
  createAssessment,
  getAssessments,
  getAssessmentById,
  deleteAssessment,
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');
const { scanLimiter } = require('../middleware/rateLimiter');

router.use(protect); // Protected by JWT auth

router.route('/')
  .post(scanLimiter, createAssessment)
  .get(getAssessments);

router.route('/:id')
  .get(getAssessmentById)
  .delete(deleteAssessment);

module.exports = router;
