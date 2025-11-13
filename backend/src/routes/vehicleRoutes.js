const express = require('express');
const {
  registerVehicle,
  getVehicleByLicensePlate,
  getAllVehicles
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .post(protect, authorize(['admin', 'staff']), registerVehicle)
  .get(protect, getAllVehicles);

router.route('/:licensePlate')
  .get(protect, getVehicleByLicensePlate);

module.exports = router;