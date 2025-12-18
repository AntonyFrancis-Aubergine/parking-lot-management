/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext } from 'react';
import {
  Container, Typography, Box, TextField, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import { AuthContext } from '../App';
import axios from 'axios';

interface Vehicle {
  id: number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  ownerName: string;
  createdAt: string;
}

function VehicleManagementPage() {
  const auth = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVehicle, setNewVehicle] = useState({
    licensePlate: '', make: '', model: '', color: '', ownerName: ''
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionSeverity, setActionSeverity] = useState<'success' | 'error' | 'info'>('info');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setVehicles(res.data);
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchVehicles();
    }
  }, [auth?.token, API_BASE_URL]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.licensePlate) {
      setActionMessage('License Plate is required.');
      setActionSeverity('error');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/vehicles`, newVehicle, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setActionMessage(`Vehicle ${newVehicle.licensePlate} registered successfully!`);
      setActionSeverity('success');
      fetchVehicles();
      setNewVehicle({ licensePlate: '', make: '', model: '', color: '', ownerName: '' });
      setOpenAddDialog(false);
    } catch (err: any) {
      console.error('Error adding vehicle:', err);
      setActionMessage(err.response?.data?.message || 'Failed to register vehicle.');
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

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Vehicle Management
      </Typography>
      {actionMessage && (
        <Alert severity={actionSeverity} sx={{ mb: 2 }}>
          {actionMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setOpenAddDialog(true)}>
        Register New Vehicle
      </Button>

      {vehicles.length === 0 ? (
        <Typography>No vehicles registered yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>License Plate</TableCell>
                <TableCell>Owner Name</TableCell>
                <TableCell>Make</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Registered On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>{vehicle.ownerName || 'N/A'}</TableCell>
                  <TableCell>{vehicle.make || 'N/A'}</TableCell>
                  <TableCell>{vehicle.model || 'N/A'}</TableCell>
                  <TableCell>{vehicle.color || 'N/A'}</TableCell>
                  <TableCell>{new Date(vehicle.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Register New Vehicle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="licensePlate"
            label="License Plate (Required)"
            type="text"
            fullWidth
            variant="standard"
            value={newVehicle.licensePlate}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="ownerName"
            label="Owner Name"
            type="text"
            fullWidth
            variant="standard"
            value={newVehicle.ownerName}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="make"
            label="Make"
            type="text"
            fullWidth
            variant="standard"
            value={newVehicle.make}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="model"
            label="Model"
            type="text"
            fullWidth
            variant="standard"
            value={newVehicle.model}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="color"
            label="Color"
            type="text"
            fullWidth
            variant="standard"
            value={newVehicle.color}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddVehicle} variant="contained">Register</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default VehicleManagementPage;