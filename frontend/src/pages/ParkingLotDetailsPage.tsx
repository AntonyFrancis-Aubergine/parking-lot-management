/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { AuthContext } from '../App';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import BlockIcon from '@mui/icons-material/Block';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

interface ParkingSpot {
  id: number;
  spotNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
  isHandicap: boolean;
  currentSession?: {
    id: number;
    startTime: string;
    vehicle: {
      licensePlate: string;
      make: string;
      model: string;
      color: string;
    };
  };
}

interface ParkingLot {
  id: number;
  name: string;
  totalSpots: number;
  availableSpotsCount: number;
  occupiedSpotsCount: number;
  reservedSpotsCount: number;
  address?: string;
  spots: ParkingSpot[];
}

function ParkingLotDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const auth = useContext(AuthContext);
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSpotNumber, setNewSpotNumber] = useState('');
  const [isNewSpotHandicap, setIsNewSpotHandicap] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionSeverity, setActionSeverity] = useState<'success' | 'error' | 'info'>('info');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchParkingLotDetails = async () => {
    setLoading(true);
    setError('');
    setActionMessage(null);
    try {
      const lotRes = await axios.get(`${API_BASE_URL}/parking-lots/${id}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      const spotsRes = await axios.get(`${API_BASE_URL}/parking-spots/lot/${id}/spots`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setParkingLot({ ...lotRes.data, spots: spotsRes.data });
    } catch (err: any) {
      console.error('Failed to fetch parking lot details:', err);
      setError(err.response?.data?.message || 'Failed to load parking lot details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token && id) {
      fetchParkingLotDetails();
    }
  }, [auth?.token, id, API_BASE_URL]);

  const getSpotColor = (status: ParkingSpot['status']) => {
    switch (status) {
      case 'available': return 'success.light';
      case 'occupied': return 'error.light';
      case 'reserved': return 'info.light';
      case 'unavailable': return 'warning.light';
      default: return 'grey.500';
    }
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSpot(null);
    setNewSpotNumber('');
    setIsNewSpotHandicap(false);
  };

  const handleAddSpot = async () => {
    if (!newSpotNumber.trim()) {
      setActionMessage('Spot number cannot be empty.');
      setActionSeverity('error');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/parking-spots/lot/${id}/spots`,
        { spotNumber: newSpotNumber.toUpperCase(), isHandicap: isNewSpotHandicap },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setActionMessage(`Spot ${newSpotNumber.toUpperCase()} added successfully!`);
      setActionSeverity('success');
      fetchParkingLotDetails();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error adding spot:', err);
      setActionMessage(err.response?.data?.message || 'Failed to add parking spot.');
      setActionSeverity('error');
    }
  };

  const handleChangeSpotStatus = async (spotId: number, newStatus: ParkingSpot['status']) => {
    try {
      await axios.put(`${API_BASE_URL}/parking-spots/${spotId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setActionMessage(`Spot status updated to ${newStatus}.`);
      setActionSeverity('success');
      fetchParkingLotDetails();
    } catch (err: any) {
      console.error('Error changing spot status:', err);
      setActionMessage(err.response?.data?.message || 'Failed to change spot status.');
      setActionSeverity('error');
    }
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/parking-sessions/${sessionId}/end`, {}, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      setActionMessage('Parking session ended successfully!');
      setActionSeverity('success');
      fetchParkingLotDetails();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error ending session:', err);
      setActionMessage(err.response?.data?.message || 'Failed to end parking session.');
      setActionSeverity('error');
    }
  };

  const [startSessionVehicle, setStartSessionVehicle] = useState('');
  const [startSessionSpotId, setStartSessionSpotId] = useState<number | null>(null);

  const handleStartSessionPrompt = (spotId: number) => {
    setStartSessionSpotId(spotId);
    setOpenDialog(true);
    setSelectedSpot(null);
  };

  const handleStartSession = async () => {
    if (!startSessionVehicle || !startSessionSpotId) {
      setActionMessage('Please enter a vehicle license plate and select a spot.');
      setActionSeverity('error');
      return;
    }
    try {
      let vehicleId;
      try {
        const vehicleRes = await axios.get(`${API_BASE_URL}/vehicles/${startSessionVehicle.toUpperCase()}`, {
          headers: { Authorization: `Bearer ${auth?.token}` }
        });
        vehicleId = vehicleRes.data.id;
      } catch (err: any) {
        if (err.response?.status === 404) {
          const newVehicleRes = await axios.post(`${API_BASE_URL}/vehicles`,
            { licensePlate: startSessionVehicle.toUpperCase(), make: 'Unknown', model: 'Unknown' },
            { headers: { Authorization: `Bearer ${auth?.token}` } }
          );
          vehicleId = newVehicleRes.data.id;
        } else {
          throw err;
        }
      }

      await axios.post(`${API_BASE_URL}/parking-sessions/start`,
        { vehicleId, spotId: startSessionSpotId, lotId: parkingLot?.id },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setActionMessage('Parking session started successfully!');
      setActionSeverity('success');
      fetchParkingLotDetails();
      handleCloseDialog();
      setStartSessionVehicle('');
      setStartSessionSpotId(null);
    } catch (err: any) {
      console.error('Error starting session:', err);
      setActionMessage(err.response?.data?.message || 'Failed to start parking session.');
      setActionSeverity('error');
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !parkingLot) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Parking lot data not found.'}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {parkingLot.name} Details
      </Typography>
      {actionMessage && (
        <Alert severity={actionSeverity} sx={{ mb: 2 }}>
          {actionMessage}
        </Alert>
      )}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">Overview:</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          <Typography>Available: {parkingLot.availableSpotsCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsCarIcon color="error" />
          <Typography>Occupied: {parkingLot.occupiedSpotsCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventBusyIcon color="info" />
          <Typography>Reserved: {parkingLot.reservedSpotsCount}</Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedSpot(null);
            setOpenDialog(true);
          }}
          sx={{ ml: 'auto' }}
        >
          Add New Spot
        </Button>
      </Box>

      <Grid container spacing={1}>
        {parkingLot.spots
          .sort((a, b) => a.spotNumber.localeCompare(b.spotNumber))
          .map((spot) => (
            <Grid item xs={2} sm={1.5} md={1} key={spot.id}>
              <Button
                variant="contained"
                sx={{
                  width: '100%',
                  height: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: getSpotColor(spot.status),
                  '&:hover': {
                    bgcolor: getSpotColor(spot.status),
                    opacity: 0.8
                  },
                  color: 'text.primary',
                  borderRadius: 1,
                  p: 0.5,
                  fontSize: '0.7rem'
                }}
                onClick={() => handleSpotClick(spot)}
              >
                <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                  {spot.spotNumber}
                </Typography>
                {spot.isHandicap && <Typography variant="caption" color="primary">♿</Typography>}
                {spot.status === 'occupied' && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                    {spot.currentSession?.vehicle.licensePlate}
                  </Typography>
                )}
                {spot.status !== 'available' && spot.status !== 'occupied' && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                    ({spot.status.slice(0, 3)})
                  </Typography>
                )}
              </Button>
            </Grid>
          ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        {selectedSpot ? (
          <>
            <DialogTitle>Spot {selectedSpot.spotNumber} Details</DialogTitle>
            <DialogContent>
              <Typography>Status: <strong style={{ textTransform: 'capitalize' }}>{selectedSpot.status}</strong></Typography>
              <Typography>Handicap: {selectedSpot.isHandicap ? 'Yes' : 'No'}</Typography>
              {selectedSpot.status === 'occupied' && selectedSpot.currentSession && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid grey', borderRadius: 1 }}>
                  <Typography variant="h6">Current Session</Typography>
                  <Typography>Vehicle: {selectedSpot.currentSession.vehicle.licensePlate}</Typography>
                  <Typography>Make: {selectedSpot.currentSession.vehicle.make}</Typography>
                  <Typography>Model: {selectedSpot.currentSession.vehicle.model}</Typography>
                  <Typography>Started: {new Date(selectedSpot.currentSession.startTime).toLocaleString()}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {selectedSpot.status === 'occupied' && selectedSpot.currentSession && (
                <Button onClick={() => handleEndSession(selectedSpot.currentSession!.id)} color="error" variant="contained">
                  End Session
                </Button>
              )}
              {selectedSpot.status !== 'available' && (
                <Button onClick={() => handleChangeSpotStatus(selectedSpot.id, 'available')} color="success">
                  Mark Available
                </Button>
              )}
              {selectedSpot.status !== 'occupied' && (
                <Button onClick={() => handleStartSessionPrompt(selectedSpot.id)} color="primary">
                  Start Session (Manual)
                </Button>
              )}
              {selectedSpot.status !== 'unavailable' && (
                <Button onClick={() => handleChangeSpotStatus(selectedSpot.id, 'unavailable')} color="warning">
                  Mark Unavailable
                </Button>
              )}
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>{startSessionSpotId ? `Start Session for Spot ${parkingLot.spots.find(s => s.id === startSessionSpotId)?.spotNumber}` : 'Add New Parking Spot'}</DialogTitle>
            <DialogContent>
              {startSessionSpotId ? (
                <TextField
                  autoFocus
                  margin="dense"
                  id="licensePlate"
                  label="Vehicle License Plate"
                  type="text"
                  fullWidth
                  variant="standard"
                  value={startSessionVehicle}
                  onChange={(e) => setStartSessionVehicle(e.target.value)}
                />
              ) : (
                <>
                  <TextField
                    autoFocus
                    margin="dense"
                    id="spotNumber"
                    label="Spot Number (e.g., A1, B10)"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={newSpotNumber}
                    onChange={(e) => setNewSpotNumber(e.target.value)}
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="is-handicap-label">Handicap Spot?</InputLabel>
                    <Select
                      labelId="is-handicap-label"
                      id="isHandicap"
                      value={isNewSpotHandicap ? 'yes' : 'no'}
                      label="Handicap Spot?"
                      onChange={(e) => setIsNewSpotHandicap(e.target.value === 'yes')}
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              {startSessionSpotId ? (
                <Button onClick={handleStartSession} variant="contained" color="primary">
                  Start Session
                </Button>
              ) : (
                <Button onClick={handleAddSpot} variant="contained" color="primary">
                  Add Spot
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

export default ParkingLotDetailsPage;