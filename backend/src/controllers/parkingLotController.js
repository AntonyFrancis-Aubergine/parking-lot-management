const { ParkingLot, ParkingSpot } = require('../models');
const { Op } = require('sequelize');

exports.createParkingLot = async (req, res) => {
  const { name, totalSpots, address } = req.body;

  const parsedTotalSpots = Number(totalSpots);
  if (!Number.isInteger(parsedTotalSpots) || parsedTotalSpots <= 0) {
    return res.status(400).json({ message: 'Total spots must be a positive integer' });
  }

  const transaction = await ParkingLot.sequelize.transaction();

  try {
    const parkingLot = await ParkingLot.create(
      { name, totalSpots: parsedTotalSpots, address },
      { transaction }
    );

    const spotsPayload = Array.from({ length: parsedTotalSpots }, (_, idx) => ({
      lotId: parkingLot.id,
      spotNumber: String(idx + 1).padStart(3, '0'),
      status: 'available',
      isHandicap: false
    }));

    await ParkingSpot.bulkCreate(spotsPayload, { transaction });

    await transaction.commit();

    res.status(201).json(parkingLot);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating parking lot:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Parking lot name already exists' });
    }
    res.status(500).json({ message: 'Error creating parking lot', error: error.message });
  }
};

exports.getAllParkingLots = async (req, res) => {
  try {
    const parkingLots = await ParkingLot.findAll({
      include: [{
        model: ParkingSpot.scope('withDeleted'),
        as: 'spots',
        attributes: ['id', 'spotNumber', 'status', 'isHandicap', 'isDeleted'],
        where: { isDeleted: false },
        required: false
      }]
    });

    const lotsWithAvailability = parkingLots.map(lot => {
      const availableSpots = lot.spots.filter(spot => spot.status === 'available').length;
      const occupiedSpots = lot.spots.filter(spot => spot.status === 'occupied').length;
      const reservedSpots = lot.spots.filter(spot => spot.status === 'reserved').length;
      return {
        ...lot.toJSON(),
        availableSpotsCount: availableSpots,
        occupiedSpotsCount: occupiedSpots,
        reservedSpotsCount: reservedSpots
      };
    });

    res.status(200).json(lotsWithAvailability);
  } catch (error) {
    console.error('Error fetching parking lots:', error);
    res.status(500).json({ message: 'Error fetching parking lots', error: error.message });
  }
};

exports.getParkingLotById = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findByPk(req.params.id, {
      include: [{
        model: ParkingSpot.scope('withDeleted'),
        as: 'spots',
        attributes: ['id', 'spotNumber', 'status', 'isHandicap', 'isDeleted'],
        where: { isDeleted: false },
        required: false
      }]
    });

    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    const availableSpots = parkingLot.spots.filter(spot => spot.status === 'available').length;
    const occupiedSpots = parkingLot.spots.filter(spot => spot.status === 'occupied').length;
    const reservedSpots = parkingLot.spots.filter(spot => spot.status === 'reserved').length;

    res.status(200).json({
      ...parkingLot.toJSON(),
      availableSpotsCount: availableSpots,
      occupiedSpotsCount: occupiedSpots,
      reservedSpotsCount: reservedSpots
    });
  } catch (error) {
    console.error('Error fetching parking lot by ID:', error);
    res.status(500).json({ message: 'Error fetching parking lot', error: error.message });
  }
};

exports.updateParkingLot = async (req, res) => {
  try {
    const [updatedRows] = await ParkingLot.update(req.body, {
      where: { id: req.params.id }
    });
    if (updatedRows === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    const updatedLot = await ParkingLot.findByPk(req.params.id);
    res.status(200).json(updatedLot);
  } catch (error) {
    console.error('Error updating parking lot:', error);
    res.status(500).json({ message: 'Error updating parking lot', error: error.message });
  }
};

exports.deleteParkingLot = async (req, res) => {
  try {
    const deletedRows = await ParkingLot.destroy({
      where: { id: req.params.id }
    });
    if (deletedRows === 0) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting parking lot:', error);
    res.status(500).json({ message: 'Error deleting parking lot', error: error.message });
  }
};