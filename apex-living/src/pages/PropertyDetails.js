import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  AttachMoney,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

const PropertyDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', id));
      if (propertyDoc.exists()) {
        setProperty({ id: propertyDoc.id, ...propertyDoc.data() });
      } else {
        toast.error('Property not found');
        navigate('/properties');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Error loading property details');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    if (!user) {
      toast.error('Please login to reserve a property');
      navigate('/login');
      return;
    }
    toast.success('Property reserved! Proceed to dashboard for payment.');
    // TODO: Implement reservation logic
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Back
      </Button>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {property.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip label={property.status} color="primary" />
              <Typography color="text.secondary">
                <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {property.location}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
              {property.bedrooms && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Bed sx={{ mr: 1 }} />
                  <Typography>{property.bedrooms} Bedrooms</Typography>
                </Box>
              )}
              {property.bathrooms && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Bathtub sx={{ mr: 1 }} />
                  <Typography>{property.bathrooms} Bathrooms</Typography>
                </Box>
              )}
              {property.area && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SquareFoot sx={{ mr: 1 }} />
                  <Typography>{property.area} sqft</Typography>
                </Box>
              )}
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography paragraph>
              {property.description || 'No description available.'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoney />
              {property.price?.toLocaleString()}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Pay in installments with crypto. Start with 10% deposit.
            </Alert>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary="Crypto payments accepted" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary="Flexible installment plans" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary="Secure transaction" />
              </ListItem>
            </List>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleReserve}
              disabled={property.status !== 'available'}
              sx={{ mt: 2 }}
            >
              {property.status === 'available' ? 'Reserve Property' : 'Not Available'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PropertyDetails;