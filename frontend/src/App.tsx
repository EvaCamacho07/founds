import React, { useState, useEffect } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import { AccountBalance, TrendingUp, Notifications, History } from '@mui/icons-material';

import FundDashboard from './components/FundDashboard';
import TransactionHistory from './components/TransactionHistory';
import NotificationCenter from './components/NotificationCenter';


// Create MUI theme with Colombian colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f57c00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
       <AppBar position="static">
          <Toolbar>
            {/* Icon + Title */}
            <AccountBalance sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              BTG Pactual - Gestión de Fondos de Pensión
            </Typography>

            {/* Username on the right */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                User Eva
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
       

          {/* Navigation Tabs */}
          <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              aria-label="fund management tabs"
              variant="fullWidth"
            >
              <Tab 
                icon={<TrendingUp />} 
                label="Fondos Disponibles" 
                id="tab-0"
                aria-controls="tabpanel-0"
              />
              <Tab 
                icon={<History />} 
                label="Historial" 
                id="tab-1"
                aria-controls="tabpanel-1"
              />
              <Tab 
                icon={<Notifications />} 
                label="Notificaciones" 
                id="tab-2"
                aria-controls="tabpanel-2"
              />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            <FundDashboard />
          </TabPanel>
          <TabPanel value={currentTab} index={1}>
            <TransactionHistory />
          </TabPanel>
          <TabPanel value={currentTab} index={2}>
            <NotificationCenter />
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
