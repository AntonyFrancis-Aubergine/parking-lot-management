module.exports = (sequelize, DataTypes) => {
    const ParkingSession = sequelize.define('ParkingSession', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Vehicles',
          key: 'id',
        },
      },
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ParkingSpots',
          key: 'id',
        },
      },
      lotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ParkingLots',
          key: 'id',
        },
      },
      startTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
      },
      fee: {
        type: DataTypes.DECIMAL(10, 2),
      },
    }, {
      timestamps: true,
    });
  
    ParkingSession.associate = (models) => {
      ParkingSession.belongsTo(models.Vehicle, {
        foreignKey: 'vehicleId',
        as: 'vehicle',
      });
      ParkingSession.belongsTo(models.ParkingSpot, {
        foreignKey: 'spotId',
        as: 'parkingSpot',
      });
      ParkingSession.belongsTo(models.ParkingLot, {
        foreignKey: 'lotId',
        as: 'parkingLot',
      });
    };
  
    return ParkingSession;
  };