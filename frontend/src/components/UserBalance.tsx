import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
} from '@mui/material';


interface User {
  id: string;
  name: string;
  email: string;
}

interface UserBalance {
  availableBalance: number;
  totalInvested: number;
  subscriptions: Array<{
    subscriptionId: string;
    fundId: number;
    fundName: string;
    amount: number;
    subscriptionDate: string;
  }>;
}

const UserBalance: React.FC = () => {
  const [user] = useState<User>({
    id: 'user123',
    name: 'Eva Camacho',
    email: 'camachoeva.07@gmail.com',
  });

  const [userBalance, setUserBalance] = useState<UserBalance>({
    availableBalance: 500000, // Initial balance
    totalInvested: 0,
    subscriptions: []
  });

  useEffect(() => {
    loadUserData();
    
    // Polling para actualizar datos cada 30 segundos
    const interval = setInterval(loadUserData, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadUserData = async () => {
    try {
      // Cargar datos del usuario desde DynamoDB
      const balanceResponse = await fetch('http://localhost:3000/api/user/user123/balance');
      const subscriptionsResponse = await fetch('http://localhost:3000/api/user/user123/subscriptions');
      
      if (balanceResponse.ok && subscriptionsResponse.ok) {
        const balanceData = await balanceResponse.json();
        const subscriptionsData = await subscriptionsResponse.json();
        
        // El backend devuelve { success: true, balance: {...} }
        const balance = balanceData.balance || balanceData;
        
        setUserBalance({
          availableBalance: balance.availableBalance || 500000,
          totalInvested: balance.totalInvested || 0,
          subscriptions: subscriptionsData.subscriptions || []
        });
      }
    } catch (error) {
      console.error('Error loading user data from DynamoDB:', error);
      // Mantener el estado actual en caso de error
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalBalance = userBalance.availableBalance + userBalance.totalInvested;

  return (
       <Card sx={{ background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  {user.name} • {user.email}
                </Typography>
            </Box>
            <Box textAlign="right">
              <Chip 
                label="BTG Pactual" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
  );
};

export default UserBalance;
