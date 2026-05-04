import { m, AnimatePresence } from 'framer-motion';

import { usePathname } from 'src/routes/hooks';

// ----------------------------------------------------------------------

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

// ----------------------------------------------------------------------

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          minWidth: 0,
        }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
