import React, { useState } from 'react';
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
} from '@mui/material';
import { AccountBalanceWallet, ContentCopy, CheckCircle } from '@mui/icons-material';
import { doc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

const Deposit = ({ user }) => {
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Your USDT wallet address (ERC-20)
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e6FFFFFFFFF';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulateDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Update user's total deposits
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalDeposits: (user.totalDeposits || 0) + parseFloat(amount)
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: parseFloat(amount),
        type: 'deposit',
        status: 'completed',
        method: 'crypto',
        cryptoHash: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress: walletAddress,
        timestamp: new Date(),
        notes: 'Simulated USDT deposit'
      });

      toast.success(`Deposit of $${amount} simulated successfully!`);
      setAmount('');
      
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error processing deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Make a Deposit
      </Typography>
      <Typography color="text.secondary" paragraph>
        Add funds to your account using USDT (ERC-20)
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Deposit Amount (USD)
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              sx={{ mb: 3 }}
              helperText="Minimum deposit: $10.00"
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography fontWeight={600}>Current Balance: ${user?.totalDeposits?.toLocaleString() || '0.00'}</Typography>
            </Alert>

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

            <Divider sx={{ my: 3 }} />

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> This is a simulation. In a production environment, you would:
                1. Generate a unique deposit address for each transaction
                2. Listen for blockchain confirmations via webhook
                3. Automatically credit the account upon confirmation
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSimulateDeposit}
              disabled={loading || !amount}
              startIcon={<AccountBalanceWallet />}
            >
              {loading ? 'Processing...' : `Simulate Deposit of $${amount || '0'}`}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 How to Deposit
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Enter the amount you want to deposit
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Copy the USDT wallet address above
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Send the exact amount from your crypto wallet
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Click "Confirm Deposit" after sending
                </Typography>
                <Typography component="li" variant="body2">
                  Funds will appear in your dashboard within minutes
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Quick Deposit Amounts
              </Typography>
              <Grid container spacing={1}>
                {[100, 500, 1000, 5000].map((quickAmount) => (
                  <Grid item xs={6} key={quickAmount}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setAmount(quickAmount.toString())}
                      sx={{ py: 1.5 }}
                    >
                      ${quickAmount}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Deposit; 