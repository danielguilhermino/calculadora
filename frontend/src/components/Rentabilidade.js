import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Box, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LineChart } from '@mui/x-charts/LineChart';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiClient from '../services/api';

import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const Rentabilidade = () => {
    const [allAssets, setAllAssets] = useState([]);
    const [form, setForm] = useState({
        indice: 'CDI',
        data_inicial: dayjs('2020-08-01'),
        data_final: dayjs('2025-07-02')
    });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssets = async () => {
            const baseIndices = [{ nome: 'CDI' }, { nome: 'IPCA' }, { nome: 'Ibovespa' }];
            try {
                const response = await apiClient.get('/ativos-sinteticos/');
                setAllAssets([...baseIndices, ...response.data]);
            } catch (err) {
                console.error("Erro ao buscar ativos:", err);
                setAllAssets(baseIndices);
            }
        };
        fetchAssets();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDateChange = (name, newValue) => {
        setForm({ ...form, [name]: newValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const params = {
                indice: form.indice,
                data_inicial: form.data_inicial.format('YYYY-MM-DD'),
                data_final: form.data_final.format('YYYY-MM-DD'),
            };
            const response = await apiClient.get('/rentabilidade/', { params });
            setResult(response.data);
        } catch (err) {
            setError('Erro ao calcular rentabilidade. Período disponível: 01/08/2020 e 02/07/2025.');
        } finally {
            setLoading(false);
        }
    };
    
    const formatPercent = (value) => (value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const getChartData = () => {
        if (!result || !result.rentabilidades_mensais || result.rentabilidades_mensais.length === 0) return [];
        let accumulated = 1;
        const data = result.rentabilidades_mensais.map(item => {
            accumulated *= (1 + item.rentabilidade);
            return {
                mes: new Date(item.ano, item.mes - 1),
                valor: (accumulated - 1) * 100,
            };
        });
        const firstMonth = new Date(result.rentabilidades_mensais[0].ano, result.rentabilidades_mensais[0].mes - 2);
        return [{ mes: firstMonth, valor: 0 }, ...data];
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" component="h2" gutterBottom>
                                Calculadora de Rentabilidade
                            </Typography>
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                 <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Índice / Ativo</InputLabel>
                                    <Select name="indice" value={form.indice} label="Índice / Ativo" onChange={handleChange}>
                                        {allAssets.map(asset => <MenuItem key={asset.nome} value={asset.nome}>{asset.nome}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <DatePicker label="Data Inicial" value={form.data_inicial} onChange={(newValue) => handleDateChange('data_inicial', newValue)} format="DD/MM/YYYY" />
                                <DatePicker label="Data Final" value={form.data_final} onChange={(newValue) => handleDateChange('data_final', newValue)} format="DD/MM/YYYY"/>
                                <Button type="submit" variant="contained" disabled={loading} size="large">
                                    {loading ? <CircularProgress size={24} /> : 'Calcular'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                {error && <Grid item xs={12}><Typography color="error">{error}</Typography></Grid>}
                {result && (
                    <>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>Rentabilidade Acumulada no Período</Typography>
                                    <Typography variant="h4" component="div">{formatPercent(result.rentabilidade_acumulada)}%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                         <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Gráfico de Rentabilidade Acumulada</Typography>
                                    <Box sx={{ width: '100%', height: 400 }}>
                                        <LineChart
                                            dataset={getChartData()}
                                            xAxis={[{ dataKey: 'mes', scaleType: 'time', valueFormatter: (date) => dayjs(date).format('MMM/YY') }]}
                                            series={[{ dataKey: 'valor', label: 'Rentabilidade Acumulada (%)', valueFormatter: (value) => `${value.toFixed(2)}%`, color: '#90caf9' }]}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom component="div">Evolução Anual</Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ano</TableCell>
                                            <TableCell align="right">Rentabilidade (%)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {result.rentabilidades_anuais.map((item) => (
                                            <TableRow key={item.ano}>
                                                <TableCell>{item.ano}</TableCell>
                                                <TableCell align="right">{formatPercent(item.rentabilidade)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        {/* ... tabela mensal ... */}
                        <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom component="div">Evolução Mês a Mês</Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ano</TableCell>
                                            <TableCell>Mês</TableCell>
                                            <TableCell align="right">Rentabilidade (%)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {result.rentabilidades_mensais.map((item) => (
                                            <TableRow key={`${item.ano}-${item.mes}`}>
                                                <TableCell>{item.ano}</TableCell>
                                                <TableCell>
                                                    {new Date(item.ano, item.mes - 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                                                </TableCell>
                                                <TableCell align="right">{formatPercent(item.rentabilidade)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </>
                )}
            </Grid>
        </LocalizationProvider>
    );
};

export default Rentabilidade;