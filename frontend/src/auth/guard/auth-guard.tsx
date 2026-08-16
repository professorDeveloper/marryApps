import { useEffect, startTransition } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type AuthGuardProps = {
  children: React.ReactNode;
};

const signInPaths = {
  jwt: paths.auth.jwt.signIn,
  auth0: paths.auth.auth0.signIn,
  amplify: paths.auth.amplify.signIn,
  firebase: paths.auth.firebase.signIn,
  supabase: paths.auth.supabase.signIn,
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { authenticated, hasBootstrapped } = useAuthContext();

  useEffect(() => {
    if (!hasBootstrapped || authenticated) {
      return;
    }

    const { method } = CONFIG.auth;
    const signInPath = signInPaths[method];
    const queryString = new URLSearchParams({ returnTo: pathname }).toString();
    const redirectPath = `${signInPath}?${queryString}`;

    startTransition(() => {
      router.replace(redirectPath);
    });
  }, [hasBootstrapped, authenticated, pathname, router]);

  if (!hasBootstrapped) {
    return <SplashScreen />;
  }

  if (!authenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
