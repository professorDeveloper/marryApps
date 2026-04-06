import { useRef, useState, useEffect } from 'react';

import { Box } from '@mui/material';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { styled, useTheme } from '@mui/material/styles';

import { Logo } from 'src/components/logo';

const AnimatedButtonContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'transparent',
  border: `2px solid ${theme.palette.primary.main}30`,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    border: `2px solid ${theme.palette.primary.main}60`,
    background: `${theme.palette.primary.main}10`,
  },
  '&:active': {
    transform: 'scale(0.95) rotate(-5deg)',
  },
}));

interface IconWrapperProps {
  isVisible: boolean;
  isLogo: boolean;
}

const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isVisible' && prop !== 'isLogo',
})<IconWrapperProps>(({ isVisible, isLogo }) => ({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  opacity: isVisible ? 1 : 0,
  transform: isVisible 
    ? (isLogo ? 'scale(1) rotate(0deg)' : 'scale(1) rotate(0deg)')
    : (isLogo ? 'scale(0) rotate(-180deg)' : 'scale(0) rotate(180deg)'),
  zIndex: isVisible ? 2 : 1,
}));

export const AnimatedToggleButton = ({ onToggle }: { onToggle: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const theme = useTheme();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto animation every 30 seconds
  useEffect(() => {
    const startAutoAnimation = () => {
      intervalRef.current = setInterval(() => {
        if (!isAnimating) {
          // Show logo
          setShowLogo(true);
          
          // Hide logo after 3 seconds
          timeoutRef.current = setTimeout(() => {
            setShowLogo(false);
          }, 3000);
        }
      }, 30000); // 30 seconds
    };

    startAutoAnimation();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAnimating]);

  const handleClick = () => {
    setIsAnimating(true);
    
    // Clear any existing auto-animation timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Start logo animation
    setTimeout(() => {
      setShowLogo(true);
    }, 200);
    
    // Call the toggle function
    onToggle();
    
    // Reset animations
    setTimeout(() => {
      setShowLogo(false);
      setIsAnimating(false);
      
      // Restart auto-animation after manual interaction
      intervalRef.current = setInterval(() => {
        if (!isAnimating) {
          setShowLogo(true);
          timeoutRef.current = setTimeout(() => {
            setShowLogo(false);
          }, 3000);
        }
      }, 30000);
    }, 1500);
  };

  return (
    <AnimatedButtonContainer onClick={handleClick}>
      {/* Animated background glow effect */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)`,
          animation: 'glow 2s ease-in-out infinite alternate',
          '@keyframes glow': {
            '0%': {
              transform: 'scale(0.8)',
              opacity: 0.3,
            },
            '100%': {
              transform: 'scale(1.2)',
              opacity: 0.7,
            },
          },
        }}
      />
      
      {/* Normal Icon - Widgets with continuous movement */}
      <IconWrapper isVisible={!showLogo} isLogo={false}>
        <Box
          sx={{
            animation: 'iconFloat 3s ease-in-out infinite',
            '@keyframes iconFloat': {
              '0%, 100%': {
                transform: 'translateY(0px) rotate(0deg)',
              },
              '25%': {
                transform: 'translateY(-2px) rotate(5deg)',
              },
              '50%': {
                transform: 'translateY(0px) rotate(0deg)',
              },
              '75%': {
                transform: 'translateY(2px) rotate(-5deg)',
              },
            },
          }}
        >
          <WidgetsIcon 
            sx={{ 
              color: theme.palette.primary.main,
              fontSize: 24,
              filter: `drop-shadow(0 0 8px ${theme.palette.primary.main}40)`,
              animation: 'lightPulse 2s ease-in-out infinite',
              '@keyframes lightPulse': {
                '0%, 100%': {
                  opacity: 0.7,
                  filter: `drop-shadow(0 0 8px ${theme.palette.primary.main}40)`,
                },
                '50%': {
                  opacity: 1,
                  filter: `drop-shadow(0 0 16px ${theme.palette.primary.main}60)`,
                },
              },
            }} 
          />
        </Box>
      </IconWrapper>
      
      {/* Logo - Regular version during animation */}
      <IconWrapper isVisible={showLogo} isLogo>
        <Box
          sx={{
            transform: 'scale(0.8)',
            filter: `drop-shadow(0 0 12px ${theme.palette.primary.main}50)`,
            animation: 'logoAppear 1.5s ease-out, logoFloat 2s ease-in-out 1.5s infinite',
            '@keyframes logoAppear': {
              '0%': {
                transform: 'scale(0) rotate(-180deg)',
                opacity: 0,
              },
              '50%': {
                transform: 'scale(1.2) rotate(90deg)',
                opacity: 0.8,
              },
              '100%': {
                transform: 'scale(0.8) rotate(0deg)',
                opacity: 1,
              },
            },
            '@keyframes logoFloat': {
              '0%, 100%': {
                transform: 'scale(0.8) translateY(0px)',
                filter: `drop-shadow(0 0 12px ${theme.palette.primary.main}50)`,
              },
              '25%': {
                transform: 'scale(0.85) translateY(-1px)',
                filter: `drop-shadow(0 0 16px ${theme.palette.primary.main}70)`,
              },
              '50%': {
                transform: 'scale(0.8) translateY(0px)',
                filter: `drop-shadow(0 0 12px ${theme.palette.primary.main}50)`,
              },
              '75%': {
                transform: 'scale(0.85) translateY(1px)',
                filter: `drop-shadow(0 0 16px ${theme.palette.primary.main}70)`,
              },
            },
          }}
        >
          <Logo isNavMini />
        </Box>
      </IconWrapper>
      
      {/* Pulse effect during animation */}
      {isAnimating && (
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${theme.palette.primary.main}50`,
            animation: 'pulse 1s ease-out',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '100%': {
                transform: 'scale(1.5)',
                opacity: 0,
              },
            },
          }}
        />
      )}
    </AnimatedButtonContainer>
  );
};