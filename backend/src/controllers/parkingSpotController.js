const { ParkingSpot, ParkingLot, Vehicle, ParkingSession } = require('../models');
const { Op } = require('sequelize');

exports.createParkingSpot = async (req, res) => {
  const { lotId } = req.params;
  const { spotNumber, isHandicap } = req.body;
  const transaction = await ParkingSpot.sequelize.transaction();

  try {
    const parkingLot = await ParkingLot.findByPk(lotId, { transaction });
    if (!parkingLot) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    const formattedSpotNumber = (spotNumber || '').trim().toUpperCase();
    if (!formattedSpotNumber) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Spot number is required' });
    }

    const existingSpot = await ParkingSpot.scope('withDeleted').findOne({
      where: { lotId, spotNumber: formattedSpotNumber },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    let parkingSpot;
    if (existingSpot) {
      if (!existingSpot.isDeleted) {
        await transaction.rollback();
        return res.status(409).json({ message: `Spot number ${formattedSpotNumber} already exists in this lot` });
      }

      await existingSpot.update({
        isDeleted: false,
        status: 'available',
        isHandicap: Boolean(isHandicap)
      }, { transaction });

      parkingSpot = existingSpot;
    } else {
      parkingSpot = await ParkingSpot.create({
        lotId: lotId,
        spotNumber: formattedSpotNumber,
        isHandicap: Boolean(isHandicap),
        status: 'available'
      }, { transaction });

      await parkingLot.increment('totalSpots', { by: 1, transaction });
    }

    await transaction.commit();

    res.status(201).json(parkingSpot);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error creating parking spot:', error);
    res.status(500).json({ message: 'Error creating parking spot', error: error.message });
  }
};

exports.getParkingSpotsByLot = async (req, res) => {
  const { lotId } = req.params;
  try {
    const parkingSpots = await ParkingSpot.findAll({
      where: { lotId, isDeleted: false },
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
    const parkingSpot = await ParkingSpot.findOne({
      where: { id: req.params.id, isDeleted: false },
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
    const parkingSpot = await ParkingSpot.findByPk(req.params.id);
    if (!parkingSpot) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }

    await parkingSpot.update({ status });
    res.status(200).json(parkingSpot);
  } catch (error) {
    console.error('Error updating parking spot status:', error);
    res.status(500).json({ message: 'Error updating parking spot status', error: error.message });
  }
};

exports.deleteParkingSpot = async (req, res) => {
  const transaction = await ParkingSpot.sequelize.transaction();

  try {
    const parkingSpot = await ParkingSpot.scope('withDeleted').findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!parkingSpot || parkingSpot.isDeleted) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Parking spot not found' });
    }

    const activeSession = await ParkingSession.findOne({
      where: {
        spotId: parkingSpot.id,
        endTime: { [Op.is]: null }
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (activeSession) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cannot delete a parking spot with an active session' });
    }

    await parkingSpot.update({ isDeleted: true, status: 'unavailable' }, { transaction });

    await ParkingLot.decrement('totalSpots', { by: 1, where: { id: parkingSpot.lotId }, transaction });

    await transaction.commit();

    res.status(204).send();
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error deleting parking spot:', error);
    res.status(500).json({ message: 'Error deleting parking spot', error: error.message });
  }
};