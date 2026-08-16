import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

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
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken =
        sessionStorage.getItem(JWT_STORAGE_KEY) || localStorage.getItem(JWT_STORAGE_KEY);

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

          const resolvedBrandId = profile.brand_id || decoded.brand_id || decoded.brandId;
          const resolvedBranchId = profile.branch_id || decoded.branch_id || decoded.branchId;
          const resolvedRole = profile.role || decoded.role || 'user';

          if (resolvedBrandId) {
            localStorage.setItem('brand_id', resolvedBrandId);
          }

          if (resolvedBranchId) {
            localStorage.setItem('branch_id', resolvedBranchId);
            if (String(resolvedRole).toLowerCase() !== 'superadmin') {
              localStorage.setItem('selectedBranchId', resolvedBranchId);
            }
          } else {
            localStorage.removeItem('branch_id');
          }

          localStorage.setItem('user_role', String(resolvedRole));

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

          const resolvedBrandId = decoded.brand_id || decoded.brandId;
          const resolvedBranchId = decoded.branch_id || decoded.branchId;
          const resolvedRole = decoded.role || 'user';

          if (resolvedBrandId) {
            localStorage.setItem('brand_id', resolvedBrandId);
          }

          if (resolvedBranchId) {
            localStorage.setItem('branch_id', resolvedBranchId);
            if (String(resolvedRole).toLowerCase() !== 'superadmin') {
              localStorage.setItem('selectedBranchId', resolvedBranchId);
            }
          } else {
            localStorage.removeItem('branch_id');
          }

          localStorage.setItem('user_role', String(resolvedRole));

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
    checkUserSession().finally(() => {
      setHasBootstrapped(true);
    });
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
      hasBootstrapped,
    }),
    [checkUserSession, state.user, status, hasBootstrapped]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
