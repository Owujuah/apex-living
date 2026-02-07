import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const SellerPortal = ({ user }) => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const q = query(collection(db, 'properties'), where('sellerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const propertiesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propertiesList);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Seller Portal
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Property
        </Button>
      </Box>
      <Typography color="text.secondary" paragraph>
        Manage your property listings
      </Typography>
      <Grid container spacing={3}>
        {properties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {property.title}
                </Typography>
                <Chip label={property.status} size="small" sx={{ mb: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  {property.location}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  ${property.price}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Edit />}>
                  Edit
                </Button>
                <Button size="small" startIcon={<Delete />} color="error">
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {properties.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                You haven't listed any properties yet.
              </Typography>
              <Button sx={{ mt: 2 }} variant="contained" startIcon={<Add />}>
                Add Your First Property
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default SellerPortal;