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
  DirectionsCar,
  LocalGasStation,
  Speed,
  AttachMoney,
  CalendarToday,
  ColorLens,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const VehicleCard = ({ vehicle }) => {
  // Check if vehicle is defined
  if (!vehicle) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Skeleton variant="rectangular" height={200} />
        <CardContent sx={{ flexGrow: 1 }}>
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

  // Safely extract values with defaults
  const {
    brand = '',
    model = '',
    year = 2024,
    price = 0,
    mileage = 0,
    fuelType = 'petrol',
    transmission = 'manual',
    vehicleType = 'car',
    status = 'available',
    color = '',
    location = '',
    imageUrl = '',
    id = '',
  } = vehicle;

  const vehicleName = `${brand} ${model}`.trim() || 'Unnamed Vehicle';
  const imageSrc = imageUrl || 'https://via.placeholder.com/400x300';

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }
    }}>
      <CardMedia
        component="img"
        height="200"
        image={imageSrc}
        alt={vehicleName}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h3" gutterBottom sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {vehicleName}
          </Typography>
          <Chip
            label={status}
            color={
              status === 'available' ? 'success' :
              status === 'reserved' ? 'warning' : 'default'
            }
            size="small"
          />
        </Stack>

        <Typography color="text.secondary" variant="body2" gutterBottom sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical'
        }}>
          <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {location || 'Location not specified'}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
          {year && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{year}</Typography>
            </Box>
          )}
          {mileage && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Speed fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{mileage.toLocaleString()} km</Typography>
            </Box>
          )}
          {fuelType && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalGasStation fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{fuelType}</Typography>
            </Box>
          )}
          {transmission && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DirectionsCar fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{transmission}</Typography>
            </Box>
          )}
          {color && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ColorLens fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{color}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            <AttachMoney fontSize="small" sx={{ verticalAlign: 'text-bottom' }} />
            {price.toLocaleString()}
          </Typography>
          <Button
            component={Link}
            to={`/vehicles/${id}`}
            variant="contained"
            size="small"
            disabled={!id}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleCard;