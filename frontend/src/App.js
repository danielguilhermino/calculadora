import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Tabs, Tab } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Rentabilidade from './components/Rentabilidade';
import AssetCRUD from './components/AssetCRUD';
import Comparador from './components/AssetComparador';

// Define um tema escuro para o dashboard
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Calculadora de Rentabilidade Acumulada
            </Typography>
            <Tabs value={currentTab} onChange={handleTabChange} textColor="inherit" indicatorColor="secondary">
              <Tab label="Ativos Sintéticos" />
              <Tab label="Cálculo de Rentabilidade" />
              <Tab label="Comparador" />
            </Tabs>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {currentTab === 0 && <AssetCRUD />}
          {currentTab === 1 && <Rentabilidade />}
          {currentTab === 2 && <Comparador />} 
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;