/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import { AuthContext } from '../App';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
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
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionSeverity, setActionSeverity] = useState<'success' | 'error' | 'info'>('info');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchParkingLotDetails = useCallback(async () => {
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
  }, [API_BASE_URL, auth?.token, id]);

  useEffect(() => {
    if (auth?.token && id) {
      fetchParkingLotDetails();
    }
  }, [auth?.token, id, fetchParkingLotDetails]);

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
    setStartSessionSpotId(null);
    setStartSessionVehicle('');
    setSelectedSpot(spot);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSpot(null);
    setStartSessionSpotId(null);
    setStartSessionVehicle('');
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
    setStartSessionVehicle('');
  };

  const handleStartSession = async () => {
    const licensePlate = startSessionVehicle.trim().toUpperCase();
    if (!licensePlate || !startSessionSpotId) {
      setActionMessage('Please enter a vehicle license plate and select a spot.');
      setActionSeverity('error');
      return;
    }
    try {
      let vehicleId;
      try {
        const vehicleRes = await axios.get(`${API_BASE_URL}/vehicles/${encodeURIComponent(licensePlate)}`, {
          headers: { Authorization: `Bearer ${auth?.token}` }
        });
        vehicleId = vehicleRes.data.id;
      } catch (err: any) {
        if (err.response?.status === 404) {
          const newVehicleRes = await axios.post(`${API_BASE_URL}/vehicles`,
            { licensePlate, make: 'Unknown', model: 'Unknown' },
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

  const handleDeleteSpot = async (spotId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/parking-spots/${spotId}`, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      setActionMessage('Parking spot deleted.');
      setActionSeverity('success');
      fetchParkingLotDetails();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error deleting spot:', err);
      setActionMessage(err.response?.data?.message || 'Failed to delete parking spot.');
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
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: {
            xs: 'repeat(3, minmax(0, 1fr))',
            sm: 'repeat(4, minmax(0, 1fr))',
            md: 'repeat(6, minmax(0, 1fr))'
          }
        }}
      >
        {parkingLot.spots
          .sort((a, b) => a.spotNumber.localeCompare(b.spotNumber))
          .map((spot) => (
            <Box key={spot.id}>
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
                  clipPath: 'polygon(15% 0, 85% 0, 100% 18%, 100% 82%, 85% 100%, 15% 100%, 0 82%, 0 18%)',
                  '&:hover': {
                    bgcolor: getSpotColor(spot.status),
                    opacity: 0.8
                  },
                  color: 'text.primary',
                  borderRadius: 0,
                  boxShadow: 3,
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
            </Box>
          ))}
      </Box>

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
              {auth?.user?.role === 'admin' && (
                <Button onClick={() => handleDeleteSpot(selectedSpot.id)} color="error">
                  Delete Spot
                </Button>
              )}
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>{startSessionSpotId ? `Start Session for Spot ${parkingLot.spots.find(s => s.id === startSessionSpotId)?.spotNumber}` : 'Parking Spot'}</DialogTitle>
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
                <Typography variant="body2">Select a parking spot to view details.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              {startSessionSpotId ? (
                <Button onClick={handleStartSession} variant="contained" color="primary">
                  Start Session
                </Button>
              ) : null}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

export default ParkingLotDetailsPage;