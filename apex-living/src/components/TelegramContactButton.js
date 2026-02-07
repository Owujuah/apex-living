// src/components/TelegramContactButton.js
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Telegram,
  ContentCopy,
  CheckCircle,
  Close,
  Info,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const TelegramContactButton = ({ 
  user, 
  property, 
  isVehicle,
  transactionId,
  onGenerateTransactionId 
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate default message with transaction ID
  const generateMessage = () => {
    const userName = user?.displayName || user?.email || 'Customer';
    const itemType = isVehicle ? 'vehicle' : 'property';
    const itemDetails = isVehicle 
      ? `${property.brand} ${property.model} (${property.year})`
      : property.title;
    
    const price = property.price ? `$${property.price.toLocaleString()}` : 'Price negotiable';
    const location = property.location || 'Location not specified';
    
    const generatedMessage = `Hello Apex Living!

I'm interested in purchasing a ${itemType}.

📋 **Item Details:**
- Type: ${isVehicle ? 'Vehicle' : 'Property'}
- ${isVehicle ? 'Vehicle' : 'Property'}: ${itemDetails}
- Price: ${price}
- Location: ${location}
- Status: ${property.status || 'Available'}

👤 **My Information:**
- Name: ${userName}
- Email: ${user?.email || 'Not provided'}

🆔 **Transaction Reference:**
- Transaction ID: ${transactionId || 'Not generated yet'}

Please contact me to proceed with the purchase.`;

    return generatedMessage;
  };

  const handleOpen = () => {
    if (!user) {
      toast.error('Please login to contact via Telegram');
      return;
    }
    
    if (!transactionId && onGenerateTransactionId) {
      const newTransactionId = onGenerateTransactionId();
      if (newTransactionId) {
        setMessage(generateMessage());
        setOpen(true);
      }
    } else {
      setMessage(generateMessage());
      setOpen(true);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Message copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTelegramClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/Apexliving?text=${encodedMessage}`;
    
    window.open(telegramUrl, '_blank');
    setOpen(false);
  };

  const handleGenerateTransactionId = () => {
    if (onGenerateTransactionId) {
      const newTransactionId = onGenerateTransactionId();
      if (newTransactionId) {
        setMessage(generateMessage());
        toast.success('New Transaction ID generated!');
      }
    }
  };

  return (
    <>
      {/* Telegram Button - You can place this in your PropertyDetails component */}
      <Button
        fullWidth
        variant="contained"
        color="primary"
        startIcon={<Telegram />}
        onClick={handleOpen}
        sx={{
          mt: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #006699 0%, #004466 100%)',
          }
        }}
      >
        Contact via Telegram
      </Button>

      {/* Message Preview Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Telegram color="primary" />
              <Typography variant="h6">Contact via Telegram</Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Clicking "Open Telegram" will open the Apex Living Telegram channel with a pre-filled message.
              You can review and edit the message before sending.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Transaction ID
              </Typography>
              <Tooltip title="Generate new Transaction ID">
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={handleGenerateTransactionId}
                  disabled={loading}
                >
                  {transactionId ? 'Regenerate' : 'Generate'} ID
                </Button>
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              value={transactionId || 'Not generated'}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: transactionId && (
                  <Tooltip title="Copy Transaction ID">
                    <IconButton size="small" onClick={() => {
                      navigator.clipboard.writeText(transactionId);
                      toast.success('Transaction ID copied!');
                    }}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Message Preview (You can edit before sending):
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={12}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }
            }}
          />

          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={copied ? <CheckCircle /> : <ContentCopy />}
              onClick={handleCopyMessage}
              color={copied ? 'success' : 'primary'}
            >
              {copied ? 'Copied!' : 'Copy Message'}
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Telegram />}
            onClick={handleTelegramClick}
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
    </>
  );
};

export default TelegramContactButton;