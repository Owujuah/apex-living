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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  Speed,
  AttachMoney,
  ArrowBack,
  CheckCircle,
  CalendarMonth,
  FormatPaint,
  LocalGasStation,
  ChevronLeft, 
  ChevronRight, 
  BuildCircle,
  Warning,
  Info,
  Telegram,
  ContentCopy,
  Close,
} from '@mui/icons-material';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

// ========== BUILT-IN CAROUSEL COMPONENT ==========
const PropertyImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Box sx={{ 
        height: 200, 
        bgcolor: 'grey.100',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: 1
      }}>
        <Typography color="text.secondary">No Images</Typography>
      </Box>
    );
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  return (
    <Box sx={{ position: 'relative', height: 400, overflow: 'hidden', borderRadius: .5, mb: 3 }}>
      <img
        src={images[currentIndex]}
        alt={`Property ${currentIndex + 1}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        }}
      />
      
      {images.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            size="small"
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={handleNext}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <ChevronRight />
          </IconButton>
          
          <Box sx={{ 
            position: 'absolute', 
            bottom: 8, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 0.5 
          }}>
            {images.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: idx === currentIndex ? 'primary.main' : 'white',
                  opacity: idx === currentIndex ? 1 : 0.5,
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

const PropertyDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [reserveDialog, setReserveDialog] = useState(false);
  const [authDialog, setAuthDialog] = useState(false);
  
  // Telegram button states
  const [telegramDialog, setTelegramDialog] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState('');
  const [telegramTransactionId, setTelegramTransactionId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', id));
      if (propertyDoc.exists()) {
        setProperty({ id: propertyDoc.id, ...propertyDoc.data() });
      } else {
        // Check if it's a vehicle
        const vehicleDoc = await getDoc(doc(db, 'vehicles', id));
        if (vehicleDoc.exists()) {
          setProperty({ id: vehicleDoc.id, ...vehicleDoc.data() });
        } else {
          toast.error('Listing not found');
          navigate('/properties');
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Error loading listing details');
    } finally {
      setLoading(false);
    }
  };

  // Telegram Functions
  const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    const prefix = property?.model ? 'VHL' : 'PRP';
    const id = `${prefix}-${timestamp}-${random}`;
    setTelegramTransactionId(id);
    return id;
  };

  const previewTelegramMessage = () => {
    if (!user) {
      toast.error('Please login to contact via Telegram');
      return;
    }

    const transactionId = generateTransactionId();
    
    const userName = user?.displayName || user?.email || 'Customer';
    const isVehicle = property?.model || property?.brand;
    const itemType = isVehicle ? 'vehicle' : 'property';
    const itemDetails = isVehicle 
      ? `${property.brand} ${property.model} (${property.year})`
      : property.title;
    
    const price = property.price ? `$${property.price.toLocaleString()}` : 'Price negotiable';
    const location = property.location || 'Location not specified';
    const status = property.status || 'Available';
    
    const message = `Hello Apex Living!

I'm interested in purchasing a ${itemType}.

📋 **ITEM DETAILS:**
• Type: ${isVehicle ? 'Vehicle' : 'Property'}
• ${isVehicle ? 'Vehicle' : 'Property'}: ${itemDetails}
• Price: ${price}
• Location: ${location}
• Status: ${status}

👤 **MY INFORMATION:**
• Name: ${userName}
• Email: ${user?.email || 'Not provided'}

🆔 **TRANSACTION REFERENCE:**
• Transaction ID: ${transactionId}
• Date: ${new Date().toLocaleDateString()}

Please contact me to proceed with the purchase. Thank you!`;

    setTelegramMessage(message);
    setTelegramDialog(true);
  };

  const sendTelegramMessage = async () => {
    try {
      // Store transaction in Firebase
      const txRef = doc(db, 'telegram_inquiries', telegramTransactionId);
      const txData = {
        transactionId: telegramTransactionId,
        userId: user.uid,
        propertyId: property.id,
        propertyType: property?.model ? 'vehicle' : 'property',
        propertyTitle: property?.model ? `${property.brand} ${property.model}` : property.title,
        userEmail: user.email,
        userName: user.displayName || user.email,
        status: 'inquiry_sent',
        amount: property.price,
        message: telegramMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(txRef, txData);
      
      // Encode and open Telegram
      const encodedMessage = encodeURIComponent(telegramMessage);
      const telegramUrl = `https://t.me/Apexliving?text=${encodedMessage}`;
      
      window.open(telegramUrl, '_blank', 'noopener,noreferrer');
      setTelegramDialog(false);
      
      toast.success('Inquiry saved! Opening Telegram...');
    } catch (error) {
      console.error('Error saving inquiry:', error);
      toast.error('Failed to save inquiry');
    }
  };

  const handleReserveClick = () => {
    console.log('User object:', user);
    console.log('User logged in?', !!user);
    
    if (!user) {
      console.log('User not logged in, showing auth dialog');
      setAuthDialog(true);
      return;
    }

    if (property.status === 'sold') {
      toast.error('This listing is already sold');
      return;
    }

    if (property.status === 'reserved' && property.reservedBy !== user.uid) {
      toast.error('This listing is already reserved by another user');
      return;
    }

    setReserveDialog(true);
  };

  const handleConfirmReserve = async () => {
    setReserving(true);
    try {
      // Update property status to reserved
      const propertyRef = doc(db, 'properties', property.id);
      await setDoc(propertyRef, {
        ...property,
        status: 'reserved',
        reservedBy: user.uid,
        reservedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Create a contract or reservation record
      const contractRef = doc(db, 'contracts', `${user.uid}_${property.id}`);
      await setDoc(contractRef, {
        userId: user.uid,
        propertyId: property.id,
        propertyTitle: property.title || `${property.brand} ${property.model}`,
        propertyType: property.model ? 'vehicle' : 'property',
        totalAmount: property.price,
        amountPaid: 0,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Listing reserved successfully!');
      setReserveDialog(false);
      
      navigate('/deposit', { 
        state: { 
          propertyId: property.id,
          propertyTitle: property.title || `${property.brand} ${property.model}`,
          propertyPrice: property.price
        }
      });
    } catch (error) {
      console.error('Error reserving property:', error);
      toast.error('Failed to reserve listing. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const handleLoginRedirect = () => {
    setAuthDialog(false);
    navigate('/auth', { 
      state: { 
        returnTo: `/properties/${id}`,
        message: 'Please login to reserve this listing'
      }
    });
  };

  const handleSignupRedirect = () => {
    setAuthDialog(false);
    navigate('/auth', { 
      state: { 
        returnTo: `/properties/${id}`,
        message: 'Create an account to reserve this listing'
      }
    });
  };

  const handleDepositRedirect = () => {
    navigate('/deposit', { 
      state: { 
        propertyId: property.id,
        propertyTitle: property.title || `${property.brand} ${property.model}`,
        propertyPrice: property.price
      }
    });
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!property) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Listing not found
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back to Listings
        </Button>
      </Container>
    );
  }

  const isVehicle = property.model || property.brand;
  const isSold = property.status === 'sold';
  const isReserved = property.status === 'reserved';
  const isUserReserved = isReserved && property.reservedBy === user?.uid;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 3 }}
      >
        Back to Listings
      </Button>

      {/* Authentication Required Dialog */}
      <Dialog open={authDialog} onClose={() => setAuthDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Authentication Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            You need to be logged in to reserve this listing. Please login or create an account to continue.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialog(false)}>Cancel</Button>
          <Button onClick={handleLoginRedirect} variant="outlined">
            Login
          </Button>
          <Button onClick={handleSignupRedirect} variant="contained">
            Sign Up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reserve Confirmation Dialog */}
      <Dialog open={reserveDialog} onClose={() => !reserving && setReserveDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Info color="info" />
            Confirm Reservation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to reserve this listing?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isVehicle ? (
              <>
                You are about to reserve <strong>{property.brand} {property.model}</strong> 
                for <strong>${property.price?.toLocaleString()}</strong>.
              </>
            ) : (
              <>
                You are about to reserve <strong>{property.title}</strong> 
                for <strong>${property.price?.toLocaleString()}</strong>.
              </>
            )}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            After reservation, you'll be redirected to make a deposit payment.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReserveDialog(false)} 
            disabled={reserving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmReserve} 
            variant="contained"
            disabled={reserving}
          >
            {reserving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirm Reservation'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Telegram Dialog */}
      <Dialog open={telegramDialog} onClose={() => setTelegramDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Telegram color="primary" />
              <Typography variant="h6">Contact via Telegram</Typography>
            </Box>
            <IconButton onClick={() => setTelegramDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Click "Open Telegram" to open the Apex Living Telegram channel with a pre-filled message..
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Transaction ID
            </Typography>
            <TextField
              fullWidth
              value={telegramTransactionId || 'Not generated'}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: telegramTransactionId && (
                  <Tooltip title="Copy Transaction ID">
                    <IconButton size="small" onClick={() => {
                      navigator.clipboard.writeText(telegramTransactionId);
                      toast.success('Transaction ID copied!');
                    }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />
          </Box>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Message Preview:
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={12}
            value={telegramMessage}
            onChange={(e) => setTelegramMessage(e.target.value)}
            variant="outlined"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setTelegramDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Telegram />}
            onClick={sendTelegramMessage}
            sx={{
              background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #006699 0%, #004466 100%)',
              }
            }}
          >
            Open Telegram
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Column - Property Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <PropertyImageCarousel images={property.images || (property.imageUrl ? [property.imageUrl] : [])} />
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {isVehicle ? `${property.brand} ${property.model}` : property.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip 
                label={property.status} 
                color={
                  property.status === 'available' ? 'success' :
                  property.status === 'reserved' ? 'warning' :
                  property.status === 'sold' ? 'error' : 'default'
                } 
                sx={{ textTransform: 'uppercase' }} 
              />
              <Typography color="text.secondary" textTransform={'capitalize'}>
                <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                {property.location}
              </Typography>
            </Box>

            {/* Vehicle or Property Details */}
            {isVehicle ? (
              <Box>
                <Box sx={{ display: 'flex', gap: 4, mb: 3, textTransform: 'capitalize' }}>
                  {property.mileage && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Speed sx={{ mr: 1 }} />
                      <Typography>{property.mileage} km</Typography>
                    </Box>
                  )}
                  {property.year && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarMonth sx={{ mr: 1 }} />
                      <Typography>{property.year}</Typography>
                    </Box>
                  )}
                  {property.color && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormatPaint sx={{ mr: 1 }} />
                      <Typography>{property.color}</Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 4, mb: 2, textTransform: 'capitalize' }}>
                  {property.fuelType && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocalGasStation sx={{ mr: 1 }} />
                      <Typography>{property.fuelType}</Typography>
                    </Box>
                  )}
                  {property.condition && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormatPaint sx={{ mr: 1 }} />
                      <Typography>{property.condition}</Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'block', gap: 4, mb: 3, textTransform: 'capitalize' }}>
                  {property.engineCapacity && (
                    <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                      <SquareFoot sx={{ mr: 1 }} />
                      <Typography>Engine Capacity: {property.engineCapacity} cc</Typography>
                    </Box>
                  )}
                  {property.transmission && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BuildCircle sx={{ mr: 1 }} />
                      <Typography>Transmission: {property.transmission}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 5, mb: 3 }}>
                {property.bedrooms && (
                  <Box sx={{ display: 'block', alignItems: 'center', textAlign: 'center' }}>
                    <Bed sx={{ mr: 0.5 }} />
                    <Typography>{property.bedrooms} Bedrooms</Typography>
                  </Box>
                )}
                {property.bathrooms && (
                  <Box sx={{ display: 'block', alignItems: 'center', textAlign: 'center' }}>
                    <Bathtub sx={{ mr: .5 }} />
                    <Typography>{property.bathrooms} Bathrooms</Typography>
                  </Box>
                )}
                {property.area && (
                  <Box sx={{ display: 'block', alignItems: 'center', textAlign: 'center' }}>
                    <SquareFoot sx={{ mr: .5 }} />
                    <Typography>{property.area} sqft</Typography>
                  </Box>
                )}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography sx={{ wordBreak: 'break-word' }}>
              {property.description || 'No description available.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - Reservation & Pricing */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoney />
              {property.price?.toLocaleString()}
            </Typography>

            {/* Status Alerts */}
            {isSold ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                This listing has been sold.
              </Alert>
            ) : isReserved && !isUserReserved ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This listing is currently reserved by another user.
              </Alert>
            ) : isUserReserved ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                You have reserved this listing. Complete your payment to secure it.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Pay in installments with crypto.
              </Alert>
            )}

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

            {/* Action Buttons */}
            {isUserReserved ? (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDepositRedirect}
                sx={{ mt: 2 }}
              >
                Complete Payment
              </Button>
            ) : isSold ? (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                disabled
                sx={{ mt: 2 }}
              >
                Sold Out
              </Button>
            ) : isReserved ? (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                disabled
                sx={{ mt: 2 }}
              >
                Already Reserved
              </Button>
            ) : user ? (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleReserveClick}
                sx={{ mt: 2 }}
              >
                Reserve Now
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleReserveClick}
                sx={{ mt: 2 }}
              >
                Login to Reserve
              </Button>
            )}

            {/* Telegram Button */}
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<Telegram />}
              onClick={previewTelegramMessage}
              sx={{
                mt: 2,
                py: 1.5,
                borderColor: '#0088cc',
                color: '#0088cc',
                '&:hover': {
                  backgroundColor: 'rgba(0, 136, 204, 0.04)',
                  borderColor: '#006699',
                }
              }}
            >
              Contact via Telegram
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PropertyDetails;