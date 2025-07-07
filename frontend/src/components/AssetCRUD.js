import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, TextField, FormControl, InputLabel, Select, MenuItem, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../services/api';

const AssetCRUD = () => {
    const [assets, setAssets] = useState([]);
    const [form, setForm] = useState({ id: null, nome: '', indice_base: 'CDI', spread: 5 });
    const [isEditMode, setIsEditMode] = useState(false);
    const [apiError, setApiError] = useState('');

    const fetchAssets = async () => {
        try {
            const response = await apiClient.get('/ativos-sinteticos/');
            setAssets(response.data);
        } catch (err) {
            console.error("Erro ao buscar ativos:", err);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError(''); // Limpa erros anteriores a cada nova tentativa

        const payload = { ...form, spread: parseFloat(form.spread) };

        try {
            if (isEditMode) {
                await apiClient.put(`/ativos-sinteticos/${form.id}`, payload);
            } else {
                await apiClient.post('/ativos-sinteticos/', payload);
            }
            resetForm();
            fetchAssets();
        } catch (err) {
            // --- TRATAMENTO DE ERRO AQUI ---
            if (err.response && err.response.status === 400 && err.response.data.detail) {
                // Se for um erro 400 com uma mensagem de 'detail', exibe essa mensagem
                setApiError(err.response.data.detail);
            } else {
                // Para outros tipos de erro
                setApiError('Ocorreu um erro inesperado. Por favor, tente novamente.');
                console.error("Erro ao salvar ativo:", err);
            }
        }
    };

    const handleEdit = (asset) => {
        setApiError(''); // Limpa o erro ao começar a editar
        setIsEditMode(true);
        const spreadAsPercentage = parseFloat((asset.spread * 100).toFixed(4));
        
        setForm({ ...asset, spread: spreadAsPercentage });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este ativo?')) {
            try {
                await apiClient.delete(`/ativos-sinteticos/${id}`);
                fetchAssets();
            } catch (err) {
                console.error("Erro ao excluir ativo:", err);
                setApiError('Não foi possível excluir o ativo.');
            }
        }
    };

    const resetForm = () => {
        setForm({ id: null, nome: '', indice_base: 'CDI', spread: 5 });
        setIsEditMode(false);
        setApiError(''); // Limpa o erro ao resetar o formulário
    };

    return (
        <Grid container spacing={3}>
            {/* Formulário */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            {isEditMode ? 'Editar Ativo' : 'Novo Ativo Sintético'}
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            {apiError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {apiError}
                                </Alert>
                            )}
                            <TextField label="Nome do Ativo" name="nome" value={form.nome} onChange={handleChange} fullWidth required margin="normal" />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Índice Base</InputLabel>
                                <Select name="indice_base" value={form.indice_base} label="Índice Base" onChange={handleChange}>
                                    <MenuItem value="CDI">CDI</MenuItem>
                                    <MenuItem value="IPCA">IPCA</MenuItem>
                                    <MenuItem value="Ibovespa">Ibovespa</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField label="Spread Anual (%)" name="spread" type="number" value={form.spread} onChange={handleChange} fullWidth required margin="normal" />
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button type="submit" variant="contained" color="primary">{isEditMode ? 'Salvar' : 'Criar'}</Button>
                                {isEditMode && <Button variant="outlined" onClick={resetForm}>Cancelar</Button>}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Lista de Ativos */}
            <Grid item xs={12} md={8}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell>Índice Base</TableCell>
                                <TableCell align="right">Spread Anual (%)</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assets.map((asset) => (
                                <TableRow key={asset.id}>
                                    <TableCell>{asset.nome}</TableCell>
                                    <TableCell>{asset.indice_base}</TableCell>
                                    <TableCell align="right">{(asset.spread * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => handleEdit(asset)}><EditIcon /></IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(asset.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
    );
};

export default AssetCRUD;