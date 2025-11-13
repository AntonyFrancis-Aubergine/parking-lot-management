const { ParkingSession, Vehicle, ParkingSpot, ParkingLot } = require('../models');
const { Op } = require('sequelize');

exports.startParkingSession = async (req, res) => {
  const { vehicleId, spotId, lotId } = req.body;
  try {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const parkingSpot = await ParkingSpot.findByPk(spotId);
    if (!parkingSpot) {
      return res.status(404).json({ message: 'Parking spot not found' });
    }

    if (parkingSpot.status !== 'available') {
      return res.status(400).json({ message: `Parking spot ${parkingSpot.spotNumber} is currently ${parkingSpot.status}` });
    }

    const activeSession = await ParkingSession.findOne({
      where: {
        vehicleId,
        endTime: { [Op.is]: null }
      }
    });

    if (activeSession) {
      return res.status(400).json({ message: 'Vehicle already has an active parking session' });
    }

    const session = await ParkingSession.create({
      vehicleId,
      spotId,
      lotId: parkingSpot.lotId,
      startTime: new Date(),
    });

    await parkingSpot.update({ status: 'occupied' });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error starting parking session:', error);
    res.status(500).json({ message: 'Error starting parking session', error: error.message });
  }
};

exports.endParkingSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await ParkingSession.findByPk(sessionId, {
      include: [{ model: ParkingSpot, as: 'parkingSpot' }]
    });

    if (!session) {
      return res.status(404).json({ message: 'Parking session not found' });
    }
    if (session.endTime !== null) {
      return res.status(400).json({ message: 'Parking session already ended' });
    }

    const endTime = new Date();
    const startTime = session.startTime;
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const fee = (Math.ceil(durationMinutes / 30) * 1.00).toFixed(2);

    await session.update({
      endTime,
      durationMinutes,
      fee,
    });

    if (session.parkingSpot) {
      await session.parkingSpot.update({ status: 'available' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error ending parking session:', error);
    res.status(500).json({ message: 'Error ending parking session', error: error.message });
  }
};

exports.getActiveParkingSessions = async (req, res) => {
  try {
    const activeSessions = await ParkingSession.findAll({
      where: {
        endTime: { [Op.is]: null }
      },
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['licensePlate', 'ownerName'] },
        { model: ParkingSpot, as: 'parkingSpot', attributes: ['spotNumber'] },
        { model: ParkingLot, as: 'parkingLot', attributes: ['name'] }
      ]
    });
    res.status(200).json(activeSessions);
  } catch (error) {
    console.error('Error fetching active parking sessions:', error);
    res.status(500).json({ message: 'Error fetching active sessions', error: error.message });
  }
};

exports.getParkingSessionHistory = async (req, res) => {
  try {
    const history = await ParkingSession.findAll({
      where: {
        endTime: { [Op.not]: null }
      },
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['licensePlate', 'ownerName'] },
        { model: ParkingSpot, as: 'parkingSpot', attributes: ['spotNumber'] },
        { model: ParkingLot, as: 'parkingLot', attributes: ['name'] }
      ],
      order: [['startTime', 'DESC']]
    });
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching parking session history:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};