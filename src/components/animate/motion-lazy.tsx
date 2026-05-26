import { LazyMotion } from 'framer-motion';

// ----------------------------------------------------------------------

const loadFeatures = () => import('./features').then((m) => m.default);

export type MotionLazyProps = {
  children: React.ReactNode;
};

export function MotionLazy({ children }: MotionLazyProps) {
  return (
    <LazyMotion strict features={loadFeatures}>
      {children}
    </LazyMotion>
  );
}
