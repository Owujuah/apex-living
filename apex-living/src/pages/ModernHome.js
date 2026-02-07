import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Chip,
  alpha,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  Shield,
  Wallet,
  Home,
  LocationOn,
  ArrowRight,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';

const ModernHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      const q = query(collection(db, 'properties'), limit(4));
      const snapshot = await getDocs(q);
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeaturedProperties(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const FeatureCard = ({ icon: Icon, title, description, color }) => (
    <Card sx={{ height: '100%', border: 'none' }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 3,
            bgcolor: alpha(color, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Icon sx={{ fontSize: 32, color }} />
        </Box>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        <Typography color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            background: 'radial-gradient(circle at right, rgba(255,255,255,0.1) 0%, transparent 70%)',
          }}
        />
        
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Find Your Dream Property with Crypto
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Buy houses and lands using USDT. Flexible installment plans. Start with 10% today.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => navigate('/properties')}
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  Browse Properties
                </Button>
                <Button
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  variant="outlined"
                  size="large"
                  sx={{ borderColor: 'white', color: 'white' }}
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Find Your Perfect Property
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search location, property type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                      sx: { bgcolor: 'white' }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{ px: 4 }}
                  >
                    Search
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {['Lagos', 'Abuja', 'Port Harcourt', 'Dubai'].map((city) => (
                    <Chip
                      key={city}
                      label={city}
                      onClick={() => setSearchQuery(city)}
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" textAlign="center" gutterBottom>
          Why Choose Apex Living?
        </Typography>
        <Typography color="text.secondary" textAlign="center" sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
          We're revolutionizing real estate with blockchain technology
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={Wallet}
              title="Crypto Payments"
              description="Pay with USDT, BTC, or ETH. Fast, secure, and borderless transactions."
              color="#0066FF"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={TrendingUp}
              title="Installment Plans"
              description="Buy properties in bits. Flexible payment schedules tailored for you."
              color="#00D4AA"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={Shield}
              title="Secure & Transparent"
              description="All transactions recorded on blockchain. Complete transparency."
              color="#8B5CF6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FeatureCard
              icon={Home}
              title="Global Properties"
              description="Access premium properties worldwide. From Lagos to Dubai."
              color="#F59E0B"
            />
          </Grid>
        </Grid>
      </Container>

      {/* Featured Properties */}
      {/* <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <div>
              <Typography variant="h2" gutterBottom>
                Featured Properties
              </Typography>
              <Typography color="text.secondary">
                Handpicked properties with crypto payment options
              </Typography>
            </div>
            <Button
              endIcon={<ArrowRight />}
              onClick={() => navigate('/properties')}
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={4}>
            {featuredProperties.map((property) => (
              <Grid item xs={12} sm={6} md={3} key={property.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      transition: 'transform 0.3s ease',
                    }
                  }}
                  onClick={() => navigate(`/properties/${property.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={property.images?.[0] || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop'}
                    alt={property.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" noWrap>
                        {property.title}
                      </Typography>
                      <Chip
                        label={property.status}
                        size="small"
                        color={property.status === 'available' ? 'success' : 'warning'}
                      />
                    </Box>
                    
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                      {property.location?.address || property.location}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h5" color="primary" fontWeight={700}>
                        ${property.price?.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star fontSize="small" sx={{ color: '#F59E0B', mr: 0.5 }} />
                        <Typography variant="body2">4.8</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box> */}

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h2" gutterBottom>
            Ready to Own Your Dream Property?
          </Typography>
          <Typography sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
            Join thousands of investors who are building wealth with crypto real estate
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            sx={{
              bgcolor: 'white',
              color: '#1E293B',
              px: 6,
              py: 1.5,
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            {user ? 'Make a Deposit' : 'Get Started Free'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ModernHome;