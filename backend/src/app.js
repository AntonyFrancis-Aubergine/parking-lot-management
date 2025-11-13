require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const db = require('./models');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const parkingLotRoutes = require('./routes/parkingLotRoutes');
const parkingSpotRoutes = require('./routes/parkingSpotRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const parkingSessionRoutes = require('./routes/parkingSessionRoutes');

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Parking Lot App Backend is Running!');
});

// Use API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking-lots', parkingLotRoutes);
app.use('/api/parking-spots', parkingSpotRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking-sessions', parkingSessionRoutes);


// Sync DB and Start Server
db.sequelize.sync({ force: false }).then(() => {
  console.log('Database synced.');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
  process.exit(1);
});