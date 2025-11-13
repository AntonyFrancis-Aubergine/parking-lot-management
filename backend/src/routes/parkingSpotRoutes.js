const express = require('express');
const {
  createParkingSpot,
  getParkingSpotsByLot,
  getParkingSpotById,
  updateParkingSpotStatus,
  deleteParkingSpot
} = require('../controllers/parkingSpotController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/lot/:lotId/spots')
  .post(protect, authorize(['admin', 'staff']), createParkingSpot)
  .get(protect, getParkingSpotsByLot);

router.route('/:id')
  .get(protect, getParkingSpotById)
  .put(protect, authorize(['admin', 'staff']), updateParkingSpotStatus)
  .delete(protect, authorize(['admin']), deleteParkingSpot);

module.exports = router;