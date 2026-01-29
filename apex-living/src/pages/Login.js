import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Google,
  Facebook,
} from '@mui/icons-material';
import { registerUser, loginUser, resetPassword } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth(); // Make sure setUser is exposed in your AuthContext
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'buyer',
  });

  useEffect(() => {
    // Check URL for mode
    const params = new URLSearchParams(location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'signup') {
      setMode('signup');
    }
    
    // Clear any previous errors
    setLoginError('');
  }, [location]);

  const handleTabChange = (event, newValue) => {
    setMode(newValue);
    setResetSent(false);
    setLoginError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    console.log('Attempting login with:', loginData.email);
    
    try {
      const result = await loginUser(loginData.email, loginData.password);
      
      if (result.success) {
        console.log('Login successful, user:', result.user?.email);
        toast.success('Welcome back!');
        
        // Force a state update and redirect
        setTimeout(() => {
          // Check if user exists in localStorage
          const storedUser = localStorage.getItem('apex_user');
          console.log('LocalStorage user after login:', storedUser);
          
          if (storedUser) {
            navigate('/dashboard', { replace: true });
            // Force a page refresh to ensure auth state is updated
            window.location.href = '/dashboard';
          } else {
            setLoginError('Login successful but user data not saved. Please try again.');
          }
        }, 500);
      } else {
        console.log('Login failed:', result.error);
        setLoginError(result.error || 'Invalid email or password');
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const result = await registerUser(
        signupData.email,
        signupData.password,
        {
          fullName: signupData.fullName,
          phone: signupData.phone,
          role: signupData.role,
        }
      );

      if (result.success) {
        console.log('Signup successful');
        toast.success('Account created successfully!');
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
          window.location.href = '/dashboard';
        }, 500);
      } else {
        console.log('Signup failed:', result.error);
        setLoginError(result.error);
        toast.error(result.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setLoginError('An unexpected error occurred');
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component code (social login, password reset, etc.)

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0px 20px 60px rgba(0, 102, 255, 0.1)',
        }}
      >
        {/* Logo and title */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Apex Living
          </Typography>
          <Typography color="text.secondary">
            {mode === 'login' ? 'Welcome back!' : 'Join our community'}
          </Typography>
        </Box>

        {/* Show login error if any */}
        {loginError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loginError}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={mode} onChange={handleTabChange} centered>
            <Tab label="Login" value="login" />
            <Tab label="Sign Up" value="signup" />
          </Tabs>
        </Box>

        {/* Login Form */}
        {mode === 'login' && (
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              margin="normal"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setShowPassword(!showPassword)} 
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* ... rest of your login form (forgot password, etc.) */}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 4, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <Box component="form" onSubmit={handleSignup}>
            {/* ... your signup form fields */}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 4, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </Box>
        )}

        {/* ... rest of your component */}
      </Paper>
    </Container>
  );
};

export default AuthPage;