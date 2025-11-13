const express = require('express');
const {
  createParkingLot,
  getAllParkingLots,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot
} = require('../controllers/parkingLotController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .post(protect, authorize(['admin']), createParkingLot)
  .get(protect, getAllParkingLots);

router.route('/:id')
  .get(protect, getParkingLotById)
  .put(protect, authorize(['admin']), updateParkingLot)
  .delete(protect, authorize(['admin']), deleteParkingLot);

module.exports = router;