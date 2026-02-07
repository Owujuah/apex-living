import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import PropertyCard from '../components/PropertyCard';
import VehicleCard from '../components/VehicleCard';
import { getAllProperties, getAllVehicles } from '../SharedFirebase';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [propertiesData, vehiclesData] = await Promise.all([
        getAllProperties(),
        getAllVehicles()
      ]);
      
      // Filter out any undefined/null items
      const validProperties = propertiesData.filter(item => item && typeof item === 'object');
      const validVehicles = vehiclesData.filter(item => item && typeof item === 'object');
      
      setProperties(validProperties);
      setVehicles(validVehicles);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  // Get filtered listings
  const filteredListings = [...properties, ...vehicles].filter(item => {
    if (!item) return false;
    
    // Check if it's a vehicle or property
    const isVehicle = item.brand || item.model || item.vehicleType;
    
    if (isVehicle) {
      const brand = item.brand || '';
      const model = item.model || '';
      const location = item.location || '';
      
      return brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
             model.toLowerCase().includes(searchTerm.toLowerCase()) ||
             location.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const title = item.title || '';
      const location = item.location?.address || item.location || '';
      const description = item.description || '';
      
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             location.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading listings...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Main Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
        Browse Properties & Vehicles
      </Typography>
      <Typography color="text.secondary" paragraph sx={{ textAlign: 'center' }}>
        Find your dream property or vehicle from our curated list
      </Typography>

      {/* Search and Filter */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search properties & vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="house">House</MenuItem>
                <MenuItem value="apartment">Apartment</MenuItem>
                <MenuItem value="land">Land</MenuItem>
                <MenuItem value="commercial">Commercial</MenuItem>
                <MenuItem value="car">Car</MenuItem>
                <MenuItem value="truck">Truck</MenuItem>
                <MenuItem value="motorcycle">Motorcycle</MenuItem>
                <MenuItem value="suv">SUV</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="reserved">Reserved</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
        {filteredListings.length} {filteredListings.length === 1 ? 'Listing' : 'Listings'} Available
      </Typography>

      {/* Single Column Layout - One card per column, centered */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 3,
        width: '100%'
      }}>
        {filteredListings.map((item, index) => (
          <Box 
            key={item.id || `item-${index}`} 
            sx={{ 
              width: '100%',
              maxWidth: '800px',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
           
            <PropertyCard 
              item={item} 
              listingType={item.brand ? 'vehicle' : 'property'} 
            />
          </Box>
        ))}
      </Box>

      {/* No results message */}
      {filteredListings.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No listings found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          >
            Clear all filters
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Properties;