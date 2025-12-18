module.exports = (sequelize, DataTypes) => {
  const ParkingSpot = sequelize.define('ParkingSpot', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ParkingLots',
        key: 'id',
      },
    },
    spotNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'available',
      allowNull: false,
    },
    isHandicap: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    timestamps: true,
    defaultScope: {
      where: {
        isDeleted: false
      }
    },
    scopes: {
      withDeleted: {}
    },
    uniqueKeys: {
      unique_spot_per_lot: {
        fields: ['lotId', 'spotNumber']
      }
    }
  });
  
    ParkingSpot.associate = (models) => {
      ParkingSpot.belongsTo(models.ParkingLot, {
        foreignKey: 'lotId',
        as: 'parkingLot',
      });
    ParkingSpot.hasOne(models.ParkingSession, {
      foreignKey: 'spotId',
      as: 'currentSession',
      scope: {
        endTime: null
      }
    });
    };
  
    return ParkingSpot;
  };