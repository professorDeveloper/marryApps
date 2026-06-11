import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

// Single tracked timeout — setSession can run multiple times per session
// (init, re-login), which previously stacked expiry timeouts and alerts.
let tokenExpiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function clearTokenExpiryTimeout() {
  if (tokenExpiryTimeoutId !== null) {
    clearTimeout(tokenExpiryTimeoutId);
    tokenExpiryTimeoutId = null;
  }
}

export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  clearTokenExpiryTimeout();

  tokenExpiryTimeoutId = setTimeout(() => {
    try {
      alert('Token expired!');
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null, brandId?: string) {
  try {
    if (accessToken) {
      sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
      // Backward compatibility for legacy code paths
      sessionStorage.setItem('accessToken', accessToken);
      localStorage.setItem(JWT_STORAGE_KEY, accessToken);
      localStorage.setItem('accessToken', accessToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken); // ~3 days by minimals server

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }

      // Persist tenant scope for request headers
      const resolvedBrandId = decodedToken?.brand_id || decodedToken?.brandId || brandId;
      const resolvedBranchId = decodedToken?.branch_id || decodedToken?.branchId;
      const resolvedRole = decodedToken?.role;

      if (resolvedBrandId) {
        localStorage.setItem('brand_id', resolvedBrandId);
      }

      if (resolvedBranchId) {
        localStorage.setItem('branch_id', resolvedBranchId);
      } else {
        localStorage.removeItem('branch_id');
      }

      if (resolvedRole) {
        localStorage.setItem('user_role', String(resolvedRole));
      }
    } else {
      clearTokenExpiryTimeout();
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem(JWT_STORAGE_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('brand_id');
      localStorage.removeItem('branch_id');
      localStorage.removeItem('user_role');
      localStorage.removeItem('selectedBranchId');
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
