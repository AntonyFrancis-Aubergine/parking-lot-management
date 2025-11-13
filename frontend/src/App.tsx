import { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import axios from 'axios';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ParkingLotDetailsPage from './pages/ParkingLotDetailsPage';
import VehicleManagementPage from './pages/VehicleManagementPage';
import ParkingHistoryPage from './pages/ParkingHistoryPage';
import { type User } from './types/User';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [token, API_BASE_URL]);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Typography variant="h4">Loading...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
        <Router>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Parking Master
              </Typography>
              {user && (
                <Box>
                  <Button color="inherit" onClick={() => (window.location.href = '/')}>Dashboard</Button>
                  <Button color="inherit" onClick={() => (window.location.href = '/vehicles')}>Vehicles</Button>
                  <Button color="inherit" onClick={() => (window.location.href = '/history')}>History</Button>
                  <Typography variant="body1" component="span" sx={{ ml: 2, mr: 1 }}>
                    {user.username} ({user.role})
                  </Typography>
                  <Button color="inherit" onClick={logout}>Logout</Button>
                </Box>
              )}
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ p: 3 }}>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
              <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
              <Route path="/parking-lot/:id" element={user ? <ParkingLotDetailsPage /> : <Navigate to="/login" />} />
              <Route path="/vehicles" element={user ? <VehicleManagementPage /> : <Navigate to="/login" />} />
              <Route path="/history" element={user ? <ParkingHistoryPage /> : <Navigate to="/login" />} />
            </Routes>
          </Box>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;