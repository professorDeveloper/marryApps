"use client";

import { m } from 'framer-motion';
import React, { useState, useEffect } from "react";
import { Box, useTheme, alpha } from "@mui/material";

export const NeuralGrid = () => {
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.2 }}>
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 1)} 1px, transparent 1px), linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 1)} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)'
      }} />
      <Box sx={{ position: 'absolute', inset: 0 }}>
        {mounted && [...Array(20)].map((_, i) => (
          <m.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              backgroundColor: theme.palette.primary.main,
              borderRadius: '50%',
              boxShadow: `0 0 8px ${theme.palette.primary.main}`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export const RestaurantLogicPattern = () => {
  const theme = useTheme();
  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.1 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ 
            flex: 1, 
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, 
            position: 'relative', 
            overflow: 'hidden',
            '&:last-child': { borderBottom: 0 }
          }}>
            <m.svg 
              style={{ width: '200%', height: '100%', position: 'absolute', left: 0, top: 0 }} 
              preserveAspectRatio="none"
              animate={{ x: i % 2 === 0 ? [0, '-50%'] : ['-50%', 0] }}
              transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
            >
              <path
                d={`M 0 50 Q 250 ${20 + (i * 10)} 500 50 T 1000 50 T 1500 50 T 2000 50`}
                fill="none"
                stroke={theme.palette.primary.main}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </m.svg>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const DarkTechPattern = ({ bright = false }: { bright?: boolean }) => {
  const theme = useTheme();
  return (
    <Box sx={{ 
      position: 'absolute', 
      inset: 0, 
      overflow: 'hidden', 
      pointerEvents: 'none', 
      transition: 'opacity 1s',
      opacity: bright ? 1 : 0.6
    }}>
       <svg style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>
            <m.path
              d={`M -200 ${150 + i * 200} Q 400 ${50 + i * 100} 1000 ${250 + i * 150} T 2200 ${150 + i * 200}`}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth={bright ? "24" : "12"}
              strokeLinecap="round"
              style={{ filter: `blur(${bright ? '40px' : '20px'})` }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0.3, 0.6, 0.3],
                pathOffset: [0, 1],
                opacity: bright ? [0.2, 0.5, 0.2] : [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 12 + i * 4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <m.path
              d={`M -200 ${150 + i * 200} Q 400 ${50 + i * 100} 1000 ${250 + i * 150} T 2200 ${150 + i * 200}`}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth={bright ? "5" : "3"}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: [0.1, 0.3, 0.1],
                pathOffset: [0, 1],
                opacity: bright ? [0.9, 1, 0.9] : [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 12 + i * 4,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                filter: `drop-shadow(0 0 ${bright ? '20px' : '10px'} ${theme.palette.primary.main})`,
              }}
            />
          </React.Fragment>
        ))}
      </svg>
      {bright && <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        background: `linear-gradient(to top, ${theme.palette.background.default}, transparent, ${theme.palette.background.default})`,
        opacity: 0.3 
      }} />}
    </Box>
  );
};

export const StarPattern = () => {
  const theme = useTheme();
  return (
    <Box sx={{ 
      position: 'absolute', 
      inset: 0, 
      opacity: theme.palette.mode === 'dark' ? 0.1 : 0.05, 
      pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle at center, ${theme.palette.primary.main} 1px, transparent 1px)`,
      backgroundSize: '24px 24px'
    }} />
  );
};

export const Logo = ({ sx = {} }: { sx?: any }) => {
  const theme = useTheme();
  return (
    <m.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box sx={{ 
        bgcolor: 'primary.main', 
        p: 1.5, 
        borderRadius: 2, 
        boxShadow: `0 12px 24px -4px ${alpha(theme.palette.primary.main, 0.35)}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        ...sx
      }}>
        <m.div 
          animate={{ 
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.2, 0.8],
            x: ['-50%', '50%', '-50%'],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'rgba(255,255,255,0.2)',
            filter: 'blur(20px)' 
          }}
        />
        
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 10 }}>
           <m.path
            d="M10 70 C 20 50, 30 80, 40 60 C 50 40, 60 90, 70 40 C 80 10, 90 40, 95 30"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            animate={{ 
              pathLength: [0.3, 0.6, 0.3],
              pathOffset: [0, 1],
              strokeWidth: [10, 14, 10],
            }}
            transition={{ 
              pathLength: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              pathOffset: { duration: 5, repeat: Infinity, ease: "linear" },
              strokeWidth: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <m.path
            d="M10 70 C 20 50, 30 80, 40 60 C 50 40, 60 90, 70 40 C 80 10, 90 40, 95 30"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.3"
            animate={{ 
              pathLength: [0.1, 0.2, 0.1],
              pathOffset: [0.1, 1.1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity, 
              ease: "linear",
              delay: 0.5
            }}
          />
        </svg>
      </Box>
    </m.div>
  );
};
