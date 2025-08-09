import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Visibility, Cancel, TrendingUp, TrendingDown } from '@mui/icons-material';
import axios from 'axios';

interface Transaction {
  id: string;
  userId: string;
  fundId: string;
  fundName: string;
  type: 'subscription' | 'cancellation';
  amount: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; transaction: Transaction | null }>({
    open: false,
    transaction: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/transactions/user123');
      
      if (response.data.success) {
        const mappedTransactions = (response.data.data || []).map((transaction: any) => ({
          id: transaction.transactionId || transaction.id || 'unknown',
          userId: transaction.userId || 'user123',
          fundId: transaction.fundId?.toString() || 'unknown',
          fundName: transaction.fundName || 'Fondo desconocido',
          type: transaction.type || 'subscription',
          amount: transaction.amount || 0,
          createdAt: transaction.timestamp || transaction.createdAt || new Date().toISOString(),
          status: 'completed'
        }));
        
        setTransactions(mappedTransactions);
      } else {
        throw new Error(response.data.error || 'Error al obtener transacciones');
      }
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar el historial de transacciones',
        severity: 'error'
      });
      
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (transaction: Transaction) => {
    if (transaction.type !== 'subscription' || transaction.status !== 'completed') {
      setSnackbar({
        open: true,
        message: 'Solo se pueden cancelar suscripciones activas',
        severity: 'error'
      });
      return;
    }

    try {
      // Here you would make an API call to the backend
      // await axios.post('http://localhost:3000/api/funds/unsubscribe', {
      //   userId: transaction.userId,
      //   fundId: transaction.fundId,
      //   amount: transaction.amount
      // });

      setSnackbar({
        open: true,
        message: `Cancelación exitosa del fondo ${transaction.fundName}`,
        severity: 'success'
      });
      
      // Update the transaction list
      fetchTransactions();
      setCancelDialog({ open: false, transaction: null });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al procesar la cancelación',
        severity: 'error'
      });
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

  const formatDate = (dateString: string): string => {
    try {
      // Verificar si la fecha es válida
      if (!dateString) {
        return 'Fecha no disponible';
      }
      
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'Error en fecha';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'subscription' ? <TrendingUp /> : <TrendingDown />;
  };

  const getTypeColor = (type: string) => {
    return type === 'subscription' ? 'primary' : 'secondary';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Historial de Transacciones
      </Typography>
      
      {transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay transacciones registradas
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="transaction history table">
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                 <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Fondo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {transaction.id}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getTypeIcon(transaction.type)}
                      label={transaction.type === 'subscription' ? 'Suscripción' : 'Cancelación'}
                      color={getTypeColor(transaction.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                    {transaction.fundName}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status === 'completed' ? 'Completada' : 
                             transaction.status === 'pending' ? 'Pendiente' : 'Fallida'}
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedTransaction(transaction)}
                      title="Ver detalles"
                    >
                      <Visibility />
                    </IconButton>
                   
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Transaction Details Dialog */}
      <Dialog 
        open={selectedTransaction !== null} 
        onClose={() => setSelectedTransaction(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Transacción
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>ID:</strong> {selectedTransaction.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Fecha:</strong> {formatDate(selectedTransaction.createdAt)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Tipo:</strong> {selectedTransaction.type === 'subscription' ? 'Suscripción' : 'Cancelación'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Fondo:</strong> {selectedTransaction.fundName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Monto:</strong> {formatCurrency(selectedTransaction.amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Estado:</strong> {selectedTransaction.status === 'completed' ? 'Completada' : 
                                           selectedTransaction.status === 'pending' ? 'Pendiente' : 'Fallida'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTransaction(null)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog 
        open={cancelDialog.open} 
        onClose={() => setCancelDialog({ open: false, transaction: null })}
      >
        <DialogTitle>
          Confirmar Cancelación
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            ¿Está seguro que desea cancelar la suscripción al fondo{' '}
            <strong>{cancelDialog.transaction?.fundName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Monto a devolver: {cancelDialog.transaction && formatCurrency(cancelDialog.transaction.amount)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, transaction: null })}>
            Cancelar
          </Button>
          <Button 
            onClick={() => cancelDialog.transaction && handleCancelSubscription(cancelDialog.transaction)}
            color="error"
            variant="contained"
          >
            Confirmar Cancelación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionHistory;
