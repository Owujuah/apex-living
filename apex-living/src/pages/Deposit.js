import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccountBalanceWallet,
  ContentCopy,
  CheckCircle,
  Payment,
  CalendarToday,
  AttachMoney,
  ArrowBack,
  Info,
  Receipt,
  TrendingUp,
  Warning,
  CreditCard,
  AccountBalance,
  AccountCircle
} from '@mui/icons-material';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  addDoc, 
  setDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

const Deposit = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get property details from navigation state
  const { propertyId, propertyTitle, propertyPrice } = location.state || {};
  
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [installmentPlan, setInstallmentPlan] = useState('5');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  // Your USDT wallet address (ERC-20)
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e6FFFFFFFFF';

  useEffect(() => {
    if (propertyId && propertyPrice) {
      setAmount(propertyPrice.toString());
      calculateInstallments(propertyPrice, parseInt(installmentPlan));
      fetchPropertyDetails();
    }
    fetchUserBalance();
  }, [propertyId, propertyPrice, installmentPlan]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;
    
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (propertyDoc.exists()) {
        setPropertyDetails({ id: propertyDoc.id, ...propertyDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  };

  const fetchUserBalance = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setUserBalance(userDoc.data().totalDeposits || 0);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const calculateInstallments = (totalAmount, months) => {
    if (!totalAmount || !months) return null;
    
    const installmentAmount = totalAmount / months;
    const installments = [];
    const currentDate = new Date();
    
    for (let i = 0; i < months; i++) {
      const dueDate = new Date(currentDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      
      installments.push({
        id: `inst-${Date.now()}-${i}`,
        number: i + 1,
        amount: parseFloat(installmentAmount.toFixed(2)),
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending'
      });
    }
    
    setInstallmentDetails({
      totalAmount,
      months,
      installmentAmount: parseFloat(installmentAmount.toFixed(2)),
      installments
    });
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Update user's total deposits
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalDeposits: (userBalance || 0) + parseFloat(amount),
        updatedAt: serverTimestamp()
      });

      // Record transaction
      const transactionData = {
        userId: user.uid,
        amount: parseFloat(amount),
        type: 'deposit',
        status: 'completed',
        method: 'crypto',
        cryptoHash: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress: walletAddress,
        timestamp: serverTimestamp(),
        notes: 'USDT deposit to wallet',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      toast.success(`Deposit of $${parseFloat(amount).toLocaleString()} successful!`);
      setAmount('');
      
      // Refresh user balance
      fetchUserBalance();
      
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast.error('Error processing deposit');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyPayment = async () => {
    if (!propertyDetails || !amount || !user) {
      toast.error('Missing payment information');
      return;
    }

    if (paymentMethod === 'wallet' && userBalance < parseFloat(amount)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setProcessingPayment(true);
    setConfirmDialog(false);

    try {
      // Create contract document
      const contractData = {
        userId: user.uid,
        propertyId: propertyDetails.id,
        propertyTitle: propertyDetails.title || `${propertyDetails.brand} ${propertyDetails.model}`,
        propertyType: propertyDetails.model ? 'vehicle' : 'property',
        totalAmount: parseFloat(amount),
        amountPaid: activeTab === 0 ? parseFloat(amount) : 0, // Full payment or first installment
        status: 'active',
        paymentType: activeTab === 0 ? 'full' : 'installment',
        installmentPlan: activeTab === 1 ? installmentPlan : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add installments if paying in installments
      if (activeTab === 1 && installmentDetails) {
        contractData.installments = installmentDetails.installments;
        
        // Mark first installment as paid if paying from wallet
        if (paymentMethod === 'wallet' && installmentDetails.installments[0]) {
          contractData.installments[0].status = 'paid';
          contractData.installments[0].paidAt = new Date().toISOString().split('T')[0];
          contractData.amountPaid = installmentDetails.installmentAmount;
        }
      }

      const contractRef = doc(collection(db, 'contracts'));
      await setDoc(contractRef, contractData);

      // Record transaction
      const transactionType = activeTab === 0 ? 'full_payment' : 'installment_payment';
      const transactionData = {
        userId: user.uid,
        contractId: contractRef.id,
        propertyId: propertyDetails.id,
        propertyTitle: contractData.propertyTitle,
        type: transactionType,
        amount: activeTab === 0 ? parseFloat(amount) : (paymentMethod === 'wallet' ? installmentDetails.installmentAmount : 0),
        status: 'completed',
        paymentMethod,
        description: activeTab === 0 
          ? `Full payment for ${contractData.propertyTitle}`
          : `First installment for ${contractData.propertyTitle}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'transactions'), transactionData);

      // Update user's wallet balance if using wallet
      if (paymentMethod === 'wallet') {
        const paymentAmount = activeTab === 0 
          ? parseFloat(amount) 
          : installmentDetails.installmentAmount;
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          totalDeposits: userBalance - paymentAmount,
          updatedAt: serverTimestamp()
        });
      }

      // Update property status
      const propertyRef = doc(db, 'properties', propertyDetails.id);
      await updateDoc(propertyRef, {
        status: 'reserved',
        reservedBy: user.uid,
        reservedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success(
        activeTab === 0 
          ? 'Property purchased successfully!' 
          : 'Installment plan created successfully!'
      );

      // Navigate to dashboard or installment management
      if (activeTab === 1) {
        navigate(`/installments/${contractRef.id}`);
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (propertyPrice) {
      setAmount(propertyPrice.toString());
      calculateInstallments(propertyPrice, parseInt(installmentPlan));
    }
  };

  const handleConfirmPayment = () => {
    if (propertyDetails) {
      setConfirmDialog(true);
    } else {
      handleDeposit();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      {propertyDetails && (
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)} 
          sx={{ mb: 3 }}
        >
          Back to Property
        </Button>
      )}

      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        {propertyDetails ? 'Complete Payment' : 'Make a Deposit'}
      </Typography>
      <Typography color="text.secondary" paragraph>
        {propertyDetails 
          ? `Complete payment for ${propertyDetails.title || propertyTitle}`
          : 'Add funds to your account using USDT (ERC-20)'
        }
      </Typography>

      {/* Payment Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Payment color="primary" />
            Confirm Payment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to proceed with this payment?
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Receipt />
              </ListItemIcon>
              <ListItemText 
                primary="Property"
                secondary={propertyTitle}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AttachMoney />
              </ListItemIcon>
              <ListItemText 
                primary="Amount"
                secondary={`$${parseFloat(amount).toLocaleString()}`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText 
                primary="Payment Method"
                secondary={paymentMethod === 'wallet' ? 'Wallet Balance' : 'Direct Crypto'}
              />
            </ListItem>
            {activeTab === 1 && (
              <ListItem>
                <ListItemIcon>
                  <CalendarToday />
                </ListItemIcon>
                <ListItemText 
                  primary="Installment Plan"
                  secondary={`${installmentPlan} months`}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePropertyPayment} 
            variant="contained"
            disabled={processingPayment}
          >
            {processingPayment ? <CircularProgress size={24} /> : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4 }}>
            {/* Property Details Card */}
            {propertyDetails && (
              <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Property Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {propertyTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {propertyId}
                    </Typography>
                  </Box>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                    ${propertyPrice?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Payment Type Tabs (only for property payment) */}
            {propertyDetails && (
              <Box sx={{ mb: 4 }}>
                <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
                  <Tab 
                    label="Full Payment" 
                    icon={<AttachMoney />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Installment Plan" 
                    icon={<TrendingUp />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
            )}

            {/* Payment Form */}
            <Box>
              {/* Amount Field */}
              <Typography variant="h6" gutterBottom>
                {propertyDetails 
                  ? activeTab === 0 ? 'Payment Amount' : 'Installment Details'
                  : 'Deposit Amount (USD)'
                }
              </Typography>
              
              {propertyDetails && activeTab === 1 ? (
                <Box>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <FormLabel>Installment Plan</FormLabel>
                    <RadioGroup
                      value={installmentPlan}
                      onChange={(e) => {
                        setInstallmentPlan(e.target.value);
                        calculateInstallments(propertyPrice, parseInt(e.target.value));
                      }}
                      row
                    >
                      {['3', '6', '9', '12'].map((months) => (
                        <FormControlLabel 
                          key={months}
                          value={months}
                          control={<Radio />}
                          label={`${months} months`}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>

                  {installmentDetails && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        INSTALLMENT SCHEDULE
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Installment</TableCell>
                              <TableCell>Due Date</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {installmentDetails.installments.map((inst) => (
                              <TableRow key={inst.id}>
                                <TableCell>#{inst.number}</TableCell>
                                <TableCell>{formatDate(inst.dueDate)}</TableCell>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 600 }}>
                                    ${inst.amount.toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={inst.status}
                                    size="small"
                                    color={inst.status === 'paid' ? 'success' : 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Monthly Payment
                            </Typography>
                            <Typography variant="h6" color="primary">
                              ${installmentDetails.installmentAmount.toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Total Amount
                            </Typography>
                            <Typography variant="h6">
                              ${installmentDetails.totalAmount.toLocaleString()}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAmount(value);
                    if (propertyDetails && activeTab === 1) {
                      calculateInstallments(parseFloat(value), parseInt(installmentPlan));
                    }
                  }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    readOnly: !!propertyDetails
                  }}
                  sx={{ mb: 3 }}
                  helperText={propertyDetails ? "Property price is fixed" : "Minimum deposit: $10.00"}
                />
              )}

              {/* Payment Method Selection */}
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend">Payment Method</FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  row
                >
                  <FormControlLabel 
                    value="wallet" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalanceWallet sx={{ mr: 1 }} />
                        <Box>
                          <Typography>Wallet Balance</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Available: ${userBalance.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    disabled={userBalance < (activeTab === 0 ? parseFloat(amount) : (installmentDetails?.installmentAmount || 0))}
                  />
                  <FormControlLabel 
                    value="crypto" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCard sx={{ mr: 1 }} />
                        <Typography>Direct Crypto Payment</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Crypto Address (only for direct crypto payment) */}
              {paymentMethod === 'crypto' && (
                <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 1, mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    SEND USDT TO THIS ADDRESS:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        bgcolor: 'background.paper',
                        p: 1,
                        borderRadius: 1,
                        flex: 1,
                        mr: 2,
                        wordBreak: 'break-all',
                      }}
                    >
                      {walletAddress}
                    </Typography>
                    <Button
                      onClick={handleCopyAddress}
                      startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                      variant="outlined"
                      color={copied ? 'success' : 'primary'}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Send only USDT (ERC-20) to this address. Sending other tokens may result in permanent loss.
                  </Typography>
                </Box>
              )}

              {/* Balance Alert */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography fontWeight={600}>
                  Current Wallet Balance: ${userBalance.toLocaleString()}
                </Typography>
                {paymentMethod === 'wallet' && propertyDetails && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {activeTab === 0 
                      ? `Full payment: $${parseFloat(amount).toLocaleString()}`
                      : `First installment: $${installmentDetails?.installmentAmount.toLocaleString()}`
                    }
                  </Typography>
                )}
              </Alert>

              {/* Payment/Deposit Button */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleConfirmPayment}
                disabled={
                  loading || 
                  processingPayment || 
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  (paymentMethod === 'wallet' && propertyDetails && 
                   userBalance < (activeTab === 0 
                     ? parseFloat(amount) 
                     : (installmentDetails?.installmentAmount || 0)
                   ))
                }
                startIcon={<Payment />}
              >
                {processingPayment || loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : propertyDetails ? (
                  activeTab === 0 
                    ? `Pay $${parseFloat(amount).toLocaleString()}`
                    : `Start Installment Plan - First Payment: $${installmentDetails?.installmentAmount.toLocaleString()}`
                ) : (
                  `Deposit $${amount || '0'}`
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* User Balance Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AccountBalanceWallet sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Wallet
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                ${userBalance.toLocaleString()}
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setActiveTab(propertyDetails ? 1 : 0);
                  setPaymentMethod('crypto');
                }}
              >
                Add Funds
              </Button>
            </CardContent>
          </Card>

          {/* Payment Steps */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {propertyDetails ? 'Payment Steps' : 'Deposit Steps'}
              </Typography>
              <Stepper orientation="vertical" sx={{ mt: 2 }}>
                <Step active>
                  <StepLabel>
                    <Typography variant="body2">Enter Amount</Typography>
                  </StepLabel>
                </Step>
                <Step active>
                  <StepLabel>
                    <Typography variant="body2">Choose Payment Method</Typography>
                  </StepLabel>
                </Step>
                <Step active>
                  <StepLabel>
                    <Typography variant="body2">Confirm Transaction</Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel>
                    <Typography variant="body2">Receive Confirmation</Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 {propertyDetails ? 'Payment Tips' : 'Deposit Tips'}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  {propertyDetails 
                    ? 'Review the installment schedule carefully'
                    : 'Minimum deposit is $10.00'
                  }
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  {propertyDetails 
                    ? 'Ensure sufficient wallet balance for payments'
                    : 'Use the copy button for wallet address'
                  }
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  {propertyDetails 
                    ? 'Late payments may incur penalties'
                    : 'Send only USDT (ERC-20) tokens'
                  }
                </Typography>
                <Typography component="li" variant="body2">
                  {propertyDetails 
                    ? 'You can pay additional installments anytime'
                    : 'Funds appear within minutes of confirmation'
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Deposit;