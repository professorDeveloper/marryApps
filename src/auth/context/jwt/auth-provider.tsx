import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { jwtDecode, setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);
        const decoded = jwtDecode(accessToken);

        try {
          const res = await axios.get(endpoints.users.me);
          const profile = res.data?.data ?? {};

          const user = {
            id: profile.id || decoded.sub || decoded.id || 'user',
            username: profile.username || decoded.username || 'User',
            role: profile.role || decoded.role || 'user',
            isActive: profile.is_active,
            brandId: profile.brand_id,
            branchId: profile.branch_id,
            phoneNumber: profile.phone_number || '',
            full_name: profile.full_name || decoded.fullName || decoded.name || 'User',
            fullName: profile.full_name || decoded.fullName || decoded.name || 'User',
            displayName: profile.full_name || decoded.fullName || decoded.name || 'User',
            email: decoded.email || '',
          };

          setState({ user: { ...user, accessToken }, loading: false });
        } catch (profileError) {
          console.error('Failed to fetch /api/v1/user/me profile:', profileError);

          const fallbackUser = {
            id: decoded.sub || decoded.id || 'user',
            username: decoded.username || 'User',
            full_name: decoded.fullName || decoded.name || 'User',
            fullName: decoded.fullName || decoded.name || 'User',
            displayName: decoded.fullName || decoded.name || decoded.username || 'User',
            phoneNumber: '',
            email: decoded.email || '',
            role: decoded.role || 'user',
          };

          setState({ user: { ...fallbackUser, accessToken }, loading: false });
        }
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'admin' } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
