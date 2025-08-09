import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment,
  FormHelperText,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Info,
  AccountBalance,
  AttachMoney,
} from "@mui/icons-material";
import axios from "axios";

interface Fund {
  id: number;
  name: string;
  type: string;
  minimumAmount: number;
  description: string;
  subscribed?: boolean;
  subscribedAmount?: number;
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
    status: string; 
  }>;
}

interface SubscriptionDialog {
  open: boolean;
  fund: Fund | null;
  amount: string;
}

const FundDashboard: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance>({
    availableBalance: 500000, // Initial balance
    totalInvested: 0,
    subscriptions: [],
  });
  const [loading, setLoading] = useState(true);
  const [subscriptionDialog, setSubscriptionDialog] =
    useState<SubscriptionDialog>({
      open: false,
      fund: null,
      amount: "",
    });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    loadUserData();
    fetchFunds();
  }, []);

  useEffect(() => {
    // Actualizar fondos con información de suscripciones cuando cambie userBalance
    if (funds.length > 0) {
      const fundsWithSubscriptions = funds.map((fund: Fund) => {
        // Solo considerar suscripciones activas (no canceladas)
        const subscription = userBalance.subscriptions.find(
          (sub) => sub.fundId === fund.id && sub.status === 'active'
        );
        return {
          ...fund,
          subscribed: !!subscription,
          subscribedAmount: subscription?.amount || 0,
        };
      });

      setFunds(fundsWithSubscriptions);
    }
  }, [userBalance.subscriptions]);

  const fetchFunds = async () => {
    try {
      const response = await axios.get("https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/funds");
      setFunds(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching funds:", error);
      setSnackbar({
        open: true,
        message: "Error al cargar los fondos desde el backend",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userResponse = await axios.get(
        "https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/users/user123"
      );

      const userData = userResponse.data.data || userResponse.data;

      setUserBalance({
        availableBalance: userData.availableBalance || 500000,
        totalInvested: userData.totalInvested || 0,
        subscriptions: userData.subscriptions || [],
      });
    } catch (error) {
      console.error("Error loading user data from DynamoDB:", error);
      setUserBalance({
        availableBalance: 500000,
        totalInvested: 0,
        subscriptions: [],
      });
    }
  };

  const handleSubscribe = (fund: Fund) => {
    if (fund.subscribed) {
      setSnackbar({
        open: true,
        message: `Ya tienes una suscripción activa en ${fund.name}`,
        severity: "error",
      });
      return;
    }

    setSubscriptionDialog({
      open: true,
      fund,
      amount: fund.minimumAmount.toString(),
    });
  };

  const handleCancelSubscription = async (fund: Fund) => {
    try {
      const subscription = userBalance.subscriptions.find(
        (sub) => sub.fundId === fund.id && sub.status === 'active'
      );
      if (!subscription) {
        setSnackbar({
          open: true,
          message: 'No hay suscripción activa para cancelar',
          severity: 'error',
        });
        return;
      }

      await axios.post(
        `https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/transactions/cancel`,
        {
          userId: "user123",
          subscriptionId: subscription.subscriptionId
        }
      );

      await loadUserData();

      setFunds((prev) =>
        prev.map((f) =>
          f.id === fund.id
            ? { ...f, subscribed: false, subscribedAmount: 0 }
            : f
        )
      );

      try {
        await axios.post("https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/notifications", {
          userId: "user123",
          type: "email",
          title: "Cancelación Exitosa",
          message: `Su cancelación del fondo ${fund.name} por ${formatCurrency(
            subscription.amount
          )} ha sido procesada. El monto ha sido devuelto a su saldo disponible.`,
          category: "transaction",
        });
      } catch (notifError) {
        console.log("Error creating notification:", notifError);
      }

      setSnackbar({
        open: true,
        message: `Suscripción cancelada. ${formatCurrency(
          subscription.amount
        )} devueltos a tu saldo.`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      setSnackbar({
        open: true,
        message: "Error al cancelar la suscripción",
        severity: "error",
      });
    }
  };

  const handleSubscriptionSubmit = async () => {
    if (!subscriptionDialog.fund) return;

    const amount = parseInt(subscriptionDialog.amount);
    const fund = subscriptionDialog.fund;

    if (amount < fund.minimumAmount) {
      setSnackbar({
        open: true,
        message: `El monto mínimo para este fondo es ${formatCurrency(
          fund.minimumAmount
        )}`,
        severity: "error",
      });
      return;
    }

    if (amount > userBalance.availableBalance) {
      setSnackbar({
        open: true,
        message: `Saldo insuficiente. Tienes disponible ${formatCurrency(
          userBalance.availableBalance
        )}`,
        severity: "error",
      });
      return;
    }

    try {
      const response = await axios.post(`https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/transactions/subscribe`, {
        userId: "user123",
        fundId: fund.id,
        amount: amount,
      });

      await loadUserData();

      setFunds((prev) =>
        prev.map((f) =>
          f.id === fund.id
            ? { ...f, subscribed: true, subscribedAmount: amount }
            : f
        )
      );

      try {
        await axios.post("https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api/notifications", {
          userId: "user123",
          type: "email",
          title: "Suscripción Exitosa",
          message: `Su suscripción al fondo ${fund.name} por ${formatCurrency(
            amount
          )} ha sido procesada exitosamente.`,
          category: "transaction",
        });
      } catch (notifError) {
        console.log("Error creating notification:", notifError);
      }

      setSnackbar({
        open: true,
        message: `¡Suscripción exitosa! Has invertido ${formatCurrency(
          amount
        )} en ${fund.name}`,
        severity: "success",
      });

      setSubscriptionDialog({
        open: false,
        fund: null,
        amount: "",
      });
    } catch (error: any) {
      console.error("Error subscribing to fund:", error);

      const backendMessage =
        error.response?.data?.error || "Error al procesar la suscripción";
      setSnackbar({
        open: true,
        message: backendMessage,
        severity: "error",
      });
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FPV":
        return "primary";
      case "FIC":
        return "secondary";
      default:
        return "default";
    }
  };

  const getFundIcon = (category: string) => {
    switch (category) {
      case "FPV":
        return <TrendingUp />;
      case "FIC":
        return <AccountBalance />;
      default:
        return <Info />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* User Balance Summary */}
      <Card
        sx={{ mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-around" alignItems="center">
            <Box textAlign="center">
              <Typography variant="h6">Saldo Disponible</Typography>
              <Typography variant="h4">
                {formatCurrency(userBalance.availableBalance)}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6">Total Invertido</Typography>
              <Typography variant="h4">
                {formatCurrency(userBalance.totalInvested)}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6">Fondos Suscritos</Typography>
              <Typography variant="h4">
                {userBalance.subscriptions.filter(sub => sub.status === 'active').length}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {funds.map((fund) => (
          <Card
            key={fund.id}
            sx={{
              minWidth: 300,
              maxWidth: 350,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {getFundIcon(fund.type)}
                <Typography variant="h6" component="h2">
                  {fund.name}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {fund.description}
              </Typography>

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={fund.type}
                  color={getCategoryColor(fund.type) as any}
                  size="small"
                />
                {fund.subscribed && (
                  <Chip
                    label="SUSCRITO"
                    color="success"
                    variant="filled"
                    size="small"
                  />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                <strong>Monto mínimo:</strong>{" "}
                {formatCurrency(fund.minimumAmount)}
              </Typography>

              {fund.subscribed && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  <strong>Invertido:</strong>{" "}
                  {formatCurrency(fund.subscribedAmount || 0)}
                </Typography>
              )}
            </CardContent>

            <CardActions>
              {fund.subscribed ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleCancelSubscription(fund)}
                  fullWidth
                >
                  Cancelar Suscripción
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => handleSubscribe(fund)}
                  disabled={userBalance.availableBalance < fund.minimumAmount}
                  fullWidth
                >
                  {userBalance.availableBalance < fund.minimumAmount
                    ? `No tiene saldo disponible para vincularse al fondo ${fund.name}`
                    : "Suscribirse"}
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Subscription Dialog */}
      <Dialog
        open={subscriptionDialog.open}
        onClose={() =>
          setSubscriptionDialog({ open: false, fund: null, amount: "" })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Suscribirse a {subscriptionDialog.fund?.name}</DialogTitle>
        <DialogContent>
          {subscriptionDialog.fund && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Monto mínimo:</strong>{" "}
                  {formatCurrency(subscriptionDialog.fund.minimumAmount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Saldo disponible:</strong>{" "}
                  {formatCurrency(userBalance.availableBalance)}
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Monto a invertir"
                type="number"
                value={subscriptionDialog.amount}
                onChange={(e) =>
                  setSubscriptionDialog((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                helperText={`Mínimo: ${formatCurrency(
                  subscriptionDialog.fund.minimumAmount
                )}`}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setSubscriptionDialog({ open: false, fund: null, amount: "" })
            }
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubscriptionSubmit}
            variant="contained"
            disabled={
              !subscriptionDialog.amount ||
              parseInt(subscriptionDialog.amount) <
                (subscriptionDialog.fund?.minimumAmount || 0)
            }
          >
            Confirmar Suscripción
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FundDashboard;
