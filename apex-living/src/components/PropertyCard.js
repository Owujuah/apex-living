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
  Skeleton,
} from '@mui/material';
import {
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  AttachMoney,
  Category,
  DirectionsCar,
  LocalGasStation,
  Speed,
  CalendarToday,
  ColorLens,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const PropertyCard = ({ item, listingType }) => {
  // Check if item is defined
  if (!item) {
    return (
      <Card sx={{ 
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        <Skeleton 
          variant="rectangular" 
          sx={{ 
            width: { xs: '100%', md: '40%' },
            height: { xs: 200, md: 'auto' }
          }} 
        />
        <CardContent sx={{ flexGrow: 1, width: { xs: '100%', md: '60%' } }}>
          <Skeleton variant="text" height={40} width="80%" sx={{ mb: 2 }} />
          <Skeleton variant="text" height={20} width="60%" sx={{ mb: 2 }} />
          <Skeleton variant="text" height={20} width="40%" sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton variant="text" height={30} width="40%" />
            <Skeleton variant="rectangular" height={36} width={120} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Determine if it's a vehicle or property
  const isVehicle = listingType === 'vehicle' || item.brand || item.model;
  const isProperty = listingType === 'property' || item.title || item.propertyType;

  // Safely extract values with defaults
  const {
    id = '',
    title = '',
    brand = '',
    model = '',
    images = [],
    imageUrl = '',
    status = 'available',
    location = {},
    price = 0,
  } = item;

  const address = location?.address || location || 'Location not specified';
  const imageSrc = images?.[0] || imageUrl || 'https://via.placeholder.com/400x300';
  
  // Determine title to display
  const displayTitle = isVehicle 
    ? `${brand || ''} ${model || ''}`.trim() 
    : title || 'Untitled Property';
  
  // Determine detail link
  const detailLink = `/properties/${id}`;

  return (
    <Card sx={{ 
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }
    }}>
      {/* Image Section */}
      <Box sx={{ 
        width: { xs: '100%', md: '40%' },
        minHeight: { xs: 250, md: 'auto' }
      }}>
        <CardMedia
          component="img"
          image={imageSrc}
          alt={displayTitle}
          sx={{ 
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            minHeight: { xs: 250, md: 250 }
          }}
        />
      </Box>

      {/* Content Section */}
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: { xs: '100%', md: '60%' },
        p: 3
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textTransform: 'capitalize',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            flex: 1,
            mr: 1
          }}>
            {isVehicle? item.make+' '+ item.model: displayTitle}
          </Typography>
          <Stack direction="column" spacing={1.0}>
            {/* Type tag - either Property or Vehicle */}
            <Chip
              label={isVehicle ? "Vehicle" : "Property"}
              color={isVehicle ? "info" : "primary"}
              size="medium"
              sx={{ fontWeight: 600 }}
            />
            
            {/* Status chip */}
            <Chip
              label={status}
              color={
                status === 'available' ? 'success' :
                status === 'reserved' ? 'warning' : 'default'
              }
              size="medium"
            />
          </Stack>
        </Stack>

        {/* Location */}
        <Typography color="text.secondary" variant="body1" gutterBottom sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          textTransform: 'capitalize',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          mb: 0
        }}>
          <LocationOn fontSize="medium" sx={{ verticalAlign: 'middle', mr: 1 }} />
          {address}
        </Typography>

        {/* Property or Vehicle details */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 3, 
          my: 3,
          textTransform: 'capitalize',
          '& > div': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flex: '1 1 calc(33.333% - 16px)',
            minHeight: 40
          }
        }}>
          {isProperty && item.bedrooms > 0 && (
            <Box>
              <Bed fontSize="medium" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {item.bedrooms} {item.bedrooms === 1 ? 'bed' : 'beds'}
              </Typography>
            </Box>
          )}
          {isProperty && item.bathrooms > 0 && (
            <Box>
              <Bathtub fontSize="medium" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {item.bathrooms} {item.bathrooms === 1 ? 'bath' : 'baths'}
              </Typography>
            </Box>
          )}
          {isProperty && item.area > 0 && (
            <Box>
              <SquareFoot fontSize="medium" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {item.area.toLocaleString()} sqft
              </Typography>
            </Box>
          )}
          
          {isVehicle && item.year && (
            <Box>
              <CalendarToday fontSize="medium" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {item.year}
              </Typography>
            </Box>
          )}
          {isVehicle && item.mileage && (
            <Box>
              <Speed fontSize="medium" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {item.mileage.toLocaleString()} km
              </Typography>
            </Box>
          )}
          {isVehicle && item.fuelType && (
            <Box>
              <LocalGasStation fontSize="medium" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {item.fuelType}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price and View Details */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 'auto',
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            <AttachMoney fontSize="medium" sx={{ verticalAlign: 'text-bottom' }} />
            {price.toLocaleString()}
          </Typography>
          <Button
            component={Link}
            to={detailLink}
            variant="contained"
            size="large"
            disabled={!id}
            sx={{ px: 3 }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;