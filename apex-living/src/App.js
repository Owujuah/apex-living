import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './Theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layout Components
import ModernNavbar from './components/ModernNavbar';
import Footer from './components/Footer';

// Page Components
import ModernHome from './pages/ModernHome';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import Deposit from './pages/Deposit';
import AdminDashboard from './pages/AdminDashboard';
import SellerPortal from './pages/SellerPortal';
import InstallmentPayment from './pages/InstallmentPayment';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="modern-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="app">
            <ModernNavbar />
            <main>
              <Routes>
                <Route path="/" element={<ModernHome />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetailsWrapper />} />
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/installments/:contractId" element={
                  <ProtectedRoute>
                    <InstallmentPayment />
                  </ProtectedRoute>
                } />
                <Route path="/deposit" element={
                  <ProtectedRoute>
                    <Deposit />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/seller" element={
                  <ProtectedRoute role="seller">
                    <SellerPortal />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '10px',
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Wrapper component to pass user to PropertyDetails
function PropertyDetailsWrapper() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="modern-spinner"></div>
      </div>
    );
  }
  
  return <PropertyDetails user={user} />;
}

export default App;