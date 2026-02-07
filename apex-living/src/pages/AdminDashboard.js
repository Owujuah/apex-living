import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Admin Dashboard
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage users, properties, and platform settings
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
          <Typography variant="h6">Total Users</Typography>
          <Typography variant="h4">0</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
          <Typography variant="h6">Total Properties</Typography>
          <Typography variant="h4">0</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
          <Typography variant="h6">Total Transactions</Typography>
          <Typography variant="h4">0</Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard;