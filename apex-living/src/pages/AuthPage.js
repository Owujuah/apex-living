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
  const { user } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
      return;
    }

    // Check URL for mode
    const params = new URLSearchParams(location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'signup') {
      setMode('signup');
    }
  }, [user, location, navigate]);

  const handleTabChange = (event, newValue) => {
    setMode(newValue);
    setResetSent(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const result = await loginUser(loginData.email, loginData.password);
    
    if (result.success) {
      toast.success('Welcome back!');
      
      // Wait a moment for auth state to update
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } else {
      toast.error(result.error || 'Login failed');
    }
    
    setLoading(false);
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
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!loginData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    const result = await resetPassword(loginData.email);
    
    if (result.success) {
      setResetSent(true);
      toast.success('Password reset email sent!');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    toast.success(`${provider} login coming soon!`);
  };

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
        {/* Logo */}
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {resetSent ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                Check your email for password reset instructions
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button size="small" onClick={handlePasswordReset} disabled={loading}>
                  Forgot Password?
                </Button>
              </Box>
            )}

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
            <TextField
              fullWidth
              label="Full Name"
              value={signupData.fullName}
              onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              required
              margin="normal"
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
              label="Phone Number"
              value={signupData.phone}
              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
              }}
            />

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

        {/* Social Login */}
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Or continue with
            </Typography>
          </Divider>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <IconButton
              onClick={() => handleSocialLogin('Google')}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Google />
            </IconButton>
            
            <IconButton
              onClick={() => handleSocialLogin('Facebook')}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Facebook />
            </IconButton>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <Link
              component="button"
              variant="body2"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              sx={{ fontWeight: 600 }}
            >
              {mode === 'login' ? 'Sign up' : 'Login'}
            </Link>
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AuthPage;