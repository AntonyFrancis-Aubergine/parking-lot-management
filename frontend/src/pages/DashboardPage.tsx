import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { AuthContext } from '../App';
import axios from 'axios';

interface ParkingLot {
  id: number;
  name: string;
  totalSpots: number;
  availableSpotsCount: number;
  occupiedSpotsCount: number;
  reservedSpotsCount: number;
  address?: string;
}

function DashboardPage() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLotName, setNewLotName] = useState('');
  const [newLotTotalSpots, setNewLotTotalSpots] = useState('');
  const [newLotAddress, setNewLotAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchParkingLots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/parking-lots`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setParkingLots(res.data);
    } catch (err) {
      console.error('Failed to fetch parking lots:', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load parking lots.'
        : 'Failed to load parking lots.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, auth?.token]);

  useEffect(() => {
    if (auth?.token) {
      fetchParkingLots();
    }
  }, [auth?.token, fetchParkingLots]);

  const resetCreateLotForm = () => {
    setNewLotName('');
    setNewLotTotalSpots('');
    setNewLotAddress('');
    setIsSubmitting(false);
  };

  const handleCreateLot = async () => {
    const name = newLotName.trim();
    const totalSpotsValue = Number(newLotTotalSpots);

    if (!name) {
      setFeedback({ message: 'Parking lot name is required.', severity: 'error' });
      return;
    }

    if (!Number.isInteger(totalSpotsValue) || totalSpotsValue <= 0) {
      setFeedback({ message: 'Total spots must be a positive whole number.', severity: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/parking-lots`,
        {
          name,
          totalSpots: totalSpotsValue,
          address: newLotAddress.trim() || undefined
        },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setFeedback({ message: 'Parking lot created successfully.', severity: 'success' });
      setIsCreateDialogOpen(false);
      resetCreateLotForm();
      fetchParkingLots();
    } catch (err) {
      console.error('Failed to create parking lot:', err);
      setFeedback({
        message: axios.isAxiosError(err)
          ? err.response?.data?.message || 'Failed to create parking lot.'
          : 'Failed to create parking lot.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ flexGrow: 1 }}>
          Parking Lots Overview
        </Typography>
        {auth?.user?.role === 'admin' && (
          <Button variant="contained" onClick={() => setIsCreateDialogOpen(true)}>
            Create Parking Lot
          </Button>
        )}
      </Box>
      {feedback && (
        <Alert
          severity={feedback.severity}
          sx={{ mb: 2 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))'
          },
          gap: 3
        }}
      >
        {parkingLots.length === 0 ? (
          <Typography sx={{ gridColumn: '1 / -1' }}>
            No parking lots available. Please create one if you are an admin.
          </Typography>
        ) : (
          parkingLots.map((lot) => (
            <Card raised key={lot.id}>
              <CardContent>
                <Typography variant="h6" component="div">
                  {lot.name}
                </Typography>
                <Typography color="text.secondary">
                  Address: {lot.address || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Total Spots: {lot.totalSpots}
                </Typography>
                <Typography variant="body2" color="success.main">
                  Available: {lot.availableSpotsCount}
                </Typography>
                <Typography variant="body2" color="error.main">
                  Occupied: {lot.occupiedSpotsCount}
                </Typography>
                <Typography variant="body2" color="info.main">
                  Reserved: {lot.reservedSpotsCount}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/parking-lot/${lot.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Dialog open={isCreateDialogOpen} onClose={() => { setIsCreateDialogOpen(false); resetCreateLotForm(); }}>
        <DialogTitle>Create New Parking Lot</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="lot-name"
            label="Name"
            type="text"
            fullWidth
            variant="standard"
            value={newLotName}
            onChange={(e) => setNewLotName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="lot-spots"
            label="Total Spots"
            type="number"
            fullWidth
            variant="standard"
            value={newLotTotalSpots}
            onChange={(e) => setNewLotTotalSpots(e.target.value)}
          />
          <TextField
            margin="dense"
            id="lot-address"
            label="Address"
            type="text"
            fullWidth
            variant="standard"
            value={newLotAddress}
            onChange={(e) => setNewLotAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsCreateDialogOpen(false);
              resetCreateLotForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateLot} variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DashboardPage;