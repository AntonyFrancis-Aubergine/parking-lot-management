const express = require('express');
const {
  startParkingSession,
  endParkingSession,
  getActiveParkingSessions,
  getParkingSessionHistory
} = require('../controllers/parkingSessionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/start', protect, authorize(['admin', 'staff']), startParkingSession);
router.put('/:sessionId/end', protect, authorize(['admin', 'staff']), endParkingSession);
router.get('/active', protect, getActiveParkingSessions);
router.get('/history', protect, getParkingSessionHistory);

module.exports = router;