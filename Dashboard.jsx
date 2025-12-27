import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Grid, Card, CardContent, Typography, Chip, Button, Alert, CardActions, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './App.jsx';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ id: null, make: '', model: '', year: '', current_km: '', license_plate: '' });
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState({
    maintenance_type_id: '',
    km_performed: '',
    date_performed: '',
    notes: '',
    service_cost: '',
    product_cost: ''
  });
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState('cost'); // 'cost' ou 'count'
  const navigate = useNavigate();

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:8090/vehicles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(response.data);
    } catch (error) {
      console.error("Erro ao buscar veículos", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8090/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChartData(response.data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    if (token) fetchStats();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await axios.get('http://localhost:8090/maintenance-types', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMaintenanceTypes(response.data);
      } catch (error) {
        console.error("Erro ao buscar tipos de manutenção", error);
      }
    };
    if (token) fetchTypes();
  }, [token]);

  const handleSaveVehicle = async () => {
    try {
      if (vehicleForm.id) {
        await axios.put(`http://localhost:8090/vehicles/${vehicleForm.id}`, vehicleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:8090/vehicles', vehicleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setOpen(false);
      setVehicleForm({ id: null, make: '', model: '', year: '', current_km: '', license_plate: '' });
      fetchVehicles();
    } catch (error) {
      console.error("Erro ao salvar veículo", error);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleForm({ ...vehicle });
    setOpen(true);
  };

  const handleOpenMaintenance = (vehicle) => {
    setSelectedVehicle(vehicle);
    
    // Ajuste para o fuso horário local
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);

    setMaintenanceData({
      maintenance_type_id: '',
      km_performed: vehicle.current_km,
      date_performed: localDate.toISOString().slice(0, 16),
      notes: '',
      service_cost: '',
      product_cost: ''
    });
    setMaintenanceOpen(true);
  };

  const handleRegisterMaintenance = async () => {
    try {
      await axios.post(`http://localhost:8090/vehicles/${selectedVehicle.id}/maintenance`, maintenanceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaintenanceOpen(false);
      fetchVehicles();
      fetchStats();
    } catch (error) {
      console.error("Erro ao registrar manutenção", error);
    }
  };

  return (
    <div>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Resumo dos Últimos 12 Meses</Typography>
          <ToggleButtonGroup
            value={chartMode}
            exclusive
            onChange={(e, newMode) => { if (newMode) setChartMode(newMode); }}
            size="small"
          >
            <ToggleButton value="cost">Valor (R$)</ToggleButton>
            <ToggleButton value="count">Quantidade</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartMode === 'cost' ? (
                <>
                  <Bar dataKey="service_cost" stackId="a" name="Serviço" fill="#8884d8" />
                  <Bar dataKey="product_cost" stackId="a" name="Peças" fill="#82ca9d" />
                </>
              ) : (
                <Bar dataKey="count" name="Qtd. Manutenções" fill="#1976d2" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Meus Veículos</Typography>
        <Box>
            <Button component={Link} to="/admin" startIcon={<AdminPanelSettingsIcon />} sx={{ mr: 2 }}>Admin</Button>
            <Button variant="contained" startIcon={<DirectionsCarIcon />} onClick={() => { setVehicleForm({ id: null, make: '', model: '', year: '', current_km: '', license_plate: '' }); setOpen(true); }}>
                Novo Veículo
            </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="div" display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  <DirectionsCarIcon /> {vehicle.make} {vehicle.model}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  {vehicle.current_km} km rodados
                </Typography>

                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Chip label={vehicle.license_plate || "SEM PLACA"} size="small" />
                    <Typography variant="body2" fontWeight="bold">
                        Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vehicle.total_maintenance_cost || 0)}
                    </Typography>
                </Box>

                {vehicle.alerts && vehicle.alerts.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="error">Atenção Necessária:</Typography>
                    {vehicle.alerts.map((alert, idx) => (
                      <Alert severity="warning" key={idx} sx={{ mt: 1 }}>
                        {alert.type}: {alert.msg}
                      </Alert>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="success" sx={{ mt: 2 }}>Manutenção em dia!</Alert>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<BuildIcon />} onClick={() => handleOpenMaintenance(vehicle)}>Registrar Manutenção</Button>
                <Button size="small" startIcon={<HistoryIcon />} onClick={() => navigate(`/vehicle/${vehicle.id}/history`)}>Histórico</Button>
                <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditVehicle(vehicle)}>Editar</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{vehicleForm.id ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Marca"
            fullWidth
            value={vehicleForm.make}
            onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Modelo"
            fullWidth
            value={vehicleForm.model}
            onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Ano"
            type="number"
            fullWidth
            value={vehicleForm.year}
            onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
          />
          <TextField
            margin="dense"
            label="KM Atual"
            type="number"
            fullWidth
            value={vehicleForm.current_km}
            onChange={(e) => setVehicleForm({ ...vehicleForm, current_km: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Placa"
            fullWidth
            value={vehicleForm.license_plate}
            onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value.toUpperCase() })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveVehicle}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)}>
        <DialogTitle>Registrar Manutenção</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Tipo de Manutenção</InputLabel>
            <Select
              value={maintenanceData.maintenance_type_id}
              label="Tipo de Manutenção"
              onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenance_type_id: e.target.value })}
            >
              {maintenanceTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="KM Realizada"
            type="number"
            fullWidth
            value={maintenanceData.km_performed}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, km_performed: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Data"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={maintenanceData.date_performed}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, date_performed: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Valor Serviço (R$)"
                type="number"
                fullWidth
                value={maintenanceData.service_cost}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, service_cost: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Valor Peças (R$)"
                type="number"
                fullWidth
                value={maintenanceData.product_cost}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, product_cost: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Observações"
            fullWidth
            multiline
            rows={3}
            value={maintenanceData.notes}
            onChange={(e) => setMaintenanceData({ ...maintenanceData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceOpen(false)}>Cancelar</Button>
          <Button onClick={handleRegisterMaintenance}>Registrar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}