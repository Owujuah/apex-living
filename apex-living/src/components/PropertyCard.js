import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  AttachMoney,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={property.images?.[0] || 'https://via.placeholder.com/400x300'}
        alt={property.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" gutterBottom>
            {property.title}
          </Typography>
          <Chip
            label={property.status}
            color={
              property.status === 'available' ? 'success' :
              property.status === 'reserved' ? 'warning' : 'default'
            }
            size="small"
          />
        </Stack>

        <Typography color="text.secondary" variant="body2" gutterBottom>
          <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {property.location?.address}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
          {property.bedrooms && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Bed fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{property.bedrooms} beds</Typography>
            </Box>
          )}
          {property.bathrooms && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Bathtub fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{property.bathrooms} baths</Typography>
            </Box>
          )}
          {property.area && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SquareFoot fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{property.area} sqft</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            <AttachMoney fontSize="small" sx={{ verticalAlign: 'text-bottom' }} />
            {property.price?.toLocaleString()}
          </Typography>
          <Button
            component={Link}
            to={`/properties/${property.id}`}
            variant="contained"
            size="small"
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;