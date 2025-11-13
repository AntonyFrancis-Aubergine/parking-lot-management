module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      licensePlate: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      make: {
        type: DataTypes.STRING,
      },
      model: {
        type: DataTypes.STRING,
      },
      color: {
        type: DataTypes.STRING,
      },
      ownerName: {
        type: DataTypes.STRING,
      },
    }, {
      timestamps: true,
    });
  
    Vehicle.associate = (models) => {
      Vehicle.hasMany(models.ParkingSession, {
        foreignKey: 'vehicleId',
        as: 'sessions',
      });
    };
  
    return Vehicle;
  };