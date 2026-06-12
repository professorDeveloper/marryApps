import type { Variants } from 'framer-motion';

import { m } from 'framer-motion';
import React, { useState, useEffect } from 'react';

const LOGO_PATH = "M904.64,589.1c-23.7,93.51-33.32,101.46-40.94,0l-16.38-179.31c-8.19-72.02-49.34-68.66-73.07-3.15-23.73,65.51-57.11,155.16-57.11,155.16-8.61,23.52-19.32,19.95-24.57,1.47s-12.53-68.34-28.98-105.82c-24.57-33.17-73.28-5.25-88.19,34.85-14.91,40.1-56.27,149.08-59.42,165.45-3.15,16.38,23.32,31.68,45.77,22.26-2.1-34.64,10.38-78.47,36.53-132.49,8.68-11.43,11.76-14.91,15.75,0s32.12,104.56,32.12,104.56c14.49,61.1,65.09,53.33,83.15,0,18.06-53.33,52.7-161.88,52.7-161.88,15.54-40.31,26.55-47.56,26.04,0l-2.73,238.94c0,78.32,80.21,124.72,120.1,7.35,39.89-117.37,141.73-439.25,141.73-439.25,17.57-36.79,31.26-37.47,57.11-31.28-22.37-41.74-41.61-57.31-72.44-61.52-76.73,9.11-98.52,169.84-147.19,384.66Z";

const COLORS = {
  primary: "var(--accent)", // Primary orange from global CSS
  accent: "var(--warning)",  // Warning orange from global CSS
  core: "var(--accent-fg)" // White text on primary from global CSS
};

type AnimationState = "idle" | "building" | "solidifying" | "pure" | "settled" | "unsolidifying" | "unbuilding";

export interface LogoProps {
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  disabled?: boolean;
  forceRestart?: boolean;
  showLabel?: boolean;
}

const Logo = ({ className = "", size = "15%", style, disabled, forceRestart, showLabel = true }: LogoProps) => {
  const [state, setState] = useState<AnimationState>("idle");

  useEffect(() => {
    // Play the build-up once, then settle into a static visible state —
    // a looping cycle here kept blur-filtered SVG repaints running forever.
    const timeoutIds: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setState("solidifying"), 4000),
      setTimeout(() => setState("settled"), 6000),
    ];
    setState("building");

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [forceRestart]);

  // LAYER 1: Glowing Trajectory Border
  const trailVariants: Variants = {
    idle: { pathLength: 0, opacity: 0 },
    building: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 4, ease: "easeInOut" }
    },
    solidifying: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2 }
    },
    pure: {
      pathLength: 1,
      opacity: 0,
      transition: { duration: 1, ease: "easeOut" }
    },
    settled: {
      pathLength: 1,
      opacity: 0,
      transition: { duration: 1, ease: "easeOut" }
    },
    unsolidifying: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1, ease: "easeIn" }
    },
    unbuilding: {
      pathLength: 0,
      opacity: 1,
      transition: { duration: 4, ease: "easeInOut" }
    }
  };

  // LAYER 2: Spark Head Tracking
  const sparkVariants: Variants = {
    idle: { pathLength: 0.02, pathOffset: 0, opacity: 0 },
    building: {
      pathLength: 0.02,
      pathOffset: [0, 0.98],
      opacity: [0, 1, 1, 0],
      transition: { duration: 4, ease: "easeInOut" }
    },
    solidifying: { opacity: 0 },
    pure: { opacity: 0 },
    settled: { opacity: 0 },
    unsolidifying: { opacity: 0 },
    unbuilding: {
      pathLength: 0.02,
      pathOffset: [0.98, 0],
      opacity: [0, 1, 1, 0],
      transition: { duration: 4, ease: "easeInOut" }
    }
  };

  // LAYER 3: Solid Inside Fill & The New Ethereal "Pure" Effect
  const solidLogoVariants: Variants = {
    idle: { opacity: 0, y: 0, filter: 'drop-shadow(0 0 0px rgba(255,48,48,0))' },
    building: { opacity: 0, y: 0, filter: 'drop-shadow(0 0 0px rgba(255,48,48,0))' },
    solidifying: {
      opacity: 1,
      y: 0,
      filter: 'drop-shadow(0 0 15px rgba(255,48,48,0.5))',
      transition: { duration: 2, ease: "easeOut" }
    },
    pure: {
      opacity: 1,
      y: [0, -12, 0],
      filter: [
        'drop-shadow(0 5px 15px rgba(255,48,48,0.5))',
        'drop-shadow(0 25px 35px rgba(255,171,0,0.8))',
        'drop-shadow(0 5px 15px rgba(255,48,48,0.5))'
      ],
      transition: {
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity
      }
    },
    settled: {
      opacity: 1,
      y: 0,
      filter: 'drop-shadow(0 5px 15px rgba(255,48,48,0.5))',
      transition: { duration: 1, ease: "easeOut" }
    },
    unsolidifying: {
      opacity: 0,
      y: 0,
      filter: 'drop-shadow(0 0 0px rgba(255,48,48,0))',
      transition: { duration: 2, ease: "easeInOut" }
    },
    unbuilding: { opacity: 0, y: 0, filter: 'drop-shadow(0 0 0px rgba(255,48,48,0))' }
  };

  // LAYER 4: Calibration Labels
  const labelsVariants: Variants = {
    idle: { opacity: 1 },
    building: { opacity: 1, transition: { duration: 1, ease: "easeOut" } },
    solidifying: { opacity: 1, transition: { duration: 1, ease: "easeIn" } },
    pure: { opacity: 1 },
    settled: { opacity: 1 },
    unsolidifying: { opacity: 1 },
    unbuilding: { opacity: 1 }
  };

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{
        ...(disabled && { pointerEvents: 'none' }),
        ...(style || {}),
      }}
    >
      {/* ICON - now explicitly sized so the container can grow with the label */}
      <svg
        viewBox="400 150 800 700"
        width={size}
        height={size}
        className="flex-shrink-0 overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.primary} />
            <stop offset="100%" stopColor={COLORS.accent} />
          </linearGradient>
        </defs>

        {/* BACKGROUND BLUEPRINT WIREFRAME */}
        <path
          d={LOGO_PATH}
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="opacity-10 text-slate-400 dark:text-slate-500"
        />

        {/* GLOWING TRAJECTORY BORDERS */}
        <m.path
          d={LOGO_PATH}
          stroke={COLORS.accent}
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'blur(12px)', mixBlendMode: 'screen' }}
          variants={trailVariants}
          initial="idle"
          animate={state}
        />

        <m.path
          d={LOGO_PATH}
          stroke={COLORS.accent}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'blur(3px)', mixBlendMode: 'screen' }}
          variants={trailVariants}
          initial="idle"
          animate={state}
        />

        <m.path
          d={LOGO_PATH}
          stroke={COLORS.core}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={trailVariants}
          initial="idle"
          animate={state}
        />

        {/* HEAD SPARK */}
        <m.path
          d={LOGO_PATH}
          stroke={COLORS.core}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'blur(4px)', mixBlendMode: 'screen' }}
          variants={sparkVariants}
          initial="idle"
          animate={state}
        />

        {/* SOLID INSIDE FILL */}
        <m.path
          d={LOGO_PATH}
          fill="url(#brand-gradient)"
          variants={solidLogoVariants}
          initial="idle"
          animate={state}
          style={{ transformOrigin: "50% 50%" }}
        />
      </svg>

      {/* LABEL - bottom-aligned + lifted up a little */}
      {(showLabel
        &&
        (<span
          style={{
            color: 'var(--accent)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: typeof size === 'number' ? `${size * 0.45}px` : 'clamp(10px, 4vw, 24px)',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            position: 'relative',
            top: '-8px',
          }}
        >
          Mary Ai
        </span>)
      )}

    </div>
  );
};

export { Logo };