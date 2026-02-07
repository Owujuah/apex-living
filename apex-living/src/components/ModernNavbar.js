import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  Notifications,
  AccountCircle,
  Dashboard,
  Logout,
  Home,
  Wallet,PersonRounded
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase';
import { toast } from 'react-hot-toast';

const ModernNavbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/');
      setAnchorEl(null);
    } else {
      toast.error('Logout failed');
    }
  };

  const menuItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard', requiresAuth: true },
    { label: 'Properties', icon: <Home />, path: '/properties' },
    { label: 'Deposit', icon: <Wallet />, path: '/deposit', requiresAuth: true },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">Apex Living</Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          (!item.requiresAuth || user) && (
            <ListItem 
              button 
              key={item.label}
              component={Link}
              to={item.path}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          )
        ))}
        {user ? (
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        ) : (
          <ListItem 
            button 
            component={Link}
            to="/auth"
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon><AccountCircle /></ListItemIcon>
            <ListItemText primary="Login / Signup" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <IconButton
                size="large"
                edge="start"
                color="black"
                aria-label="menu"
                sx={{ mr: 2, display: { sm: 'none' } }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              
              <Typography
                variant="h5"
                component={Link}
                to="/"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box component="span" sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 2,
                  fontSize: '0.9rem'
                }}>
                  APEX
                </Box>
                Living
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
              {menuItems.map((item) => (
                (!item.requiresAuth || user) && (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    sx={{ color: 'text.primary' }}
                  >
                    {item.label}
                  </Button>
                )
              ))}
            </Box>

            {/* User Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
              {user ? (
                <>
                  
                  <Button
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    startIcon={
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </Avatar>
                    }
                    sx={{ color: 'text.primary' }}
                  >
                    {/* {user.displayName || user.email} */}
                  </Button>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                  >
                    <MenuItem>
                    <PersonRounded sx={{ mr: 1 }} /> {user.displayName || user.email}
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/dashboard'); setAnchorEl(null); }}>
                      <Dashboard sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/deposit'); setAnchorEl(null); }}>
                      <Wallet sx={{ mr: 1 }} /> Deposit
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <Logout sx={{ mr: 1 }} /> Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    component={Link}
                    to="/auth"
                    variant="outlined"
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/auth?mode=signup"
                    variant="contained"
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default ModernNavbar;