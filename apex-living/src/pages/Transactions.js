import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs
} from '@mui/material';
import {
  ArrowBack,
  Search,
  FilterList,
  Download,
  Print,
  Visibility,
  Receipt,
  AccountBalanceWallet,
  TrendingUp,
  Payment,
  Home,
  CalendarToday,
  CheckCircle,
  Warning,
  Close,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  History,
  CreditCard,
  AccountBalance,
  LocalAtm
} from '@mui/icons-material';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../SharedFirebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Transactions = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        toast.error('Please login to view transactions');
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time transactions listener
  useEffect(() => {
    if (!user?.uid) return;

    console.log('Setting up transactions listener for user:', user.uid);
    
    const transactionsQuery = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle timestamp conversion safely
        let createdAt = new Date().toISOString();
        try {
          if (data.createdAt && data.createdAt.toDate) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (data.createdAt) {
            createdAt = new Date(data.createdAt).toISOString();
          } else if (data.timestamp && data.timestamp.toDate) {
            createdAt = data.timestamp.toDate().toISOString();
          }
        } catch (error) {
          console.error('Error parsing date:', error);
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
          amount: parseFloat(data.amount) || 0,
          type: data.type || 'unknown',
          status: data.status || 'pending'
        };
      });
      
      console.log('📡 TRANSACTIONS UPDATE:', transactionsData.length, 'transactions');
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to transactions:', error);
      toast.error('Failed to load transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(term) ||
        tx.propertyTitle?.toLowerCase().includes(term) ||
        tx.type?.toLowerCase().includes(term) ||
        tx.id?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.createdAt);
        
        switch(dateFilter) {
          case 'today':
            return txDate >= today;
          case 'yesterday':
            return txDate >= yesterday && txDate < today;
          case 'week':
            return txDate >= lastWeek;
          case 'month':
            return txDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Tab filter
    if (activeTab === 1) {
      filtered = filtered.filter(tx => tx.type === 'deposit');
    } else if (activeTab === 2) {
      filtered = filtered.filter(tx => tx.type === 'installment');
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, typeFilter, dateFilter, activeTab]);

  // Format date for display
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    
    try {
      let date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      } else if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000);
      } else {
        return 'Invalid Date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return 'N/A';
    }
  };

  // Get transaction status color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    switch(status.toLowerCase()) {
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

  // Get transaction type icon
  const getTransactionTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'deposit':
        return <ArrowUpward sx={{ color: 'success.main' }} />;
      case 'installment':
        return <ArrowDownward sx={{ color: 'primary.main' }} />;
      case 'withdrawal':
        return <ArrowDownward sx={{ color: 'warning.main' }} />;
      default:
        return <Receipt />;
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch(method?.toLowerCase()) {
      case 'card': 
        return <CreditCard />;
      case 'bank_transfer': 
      case 'bank':
        return <AccountBalance />;
      case 'wallet':
        return <AccountBalanceWallet />;
      case 'bitcoin':
      case 'ethereum':
      case 'usdt':
        return <LocalAtm />;
      default: 
        return <Payment />;
    }
  };

  // Handle viewing transaction details
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDialogOpen(true);
  };

  // Export transactions to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Transaction History', 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Table
    const tableColumn = ["Date", "Description", "Type", "Amount", "Status"];
    const tableRows = filteredTransactions.map(tx => [
      formatDate(tx.createdAt),
      tx.description || tx.type || 'Transaction',
      tx.type || 'Unknown',
      `$${tx.amount?.toFixed(2) || '0.00'}`,
      tx.status || 'Pending'
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Save PDF
    doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success('Transactions exported to PDF');
  };

  // Print transactions
  const printTransactions = () => {
    const printContent = document.getElementById('transactions-table').outerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .success { color: green; }
            .warning { color: orange; }
            .error { color: red; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transaction History</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      totalDeposits: 0,
      totalInstallments: 0,
      totalWithdrawals: 0,
      completedCount: 0,
      pendingCount: 0,
      totalTransactions: filteredTransactions.length
    };

    filteredTransactions.forEach(tx => {
      if (tx.type === 'deposit') {
        stats.totalDeposits += tx.amount || 0;
      } else if (tx.type === 'installment') {
        stats.totalInstallments += tx.amount || 0;
      } else if (tx.type === 'withdrawal') {
        stats.totalWithdrawals += tx.amount || 0;
      }

      if (tx.status === 'completed' || tx.status === 'paid') {
        stats.completedCount++;
      } else if (tx.status === 'pending') {
        stats.pendingCount++;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading transactions...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<ArrowBack />}
              sx={{ mb: 1 }}
            >
              Back to Dashboard
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Transaction History
            </Typography>
            <Typography color="text.secondary">
              View and manage all your transactions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Download />}
              onClick={exportToPDF}
              variant="outlined"
              size="small"
            >
              Export PDF
            </Button>
            <Button
              startIcon={<Print />}
              onClick={printTransactions}
              variant="outlined"
              size="small"
            >
              Print
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<History />} 
              label={`All (${transactions.length})`} 
              iconPosition="start" 
            />
            <Tab 
              icon={<ArrowUpward />} 
              label={`Deposits (${transactions.filter(t => t.type === 'deposit').length})`} 
              iconPosition="start" 
            />
            <Tab 
              icon={<ArrowDownward />} 
              label={`Installments (${transactions.filter(t => t.type === 'installment').length})`} 
              iconPosition="start" 
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  bgcolor: 'primary.50', 
                  p: 1, 
                  borderRadius: 1, 
                  mr: 2 
                }}>
                  <AccountBalanceWallet sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Deposits
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ${stats.totalDeposits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  bgcolor: 'success.50', 
                  p: 1, 
                  borderRadius: 1, 
                  mr: 2 
                }}>
                  <TrendingUp sx={{ color: 'success.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Installments
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ${stats.totalInstallments.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  bgcolor: 'success.50', 
                  p: 1, 
                  borderRadius: 1, 
                  mr: 2 
                }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {stats.completedCount} transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  bgcolor: 'warning.50', 
                  p: 1, 
                  borderRadius: 1, 
                  mr: 2 
                }}>
                  <Warning sx={{ color: 'warning.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {stats.pendingCount} transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="deposit">Deposit</MenuItem>
                <MenuItem value="installment">Installment</MenuItem>
                <MenuItem value="withdrawal">Withdrawal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Date</InputLabel>
              <Select
                value={dateFilter}
                label="Date"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setDateFilter('all');
                setActiveTab(0);
              }}
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader id="transactions-table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Transaction</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Alert severity="info">
                      No transactions found. {searchTerm && 'Try changing your search criteria.'}
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow 
                    key={tx.id} 
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      opacity: tx.status === 'pending' ? 0.9 : 1,
                      bgcolor: tx.status === 'pending' ? 'warning.50' : 'transparent'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(tx.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {tx.description || tx.type || 'Transaction'}
                        </Typography>
                        {tx.propertyTitle && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Property: {tx.propertyTitle}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTransactionTypeIcon(tx.type)}
                        <Typography variant="body2">
                          {tx.type || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body1" 
                        fontWeight={700}
                        color={
                          tx.type === 'deposit' ? 'success.main' : 
                          tx.status === 'pending' ? 'warning.main' : 'primary.main'
                        }
                      >
                        ${(tx.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status || 'pending'}
                        size="small"
                        color={getStatusColor(tx.status)}
                        icon={tx.status === 'completed' ? <CheckCircle /> : <Warning />}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleViewTransaction(tx)}
                        sx={{ color: 'primary.main' }}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Transaction Details Dialog */}
      <Dialog 
        open={transactionDialogOpen} 
        onClose={() => setTransactionDialogOpen(false)}
        maxWidth="md"
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Transaction Information
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Transaction ID"
                            secondary={
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {selectedTransaction.id || 'N/A'}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Date & Time"
                            secondary={formatDate(selectedTransaction.createdAt)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Transaction Type"
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTransactionTypeIcon(selectedTransaction.type)}
                                <Typography variant="body2">
                                  {selectedTransaction.type || 'Unknown'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Status"
                            secondary={
                              <Chip
                                label={selectedTransaction.status || 'pending'}
                                size="small"
                                color={getStatusColor(selectedTransaction.status)}
                                sx={{ fontWeight: 500 }}
                              />
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
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Payment Details
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Amount"
                            secondary={
                              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                                ${(selectedTransaction.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {selectedTransaction.description && (
                          <ListItem>
                            <ListItemText 
                              primary="Description"
                              secondary={selectedTransaction.description}
                            />
                          </ListItem>
                        )}
                        {selectedTransaction.propertyTitle && (
                          <ListItem>
                            <ListItemText 
                              primary="Property"
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Home fontSize="small" />
                                  <Typography variant="body2">
                                    {selectedTransaction.propertyTitle}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        {selectedTransaction.contractId && (
                          <ListItem>
                            <ListItemText 
                              primary="Contract ID"
                              secondary={
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  #{selectedTransaction.contractId.substring(0, 8)}...
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}
                        {selectedTransaction.installmentId && (
                          <ListItem>
                            <ListItemText 
                              primary="Installment ID"
                              secondary={selectedTransaction.installmentId}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setTransactionDialogOpen(false)}
                variant="outlined"
              >
                Close
              </Button>
              <Button 
                variant="contained"
                startIcon={<Receipt />}
                onClick={() => {
                  // Generate receipt
                  const receiptWindow = window.open('', '_blank');
                  receiptWindow.document.write(`
                    <html>
                      <head>
                        <title>Receipt - Transaction ${selectedTransaction.id}</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 40px; }
                          .header { text-align: center; margin-bottom: 40px; }
                          .details { margin: 30px 0; }
                          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                          .total { font-size: 24px; font-weight: bold; margin-top: 30px; }
                          .footer { margin-top: 50px; text-align: center; color: #666; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>Transaction Receipt</h1>
                          <p>Date: ${new Date().toLocaleDateString()}</p>
                        </div>
                        <div class="details">
                          <div class="detail-row">
                            <span>Transaction ID:</span>
                            <span>${selectedTransaction.id}</span>
                          </div>
                          <div class="detail-row">
                            <span>Date:</span>
                            <span>${formatDate(selectedTransaction.createdAt)}</span>
                          </div>
                          <div class="detail-row">
                            <span>Type:</span>
                            <span>${selectedTransaction.type}</span>
                          </div>
                          <div class="detail-row">
                            <span>Description:</span>
                            <span>${selectedTransaction.description || 'N/A'}</span>
                          </div>
                          <div class="detail-row">
                            <span>Property:</span>
                            <span>${selectedTransaction.propertyTitle || 'N/A'}</span>
                          </div>
                          <div class="detail-row">
                            <span>Status:</span>
                            <span>${selectedTransaction.status}</span>
                          </div>
                        </div>
                        <div class="total">
                          Amount: $${(selectedTransaction.amount || 0).toFixed(2)}
                        </div>
                        <div class="footer">
                          <p>Thank you for your transaction!</p>
                          <p>Generated by Apex Living</p>
                        </div>
                      </body>
                    </html>
                  `);
                  receiptWindow.document.close();
                  receiptWindow.print();
                }}
              >
                Print Receipt
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Transactions;