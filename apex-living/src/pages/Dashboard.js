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
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Home,
  Payment,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

const Dashboard = ({ user }) => {
  const [contracts, setContracts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    activeContracts: 0,
    totalInvested: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // In your Dashboard component, update the fetchUserData function:

const fetchUserData = async () => {
    try {
      // Fetch contracts using modular syntax
      const contractsQuery = query(
        collection(db, 'contracts'), 
        where('buyerId', '==', user.uid)
      );
      const contractsSnapshot = await getDocs(contractsQuery);
      const contractsData = contractsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContracts(contractsData);
  
      // Fetch transactions
      const transactionsQuery = query(
        collection(db, 'transactions'), 
        where('userId', '==', user.uid)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsData.slice(0, 10));
  
      // Calculate stats
      const totalDeposits = user.totalDeposits || 0;
      const activeContracts = contractsData.filter(c => c.status === 'active').length;
      const totalInvested = contractsData.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
      const pendingPayments = contractsData.reduce((sum, c) => {
        const pending = c.installments?.filter(i => i.status === 'pending').length || 0;
        return sum + pending;
      }, 0);
  
      setStats({
        totalDeposits,
        activeContracts,
        totalInvested,
        pendingPayments,
      });
    } catch (error) {
      toast.error('Error fetching dashboard data');
      console.error('Error:', error);
    }
  };
//
  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ bgcolor: `${color}.50`, p: 1, borderRadius: 1, mr: 2 }}>
            <Icon sx={{ color: `${color}.main` }} />
          </Box>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              ${value.toLocaleString()}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" paragraph>
        Welcome back, {user?.displayName || user?.email}!
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AccountBalanceWallet}
            title="Total Deposits"
            value={stats.totalDeposits}
            color="primary"
            subtitle="Available for payments"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Home}
            title="Active Contracts"
            value={stats.activeContracts}
            color="success"
            subtitle="Properties you're buying"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUp}
            title="Total Invested"
            value={stats.totalInvested}
            color="warning"
            subtitle="Amount paid so far"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/deposit"
            variant="contained"
            startIcon={<ArrowUpward />}
          >
            Make Deposit
          </Button>
          <Button
            component={Link}
            to="/properties"
            variant="outlined"
            startIcon={<Home />}
          >
            Browse Properties
          </Button>
          <Button
            variant="outlined"
            startIcon={<Payment />}
            onClick={() => toast.success('Coming soon!')}
          >
            Pay Installment
          </Button>
        </Box>
      </Paper>

      {/* Active Contracts */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Contracts
            </Typography>
            {contracts.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {contracts.map((contract) => (
                  <Box key={contract.id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {contract.propertyTitle}
                      </Typography>
                      <Chip
                        label={contract.status}
                        size="small"
                        color={contract.status === 'active' ? 'success' : 'warning'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total: ${contract.totalAmount?.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body2">
                        Progress: {((contract.amountPaid / contract.totalAmount) * 100).toFixed(1)}%
                      </Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(contract.amountPaid / contract.totalAmount) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="body2">
                        Paid: ${contract.amountPaid?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        Remaining: ${(contract.totalAmount - contract.amountPaid)?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No active contracts</Typography>
                <Button component={Link} to="/properties" sx={{ mt: 2 }}>
                  Browse Properties
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {tx.timestamp?.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {tx.type === 'deposit' ? (
                            <ArrowUpward sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                          ) : (
                            <ArrowDownward sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                          )}
                          ${tx.amount?.toLocaleString()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type}
                          size="small"
                          color={tx.type === 'deposit' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {transactions.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={2}>
                No transactions yet
              </Typography>
            )}
            <Button
              fullWidth
              component={Link}
              to="/deposit"
              sx={{ mt: 2 }}
              variant="outlined"
            >
              View All Transactions
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;