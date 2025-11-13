const { Vehicle } = require('../models');

exports.registerVehicle = async (req, res) => {
  const { licensePlate, make, model, color, ownerName } = req.body;
  try {
    const vehicle = await Vehicle.create({ licensePlate, make, model, color, ownerName });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error registering vehicle:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Vehicle with this license plate already exists' });
    }
    res.status(500).json({ message: 'Error registering vehicle', error: error.message });
  }
};

exports.getVehicleByLicensePlate = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ where: { licensePlate: req.params.licensePlate } });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.status(200).json(vehicles);
  } catch (error) {
    console.error('Error fetching all vehicles:', error);
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
};