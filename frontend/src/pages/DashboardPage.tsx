import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Grid, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchParkingLots = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE_URL}/parking-lots`, {
          headers: { Authorization: `Bearer ${auth?.token}` },
        });
        setParkingLots(res.data);
      } catch (err: any) {
        console.error('Failed to fetch parking lots:', err);
        setError(err.response?.data?.message || 'Failed to load parking lots.');
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchParkingLots();
    }
  }, [auth?.token, API_BASE_URL]);

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
      <Typography variant="h4" gutterBottom>
        Parking Lots Overview
      </Typography>
      <Grid container spacing={3}>
        {parkingLots.length === 0 ? (
          <Grid item xs={12}>
            <Typography>No parking lots available. Please create one if you are an admin.</Typography>
          </Grid>
        ) : (
          parkingLots.map((lot) => (
            <Grid item xs={12} sm={6} md={4} key={lot.id}>
              <Card raised>
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
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default DashboardPage;