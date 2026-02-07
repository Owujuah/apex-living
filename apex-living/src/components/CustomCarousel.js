import React, { useState } from 'react';
import { Box, IconButton, Paper, Fade } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const CustomCarousel = ({ images, height = 200, showNav = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Paper sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
        No Images
      </Paper>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box sx={{ position: 'relative', height, overflow: 'hidden', borderRadius: 1 }}>
      {/* Main Image */}
      <Fade in={true} key={currentIndex}>
        <Box
          component="img"
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Fade>

      {/* Navigation Arrows */}
      {showNav && images.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          {images.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: idx === currentIndex ? 'primary.main' : 'grey.400', cursor: 'pointer' }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CustomCarousel;