import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBack,
  Payment,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  CreditCard,
  AccountBalance,
  Receipt,
  Warning,
  Info,
  Close,
  History,
  AccountBalanceWallet,
  TrendingUp
} from '@mui/icons-material';
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../SharedFirebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';

const InstallmentPayment = () => {
  const { contractId } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [realTimeContract, setRealTimeContract] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchContractDetails();
        fetchWalletBalance();
      } else {
        toast.error('Please login to view installment details');
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time contract listener
  useEffect(() => {
    if (!contractId || !user?.uid) return;

    const contractRef = doc(db, 'contracts', contractId);
    const unsubscribe = onSnapshot(contractRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        // Verify user owns this contract
        if (data.buyerId !== user.uid) {
          toast.error('Unauthorized access');
          navigate('/dashboard');
          return;
        }
        
        // Process installments to handle date fields safely
        const processedInstallments = data.installments?.map(inst => {
          let dueDate = inst.dueDate;
          let paidAt = inst.paidAt;
          
          // Convert Firestore timestamps to strings if needed
          if (dueDate && dueDate.toDate) {
            dueDate = dueDate.toDate().toISOString().split('T')[0];
          }
          
          if (paidAt && paidAt.toDate) {
            paidAt = paidAt.toDate().toISOString().split('T')[0];
          }
          
          return {
            ...inst,
            dueDate,
            paidAt
          };
        }) || [];

        const contractData = {
          id: docSnapshot.id,
          ...data,
          installments: processedInstallments
        };
        
        setContract(contractData);
        setRealTimeContract(contractData);
      }
    }, (error) => {
      console.error('Error listening to contract:', error);
    });

    return () => unsubscribe();
  }, [contractId, user?.uid]);

  const fetchContractDetails = async () => {
    try {
      if (!contractId || !user?.uid) return;
      
      const contractRef = doc(db, 'contracts', contractId);
      const contractSnap = await getDoc(contractRef);
      
      if (contractSnap.exists()) {
        const data = contractSnap.data();
        // Verify user owns this contract
        if (data.buyerId !== user.uid) {
          toast.error('Unauthorized access');
          navigate('/dashboard');
          return;
        }
        
        // Process installments to handle date fields safely
        const processedInstallments = data.installments?.map(inst => {
          let dueDate = inst.dueDate;
          let paidAt = inst.paidAt;
          
          // Convert Firestore timestamps to strings if needed
          if (dueDate && dueDate.toDate) {
            dueDate = dueDate.toDate().toISOString().split('T')[0];
          }
          
          if (paidAt && paidAt.toDate) {
            paidAt = paidAt.toDate().toISOString().split('T')[0];
          }
          
          return {
            ...inst,
            dueDate,
            paidAt
          };
        }) || [];

        const contractData = {
          id: contractSnap.id,
          ...data,
          installments: processedInstallments
        };
        
        setContract(contractData);
      } else {
        toast.error('Contract not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error('Error loading contract details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      if (!user?.uid) return;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setWalletBalance(userSnap.data().totalDeposits || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleInstallmentSelect = (installment) => {
    setSelectedInstallment(installment);
    setPaymentDialogOpen(true);
  };

  // Format date for display - FIXED VERSION
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
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateInput, error);
      return 'N/A';
    }
  };

  // Check if date is overdue
  const isOverdue = (dueDate) => {
    try {
      if (!dueDate) return false;
      
      let date;
      if (typeof dueDate === 'string') {
        date = new Date(dueDate);
      } else if (dueDate.toDate) {
        date = dueDate.toDate();
      } else if (dueDate.seconds) {
        date = new Date(dueDate.seconds * 1000);
      } else {
        return false;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      return date < today;
    } catch (error) {
      return false;
    }
  };

  // Check if date is due today
  const isDueToday = (dueDate) => {
    try {
      if (!dueDate) return false;
      
      let date;
      if (typeof dueDate === 'string') {
        date = new Date(dueDate);
      } else if (dueDate.toDate) {
        date = dueDate.toDate();
      } else if (dueDate.seconds) {
        date = new Date(dueDate.seconds * 1000);
      } else {
        return false;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      return date.getTime() === today.getTime();
    } catch (error) {
      return false;
    }
  };

  const handlePayment = async () => {
    if (!selectedInstallment || !contract || !user) {
      toast.error('Missing payment information');
      return;
    }

    if (paymentMethod === 'wallet' && walletBalance < selectedInstallment.amount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setProcessingPayment(true);

    try {
      // Update installment status in contract
      const contractRef = doc(db, 'contracts', contractId);
      const updatedInstallments = contract.installments.map(inst =>
        inst.id === selectedInstallment.id ? { 
          ...inst, 
          status: 'paid', 
          paidAt: new Date().toISOString().split('T')[0] 
        } : inst
      );

      const newAmountPaid = (contract.amountPaid || 0) + selectedInstallment.amount;

      await updateDoc(contractRef, {
        installments: updatedInstallments,
        amountPaid: newAmountPaid,
        lastPaymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create transaction record
      const transactionData = {
        userId: user.uid,
        contractId: contractId,
        propertyId: contract.propertyId,
        propertyTitle: contract.propertyTitle,
        type: 'installment',
        amount: selectedInstallment.amount,
        status: 'completed',
        paymentMethod,
        installmentId: selectedInstallment.id,
        description: `Installment payment for ${contract.propertyTitle}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      // Update user's wallet balance if using wallet
      if (paymentMethod === 'wallet') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          totalDeposits: walletBalance - selectedInstallment.amount,
          updatedAt: serverTimestamp()
        });
      }

      toast.success('Payment successful!');
      setPaymentDialogOpen(false);
      setSelectedInstallment(null);
      
      // Refresh data
      fetchWalletBalance();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateProgress = () => {
    if (!contract || !contract.totalAmount) return 0;
    return Math.round(((contract.amountPaid || 0) / contract.totalAmount) * 100);
  };

  const getPendingInstallments = () => {
    if (!contract?.installments) return [];
    return contract.installments.filter(inst => inst.status === 'pending');
  };

  const getPaidInstallments = () => {
    if (!contract?.installments) return [];
    return contract.installments.filter(inst => inst.status === 'paid');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading contract details...
        </Typography>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Contract not found or you don't have access to it.
        </Alert>
        <Button component={Link} to="/dashboard" startIcon={<ArrowBack />}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const pendingInstallments = getPendingInstallments();
  const paidInstallments = getPaidInstallments();
  const progress = calculateProgress();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to="/dashboard"
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Installment Payment
        </Typography>
        <Typography color="text.secondary">
          Manage and pay for your property installments
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Contract Details */}
        <Grid item xs={12} md={8}>
          {/* Property Overview Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {contract.propertyTitle || 'Untitled Property'}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ${(contract.totalAmount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Amount Paid
                    </Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                      ${(contract.amountPaid || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                      ${((contract.totalAmount || 0) - (contract.amountPaid || 0)).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {progress}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ width: '100%', mb: 3 }}>
                <Box
                  sx={{
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      bgcolor: 'primary.main',
                      width: `${progress}%`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    ${(contract.amountPaid || 0).toLocaleString()} paid
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${((contract.totalAmount || 0) - (contract.amountPaid || 0)).toLocaleString()} remaining
                  </Typography>
                </Box>
              </Box>

              {/* Contract Summary */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Contract Created:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formatDate(contract.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Receipt sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Total Installments:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {contract.installments?.length || 0} installments
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Completed Installments:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {paidInstallments.length} paid
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Warning sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Pending Installments:
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {pendingInstallments.length} pending
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Installments Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Installment Schedule
              </Typography>
              
              {pendingInstallments.length === 0 ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                  All installments are paid! Congratulations on your investment.
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  You have {pendingInstallments.length} pending installments
                </Alert>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Installment</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contract.installments?.map((installment, index) => {
                      const overdue = isOverdue(installment.dueDate);
                      const dueToday = isDueToday(installment.dueDate);
                      
                      return (
                        <TableRow key={installment.id || index} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              Installment {index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(installment.dueDate)}
                            </Typography>
                            <Typography variant="caption" color={overdue ? 'error' : dueToday ? 'warning' : 'text.secondary'}>
                              {dueToday ? 'Due Today' : overdue ? 'Overdue' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              ${(installment.amount || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={installment.status || 'pending'}
                              size="small"
                              color={installment.status === 'paid' ? 'success' : overdue ? 'error' : 'warning'}
                              icon={installment.status === 'paid' ? <CheckCircle /> : <Warning />}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {installment.status === 'pending' && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Payment />}
                                onClick={() => handleInstallmentSelect(installment)}
                                disabled={processingPayment}
                                color={overdue ? 'error' : 'primary'}
                              >
                                Pay Now
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Payment Summary & Quick Actions */}
        <Grid item xs={12} md={4}>
          {/* Payment Summary Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Payment Summary
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Total Contract Value:</Typography>
                  <Typography fontWeight={600}>${(contract.totalAmount || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Amount Paid:</Typography>
                  <Typography color="success.main" fontWeight={600}>
                    ${(contract.amountPaid || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Remaining Balance:</Typography>
                  <Typography color="warning.main" fontWeight={600}>
                    ${((contract.totalAmount || 0) - (contract.amountPaid || 0)).toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Next Payment Due:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    {pendingInstallments[0] 
                      ? `$${(pendingInstallments[0].amount || 0).toLocaleString()}`
                      : 'None'}
                  </Typography>
                </Box>
                {pendingInstallments[0] && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Due: {formatDate(pendingInstallments[0].dueDate)}
                  </Typography>
                )}
              </Box>

              {/* Wallet Balance */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Your Deposit Balance
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ${walletBalance.toLocaleString()}
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    to="/deposit"
                    variant="outlined"
                    size="small"
                  >
                    Add Funds
                  </Button>
                </Box>
              </Paper>

              {/* Quick Pay Button */}
              {pendingInstallments[0] && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Payment />}
                  onClick={() => handleInstallmentSelect(pendingInstallments[0])}
                  sx={{ mb: 2 }}
                  color={isOverdue(pendingInstallments[0].dueDate) ? 'error' : 'primary'}
                >
                  Pay Next Installment
                </Button>
              )}

              {/* View All Payments */}
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to="/transactions"
                startIcon={<History />}
              >
                View Payment History
              </Button>
            </CardContent>
          </Card>

          {/* Payment Guidelines */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Payment Guidelines
              </Typography>
              <Stepper orientation="vertical" sx={{ mb: 2 }}>
                <Step active>
                  <StepLabel>Select Installment</StepLabel>
                </Step>
                <Step active>
                  <StepLabel>Choose Payment Method</StepLabel>
                </Step>
                <Step active>
                  <StepLabel>Confirm Payment</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Receive Confirmation</StepLabel>
                </Step>
              </Stepper>
              <Alert severity="info" icon={<Info />}>
                <Typography variant="caption">
                  • Payments are processed immediately<br/>
                  • Late payments may incur penalties<br/>
                  • Keep your wallet funded for automatic payments
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => !processingPayment && setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirm Payment
            </Typography>
            <IconButton 
              onClick={() => !processingPayment && setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInstallment && contract && (
            <Box>
              {/* Payment Details */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  PAYMENT DETAILS
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Property"
                      secondary={contract.propertyTitle || 'Untitled Property'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Installment Amount"
                      secondary={
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                          ${(selectedInstallment.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Due Date"
                      secondary={formatDate(selectedInstallment.dueDate)}
                    />
                  </ListItem>
                </List>
              </Paper>

              {/* Payment Method Selection */}
              <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                  Select Payment Method
                </FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="wallet"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalanceWallet sx={{ mr: 1 }} />
                        <Box>
                          <Typography>Deposit Balance</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Available: ${walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </Typography>
                          {paymentMethod === 'wallet' && walletBalance < selectedInstallment.amount && (
                            <Typography variant="caption" color="error" display="block">
                              Insufficient balance
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                    disabled={walletBalance < selectedInstallment.amount}
                  />
                  <FormControlLabel
                    value="card"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCard sx={{ mr: 1 }} />
                        <Typography>Credit/Debit Card</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="bank"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalance sx={{ mr: 1 }} />
                        <Typography>Bank Transfer</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Payment Summary */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  PAYMENT SUMMARY
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Installment Amount:</Typography>
                  <Typography>${(selectedInstallment.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Typography>
                </Box>
                {paymentMethod === 'card' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Processing Fee:</Typography>
                    <Typography>$2.50</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total Amount:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    ${paymentMethod === 'card' 
                      ? ((selectedInstallment.amount || 0) + 2.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : (selectedInstallment.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            disabled={processingPayment}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={processingPayment || (paymentMethod === 'wallet' && walletBalance < (selectedInstallment?.amount || 0))}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <Payment />}
          >
            {processingPayment ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InstallmentPayment;