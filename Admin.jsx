import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { AuthContext } from './App.jsx';

export default function Admin() {
  const { token } = useContext(AuthContext);
  const [types, setTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState({ name: '', default_interval_km: '', default_interval_months: '', description: '' });

  const fetchTypes = async () => {
    try {
      const response = await axios.get('http://localhost:8090/maintenance-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTypes(response.data);
    } catch (error) {
      console.error("Erro ao buscar tipos", error);
    }
  };

  useEffect(() => {
    if (token) fetchTypes();
  }, [token]);

  const handleCreate = async () => {
    try {
      await axios.post('http://localhost:8090/maintenance-types', newType, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpen(false);
      setNewType({ name: '', default_interval_km: '', default_interval_months: '', description: '' });
      fetchTypes();
    } catch (error) {
      console.error("Erro ao criar tipo", error);
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 3, mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
            <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>Voltar</Button>
            <Typography variant="h4">Administração de Manutenções</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Novo Tipo</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Intervalo (KM)</TableCell>
              <TableCell>Intervalo (Meses)</TableCell>
              <TableCell>Descrição</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.default_interval_km} km</TableCell>
                <TableCell>{row.default_interval_months} meses</TableCell>
                <TableCell>{row.description || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Novo Tipo de Manutenção</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Nome" fullWidth value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
          <TextField margin="dense" label="Intervalo KM" type="number" fullWidth value={newType.default_interval_km} onChange={(e) => setNewType({ ...newType, default_interval_km: e.target.value })} />
          <TextField margin="dense" label="Intervalo Meses" type="number" fullWidth value={newType.default_interval_months} onChange={(e) => setNewType({ ...newType, default_interval_months: e.target.value })} />
          <TextField margin="dense" label="Descrição" fullWidth value={newType.description} onChange={(e) => setNewType({ ...newType, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}