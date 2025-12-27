import React, { useState, useMemo, createContext, useContext } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Button, Container } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import History from './History.jsx';
import Admin from './Admin.jsx';
import Register from './Register.jsx';
import Login from './Login.jsx';

// Contexto de Autenticação Simples
const AuthContext = createContext(null);

function App() {
  const [mode, setMode] = useState('dark');
  const [token, setToken] = useState(localStorage.getItem('token'));

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#f50057' },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      }
    },
  }), [mode]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  ManutenCar
                </Typography>
                <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
                  {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
                {token && <Button color="inherit" onClick={logout}>Sair</Button>}
              </Toolbar>
            </AppBar>
            
            <Container sx={{ mt: 4 }}>
              <Routes>
                <Route path="/admin" element={token ? <Admin /> : <Navigate to="/login" />} />
                <Route path="/vehicle/:id/history" element={token ? <History /> : <Navigate to="/login" />} />
                <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
                <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
                <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

export default App;
export { AuthContext };