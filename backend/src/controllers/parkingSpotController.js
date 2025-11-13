const { ParkingSpot, ParkingLot, Vehicle, ParkingSession } = require('../models');
const { Op } = require('sequelize');

exports.createParkingSpot = async (req, res) => {
  const { lotId } = req.params;
  const { spotNumber, isHandicap } = req.body;
  try {
    const parkingLot = await ParkingLot.findByPk(lotId);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    const parkingSpot = await ParkingSpot.create({
      lotId: lotId,
      spotNumber,
      isHandicap: isHandicap || false,
      status: 'available'
    });
    res.status(201).json(parkingSpot);
  } catch (error) {
    console.error('Error creating parking spot:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: `Spot number ${spotNumber} already exists in this lot` });
    }
    res.status(500).json({ message: 'Error creating parking spot', error: error.message });
  }
};

exports.getParkingSpotsByLot = async (req, res) => {
  const { lotId } = req.params;
  try {
    const parkingSpots = await ParkingSpot.findAll({
      where: { lotId },
      include: [{
        model: ParkingSession,
        as: 'currentSession',
        where: { endTime: { [Op.is]: null } },
        required: false,
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['licensePlate', 'make', 'model', 'color']
        }]
      }]
    });
    res.status(200).json(parkingSpots);
  } catch (error) {
    console.error('Error fetching parking spots:', error);
    res.status(500).json({ message: 'Error fetching parking spots', error: error.message });
  }
};

exports.getParkingSpotById = async (req, res) => {
  try {
    const parkingSpot = await ParkingSpot.findByPk(req.params.id, {
      include: [{
        model: ParkingSession,
        as: 'currentSession',
        where: { endTime: { [Op.is]: null } },
        required: false,
        include: [{
          model: Vehicle,
          as: 'vehicle',
          attributes: ['licensePlate', 'make', 'model', 'color']
        }]
      }]
    });
    if (!parkingSpot) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }
    res.status(200).json(parkingSpot);
  } catch (error) {
    console.error('Error fetching parking spot:', error);
    res.status(500).json({ message: 'Error fetching parking spot', error: error.message });
  }
};

exports.updateParkingSpotStatus = async (req, res) => {
  const { status } = req.body; // 'available', 'occupied', 'reserved', 'unavailable'
  try {
    const [updatedRows] = await ParkingSpot.update({ status }, {
      where: { id: req.params.id }
    });
    if (updatedRows === 0) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }
    const updatedSpot = await ParkingSpot.findByPk(req.params.id);
    res.status(200).json(updatedSpot);
  } catch (error) {
    console.error('Error updating parking spot status:', error);
    res.status(500).json({ message: 'Error updating parking spot status', error: error.message });
  }
};

exports.deleteParkingSpot = async (req, res) => {
  try {
    const deletedRows = await ParkingSpot.destroy({
      where: { id: req.params.id }
    });
    if (deletedRows === 0) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    res.status(500).json({ message: 'Error deleting parking spot', error: error.message });
  }
};