import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Home,
  Payment,
  ArrowUpward,
  ArrowDownward,
  CalendarToday,
  Receipt,
  CheckCircle,
  Close,
  Visibility,
  CreditCard,
  AccountBalance,
  LocalAtm,
  Warning,
  Info,
  ContentCopy,
  QrCode as QrCodeIcon,
  AccountBalanceWallet as WalletIcon,
  CurrencyBitcoin,
  CurrencyExchange,
  Refresh,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  db,
  auth,
  createOrUpdateUser,
  listenToUserDashboard,
  getUserTransactions
} from '../SharedFirebase';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    activeContracts: 0,
    totalInvested: 0,
    pendingPayments: 0,
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [cryptoPaymentMethod, setCryptoPaymentMethod] = useState('bitcoin');
  const [activeCryptoAddress, setActiveCryptoAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeContracts, setActiveContracts] = useState([]);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Crypto addresses for different currencies
  const cryptoAddresses = {
    bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ethereum: '0x742d35Cc6634C0532925a3b844Bc9e0E3F1e1F1F',
    usdt: '0x742d35Cc6634C0532925a3b844Bc9e0E3F1e1F1F'
  };

  // Crypto currency symbols
  const cryptoCurrencies = {
    bitcoin: { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
    ethereum: { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
    usdt: { symbol: 'USDT', name: 'Tether (USDT)', color: '#26A17B' }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('User authenticated:', firebaseUser.uid);
        setUser(firebaseUser);
        
        // Ensure user document exists using createOrUpdateUser
        await createOrUpdateUser(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
        });
        
        setLoading(false);
      } else {
        console.log('No user authenticated');
        setUser(null);
        setLoading(false);
        toast.error('Please login to view dashboard');
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // REAL-TIME LISTENERS
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user ID, skipping real-time listeners');
      return;
    }

    console.log('Setting up real-time listeners for user:', user.uid);
    
    // Listen to user document changes
    const userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        console.log('📡 USER UPDATE:', userData);
        
        setStats({
          totalDeposits: userData.totalDeposits || 0,
          activeContracts: userData.activeContracts || 0,
          totalInvested: userData.totalInvested || 0,
          pendingPayments: userData.pendingPayments || 0,
        });
      }
    });
    
    // Listen to user contracts
    const contractsQuery = query(
      collection(db, 'contracts'),
      where('buyerId', '==', user.uid),
      where('status', 'in', ['active', 'pending'])
    );
    
    const contractsUnsubscribe = onSnapshot(contractsQuery, (snapshot) => {
      const contractsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📡 CONTRACTS UPDATE:', contractsData.length, 'contracts');
      setContracts(contractsData);
    });
    
    // Listen to user transactions - CRITICAL FIX
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Transaction data:', data); // Debug log
        
        // Handle timestamp conversion
        let createdAt = new Date().toISOString();
        if (data.createdAt) {
          createdAt = data.createdAt.toDate 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt;
        } else if (data.timestamp) {
          createdAt = data.timestamp.toDate 
            ? data.timestamp.toDate().toISOString() 
            : data.timestamp;
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
          amount: data.amount || 0,
          type: data.type || 'unknown',
          status: data.status || 'pending'
        };
      });
      
      console.log('📡 TRANSACTIONS UPDATE:', transactionsData.length, 'transactions');
      console.log('Sample transaction:', transactionsData[0]);
      setTransactions(transactionsData);
    }, (error) => {
      console.error('Error listening to transactions:', error);
      toast.error('Failed to load transactions');
    });

    return () => {
      console.log('Cleaning up real-time listeners');
      userUnsubscribe();
      contractsUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
  fetchActiveContracts();
}, [user]);

const fetchActiveContracts = async () => {
  if (!user?.uid) return;
  
  try {
    const contractsRef = collection(db, 'contracts');
    const q = query(contractsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const contracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setActiveContracts(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
  }
};

  // Function to manually refresh data
  const refreshData = async () => {
    if (!user?.uid) return;
    
    setRefreshing(true);
    
    try {
      // Get fresh user data
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setStats({
          totalDeposits: userData.totalDeposits || 0,
          activeContracts: userData.activeContracts || 0,
          totalInvested: userData.totalInvested || 0,
          pendingPayments: userData.pendingPayments || 0,
        });
      }
      
      // Get fresh transactions
      const transactionsData = await getUserTransactions(user.uid);
      const formattedTransactions = transactionsData.map(tx => ({
        ...tx,
        createdAt: tx.createdAt instanceof Date 
          ? tx.createdAt.toISOString() 
          : tx.createdAt || new Date().toISOString()
      }));
      
      console.log('Refreshed transactions:', formattedTransactions.length);
      setTransactions(formattedTransactions);
      
      toast.success('Dashboard refreshed!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: isSmallMobile ? 1.5 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: isSmallMobile ? 1 : 2 }}>
          <Box sx={{ 
            bgcolor: `${color}.50`, 
            p: isSmallMobile ? 0.75 : 1, 
            borderRadius: 1, 
            mr: isSmallMobile ? 1 : 2 
          }}>
            <Icon sx={{ 
              color: `${color}.main`,
              fontSize: isSmallMobile ? 20 : 24
            }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              color="text.secondary" 
              variant={isSmallMobile ? "caption" : "body2"}
              sx={{ 
                fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant={isSmallMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 700,
                fontSize: isSmallMobile ? '1rem' : '1.5rem'
              }}
            >
              ${typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography 
            variant={isSmallMobile ? "caption" : "body2"} 
            color="text.secondary"
            sx={{ fontSize: isSmallMobile ? '0.7rem' : '0.875rem' }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Calculate pending installments for a contract
  const getPendingInstallmentsCount = (contract) => {
    return contract.installments?.filter(inst => inst.status === 'pending').length || 0;
  };

  // Get the next due date for a contract
  const getNextDueDate = (contract) => {
    const pending = contract.installments?.filter(inst => inst.status === 'pending');
    if (pending && pending.length > 0) {
      return pending[0].dueDate;
    }
    return null;
  };

  // Format date for display - IMPROVED VERSION
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    
    try {
      let date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput.toDate) {
        date = dateInput.toDate();
      } else {
        return 'Invalid Date';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return 'N/A';
    }
  };

  // Handle viewing transaction details
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDialogOpen(true);
  };

  // Handle installment payment
  const handlePayInstallment = (contract, installment) => {
    setSelectedContract(contract);
    setSelectedInstallment(installment);
    
    // Set default crypto method and calculate amount
    setCryptoPaymentMethod('bitcoin');
    calculateCryptoAmount('bitcoin', installment.amount);
    setActiveCryptoAddress(cryptoAddresses.bitcoin);
    
    setPaymentDialogOpen(true);
  };

  // Calculate crypto amount based on selected currency
  const calculateCryptoAmount = (cryptoType, amountUSD) => {
    const conversionRates = {
      bitcoin: 0.000017,
      ethereum: 0.00052,
      usdt: 1
    };

    if (conversionRates[cryptoType]) {
      const calculatedAmount = (amountUSD * conversionRates[cryptoType]).toFixed(8);
      setCryptoAmount(calculatedAmount);
    }
  };

  // Handle crypto payment method change
  const handleCryptoMethodChange = (method) => {
    setCryptoPaymentMethod(method);
    setActiveCryptoAddress(cryptoAddresses[method]);
    if (selectedInstallment) {
      calculateCryptoAmount(method, selectedInstallment.amount);
    }
  };

  // Copy crypto address to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Address copied to clipboard!');
    });
  };

  // Get transaction status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': 
      case 'confirmed': 
      case 'paid': 
        return 'success';
      case 'pending': 
        return 'warning';
      case 'failed': 
      case 'cancelled': 
        return 'error';
      default: 
        return 'default';
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch(method?.toLowerCase()) {
      case 'bitcoin': 
        return <CurrencyBitcoin />;
      case 'ethereum': 
        return <CurrencyExchange />;
      case 'usdt': 
        return <WalletIcon />;
      case 'card': 
        return <CreditCard />;
      case 'bank_transfer': 
        return <AccountBalance />;
      default: 
        return <LocalAtm />;
    }
  };

  // Handle make deposit
  const handleMakeDeposit = () => {
    navigate('/deposit');
  };

  // Manual refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  // Filter and sort recent transactions
  const getRecentTransactions = () => {
    return transactions
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Please Login
        </Typography>
        <Typography color="text.secondary" paragraph>
          You need to be logged in to view the dashboard.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/login"
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  const recentTransactions = getRecentTransactions();

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 4,
        pt: isMobile ? 2 : 4
      }}
    >
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 0 }}>
            Welcome back, {user?.displayName || user?.email || 'User'}!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transactions.length} transactions • {contracts.length} contracts
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outlined"
          size="small"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={AccountBalanceWallet}
            title="Total Deposits"
            value={stats.totalDeposits}
            color="primary"
            subtitle="Available for payments"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={Home}
            title="Active Contracts"
            value={stats.activeContracts}
            color="success"
            subtitle="Properties you're buying"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={TrendingUp}
            title="Total Invested"
            value={stats.totalInvested}
            color="warning"
            subtitle="Amount paid so far"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={Payment}
            title="Pending Payments"
            value={stats.pendingPayments}
            color="error"
            subtitle="Installments due"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: isSmallMobile ? 2 : 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          '& .MuiButton-root': {
            flex: isSmallMobile ? '1 1 calc(50% - 16px)' : 'none',
            minWidth: isSmallMobile ? 'auto' : 140
          }
        }}>
          <Button
            variant="contained"
            startIcon={<ArrowUpward />}
            size={isSmallMobile ? "small" : "medium"}
            onClick={handleMakeDeposit}
          >
            Make Deposit
          </Button>
          <Button
            component={Link}
            to="/properties"
            variant="outlined"
            startIcon={<Home />}
            size={isSmallMobile ? "small" : "medium"}
          >
            Browse Properties
          </Button>
          {contracts.length > 0 && (
            <Button
              component={Link}
              to={`/installment/${contracts[0].id}`}
              variant="contained"
              startIcon={<Payment />}
              size={isSmallMobile ? "small" : "medium"}
              sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
            >
              Pay Installment
            </Button>
          )}
        </Box>
      </Paper>

      {/* Active Contracts & Recent Transactions */}
      <Grid container spacing={isSmallMobile ? 2 : 4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: isSmallMobile ? 2 : 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Active Contracts
              </Typography>
              <Chip 
                label={`${contracts.length} Properties`} 
                color="primary" 
                size="small" 
                variant="outlined"
              />
            </Box>
            {contracts.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {contracts.map((contract) => {
                  const pendingCount = getPendingInstallmentsCount(contract);
                  const nextDueDate = getNextDueDate(contract);
                  const progress = contract.totalAmount > 0 
                    ? Math.round((contract.amountPaid || 0) / contract.totalAmount * 100) 
                    : 0;
                  
                  return (
                    <Box 
                      key={contract.id} 
                      sx={{ 
                        mb: 3, 
                        p: isSmallMobile ? 1.5 : 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          borderColor: 'primary.light',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: isSmallMobile ? '1rem' : '1.125rem', fontWeight: 600 }}>
                            {contract.propertyTitle || 'Untitled Property'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Contract #{contract.id.substring(0, 8)}...
                          </Typography>
                        </Box>
                        <Chip 
                          label={contract.status || 'Active'} 
                          color={contract.status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      
                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            ${(contract.amountPaid || 0).toLocaleString()} of ${contract.totalAmount?.toLocaleString() || '0'}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {progress}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      {/* Contract Details */}
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Next Payment Due
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {nextDueDate ? formatDate(nextDueDate) : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Pending Installments
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color={pendingCount > 0 ? 'error.main' : 'success.main'}>
                            {pendingCount}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      {pendingCount > 0 && contract.installments && (
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => {
                            const pending = contract.installments.filter(inst => inst.status === 'pending');
                            if (pending && pending.length > 0) {
                              handlePayInstallment(contract, pending[0]);
                            }
                          }}
                          sx={{ mt: 2 }}
                        >
                          Pay Next Installment (${contract.installments.find(inst => inst.status === 'pending')?.amount?.toLocaleString() || '0'})
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No active contracts</Typography>
                <Button 
                  component={Link} 
                  to="/properties" 
                  sx={{ mt: 2 }}
                  size={isSmallMobile ? "small" : "medium"}
                >
                  Browse Properties
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: isSmallMobile ? 2 : 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Transactions
              </Typography>
              <Chip 
                label={`${transactions.length} Total`} 
                color="primary" 
                size="small" 
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Latest {Math.min(5, recentTransactions.length)} transactions
            </Typography>
            
            {recentTransactions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem', fontWeight: 600 }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem', fontWeight: 600 }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem', fontWeight: 600 }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem', fontWeight: 600 }}>
                        View
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow 
                        key={tx.id} 
                        hover
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          '&:last-child td, &:last-child th': { border: 0 },
                          opacity: tx.status === 'pending' ? 0.8 : 1,
                          bgcolor: tx.status === 'pending' ? 'warning.50' : 'transparent'
                        }}
                      >
                        <TableCell sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}>
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {tx.type === 'deposit' ? (
                              <ArrowUpward sx={{ 
                                color: 'success.main', 
                                fontSize: isSmallMobile ? 14 : 16, 
                                mr: 0.5 
                              }} />
                            ) : (
                              <ArrowDownward sx={{ 
                                color: tx.status === 'pending' ? 'warning.main' : 'primary.main', 
                                fontSize: isSmallMobile ? 14 : 16, 
                                mr: 0.5 
                              }} />
                            )}
                            <Typography sx={{ 
                              fontWeight: 600, 
                              color: tx.type === 'deposit' ? 'success.main' : 
                                     tx.status === 'pending' ? 'warning.main' : 'primary.main'
                            }}>
                              ${(tx.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.type || 'unknown'}
                            size="small"
                            color={getStatusColor(tx.status)}
                            sx={{ 
                              fontSize: isSmallMobile ? '0.7rem' : '0.875rem',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewTransaction(tx)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No transactions yet</Typography>
                <Button 
                  onClick={handleMakeDeposit}
                  sx={{ mt: 2 }}
                  size={isSmallMobile ? "small" : "medium"}
                  variant="outlined"
                >
                  Make First Deposit
                </Button>
              </Box>
            )}
            
            {transactions.length > 5 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  size="small" 
                  component={Link} 
                  to="/transactions"
                  variant="text"
                >
                  View All Transactions
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Installments ({activeContracts.length})
              </Typography>
              {activeContracts.map(contract => (
                <Paper key={contract.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1">{contract.propertyTitle}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total: ${contract.totalAmount?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid: ${contract.amountPaid?.toLocaleString()}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    component={Link}
                    to={`/installments/${contract.id}`}
                    sx={{ mt: 1 }}
                  >
                    Manage Installments
                  </Button>
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Transaction Details Dialog */}
      <Dialog 
        open={transactionDialogOpen} 
        onClose={() => setTransactionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTransaction && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Transaction Details
                </Typography>
                <IconButton onClick={() => setTransactionDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedTransaction.description || selectedTransaction.type || 'Transaction'}
                  </Typography>
                  <Chip
                    label={selectedTransaction.status || 'pending'}
                    color={getStatusColor(selectedTransaction.status)}
                    icon={selectedTransaction.status === 'completed' ? <CheckCircle /> : <Warning />}
                  />
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Transaction ID"
                      secondary={selectedTransaction.id || 'N/A'}
                      secondaryTypographyProps={{ sx: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Date"
                      secondary={formatDate(selectedTransaction.createdAt)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Amount"
                      secondary={
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                          ${(selectedTransaction.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {selectedTransaction.paymentMethod && (
                    <ListItem>
                      <ListItemText 
                        primary="Payment Method"
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                            <Typography variant="body2">
                              {selectedTransaction.paymentMethod}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  {selectedTransaction.contractId && (
                    <ListItem>
                      <ListItemText 
                        primary="Contract"
                        secondary={`#${selectedTransaction.contractId.substring(0, 8)}...`}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setTransactionDialogOpen(false)}
                variant="outlined"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Dashboard;