import { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { AuthContext } from '../App';
import axios from 'axios';

interface ParkingSession {
  id: number;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  fee: string | null;
  vehicle: {
    licensePlate: string;
    ownerName: string;
  };
  parkingSpot: {
    spotNumber: string;
  };
  parkingLot: {
    name: string;
  };
}

function ParkingHistoryPage() {
  const auth = useContext(AuthContext);
  const [history, setHistory] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchParkingHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/parking-sessions/history`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setHistory(res.data);
    } catch (err: any) {
      console.error('Failed to fetch parking history:', err);
      setError(err.response?.data?.message || 'Failed to load parking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchParkingHistory();
    }
  }, [auth?.token, API_BASE_URL]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Parking Session History
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {history.length === 0 ? (
        <Typography>No past parking sessions found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle (License Plate)</TableCell>
                <TableCell>Spot</TableCell>
                <TableCell>Parking Lot</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Duration (min)</TableCell>
                <TableCell>Fee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.vehicle.licensePlate} ({session.vehicle.ownerName || 'N/A'})</TableCell>
                  <TableCell>{session.parkingSpot.spotNumber}</TableCell>
                  <TableCell>{session.parkingLot.name}</TableCell>
                  <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
                  <TableCell>{session.endTime ? new Date(session.endTime).toLocaleString() : 'Active'}</TableCell>
                  <TableCell>{session.durationMinutes || 'N/A'}</TableCell>
                  <TableCell>{session.fee ? `$${session.fee}` : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default ParkingHistoryPage;