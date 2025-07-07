import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Autocomplete, TextField, Button, CircularProgress, Box, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const AssetComparador = () => {
    const [allAssets, setAllAssets] = useState([]);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [dates, setDates] = useState({
        data_inicial: dayjs('2020-08-01'),
        data_final: dayjs('2023-12-31')
    });
    const [chartData, setChartData] = useState({ series: [], dataset: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedAssets.length === 0) {
            setError('Selecione pelo menos um ativo para comparar.');
            return;
        }
        setLoading(true);
        setError('');
        setChartData({ series: [], dataset: [] });

        try {
            // Cria um array de promises, uma para cada requisição de API
            const promises = selectedAssets.map(asset => {
                const params = {
                    indice: asset.nome,
                    data_inicial: dates.data_inicial.format('YYYY-MM-DD'),
                    data_final: dates.data_final.format('YYYY-MM-DD'),
                };
                return apiClient.get('/rentabilidade/', { params });
            });

            // Executa todas as promises em paralelo
            const responses = await Promise.all(promises);

            // Processa e mescla os resultados para o formato do gráfico
            processChartData(responses.map(res => res.data));

        } catch (err) {
            setError('Erro ao buscar dados para comparação.');
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (results) => {
        const mergedData = {};
        const seriesConfig = [];

        results.forEach((result, index) => {
            const assetName = selectedAssets[index].nome;
            seriesConfig.push({ dataKey: assetName, label: assetName, valueFormatter: (v) => `${v.toFixed(2)}%` });

            let accumulated = 1;
            result.rentabilidades_mensais.forEach(item => {
                const monthKey = `${item.ano}-${item.mes.toString().padStart(2, '0')}`;
                accumulated *= (1 + item.rentabilidade);
                if (!mergedData[monthKey]) {
                    mergedData[monthKey] = { mes: new Date(item.ano, item.mes - 1) };
                }
                mergedData[monthKey][assetName] = (accumulated - 1) * 100;
            });
        });
        
        // Converte o objeto mesclado em um array e ordena por data
        const dataset = Object.values(mergedData).sort((a, b) => a.mes - b.mes);

        // Adiciona o ponto zero inicial
        const initialPoint = { mes: dayjs(dataset[0]?.mes).subtract(1, 'month').toDate() };
        seriesConfig.forEach(s => initialPoint[s.dataKey] = 0);
        dataset.unshift(initialPoint);
        
        setChartData({ series: seriesConfig, dataset });
    };

    return (
        <Grid container spacing={3}>
            {/* Formulário */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>Comparador de Ativos</Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Autocomplete
                                multiple
                                limitTags={3}
                                options={allAssets}
                                getOptionLabel={(option) => option.nome}
                                value={selectedAssets}
                                onChange={(event, newValue) => setSelectedAssets(newValue)}
                                sx={{ minWidth: 300 }}
                                renderInput={(params) => <TextField {...params} label="Ativos / Índices" />}
                            />
                            <DatePicker label="Data Inicial" value={dates.data_inicial} onChange={(v) => setDates(d => ({...d, data_inicial: v}))} format="DD/MM/YYYY" />
                            <DatePicker label="Data Final" value={dates.data_final} onChange={(v) => setDates(d => ({...d, data_final: v}))} format="DD/MM/YYYY" />
                            <Button type="submit" variant="contained" disabled={loading} size="large">
                                {loading ? <CircularProgress size={24} /> : 'Comparar'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Gráfico de Comparação */}
            {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
            {chartData.dataset.length > 0 && (
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Comparativo de Rentabilidade Acumulada</Typography>
                            <Box sx={{ width: '100%', height: 500 }}>
                                <LineChart
                                    dataset={chartData.dataset}
                                    xAxis={[{ 
                                        dataKey: 'mes', 
                                        scaleType: 'time',
                                        valueFormatter: (date) => dayjs(date).format('MMM/YY'),
                                    }]}
                                    series={chartData.series}
                                    margin={{ left: 80 }} // Adiciona margem para os labels do eixo Y não cortarem
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Grid>
    );
};

export default AssetComparador;