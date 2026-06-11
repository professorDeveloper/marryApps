import { useRef, useState, useEffect } from 'react';

import { Box } from '@mui/material';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { styled, useTheme } from '@mui/material/styles';

import {Logo} from 'src/components/logo/logo';

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
  transition: isLogo ? 'none' : 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  opacity: isVisible ? 1 : 0,
  transform: isVisible
    ? 'scale(1) rotate(0deg)'
    : (isLogo ? 'scale(0) rotate(-180deg)' : 'scale(0) rotate(180deg)'),
  zIndex: isVisible ? 2 : 1,
}));

export const AnimatedToggleButton = ({ onToggle }: { onToggle: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const theme = useTheme();
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
  }, []);

  const handleClick = () => {
    setIsAnimating(true);

    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

    // Play the logo animation once per click
    showTimeoutRef.current = setTimeout(() => {
      setShowLogo(true);
    }, 200);

    onToggle();

    // Reset after the full 12s animation cycle
    resetTimeoutRef.current = setTimeout(() => {
      setShowLogo(false);
      setIsAnimating(false);
    }, 12000);
  };

  return (
    <AnimatedButtonContainer onClick={handleClick}>
      {/* Normal Icon - Widgets */}
      <IconWrapper isVisible={!showLogo} isLogo={false}>
        <WidgetsIcon
          sx={{
            color: theme.palette.primary.main,
            fontSize: 24,
          }}
        />
      </IconWrapper>

      {/* Logo - shown during the click animation */}
      {showLogo && (
        <Box
          sx={{
            position: 'absolute',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <Logo size={40} forceRestart={showLogo} showLabel={false}/>
        </Box>
      )}

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
