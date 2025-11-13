module.exports = (sequelize, DataTypes) => {
    const ParkingLot = sequelize.define('ParkingLot', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      totalSpots: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
      },
    }, {
      timestamps: true,
    });
  
    ParkingLot.associate = (models) => {
      ParkingLot.hasMany(models.ParkingSpot, {
        foreignKey: 'lotId',
        as: 'spots',
      });
      ParkingLot.hasMany(models.ParkingSession, {
        foreignKey: 'lotId',
        as: 'sessions',
      });
    };
  
    return ParkingLot;
  };