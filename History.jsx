import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuthContext } from './App.jsx';

export default function History() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:8090/vehicles/${id}/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(response.data);
      } catch (error) {
        console.error("Erro ao buscar histórico", error);
      }
    };
    if (token) fetchHistory();
  }, [id, token]);

  return (
    <Container>
        <Box sx={{ mb: 3, mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>Voltar</Button>
            <Typography variant="h4">Histórico de Manutenção</Typography>
        </Box>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>KM</TableCell>
                        <TableCell>Valor Serviço</TableCell>
                        <TableCell>Valor Peças</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Observações</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {history.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell>{new Date(row.date_performed).toLocaleDateString()} {new Date(row.date_performed).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                            <TableCell>{row.maintenance_type}</TableCell>
                            <TableCell>{row.km_performed} km</TableCell>
                            <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.service_cost || 0)}</TableCell>
                            <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.product_cost || 0)}</TableCell>
                            <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((row.service_cost || 0) + (row.product_cost || 0))}</TableCell>
                            <TableCell>{row.notes || '-'}</TableCell>
                        </TableRow>
                    ))}
                    {history.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} align="center">Nenhuma manutenção registrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Container>
  );
}