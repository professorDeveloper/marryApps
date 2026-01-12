import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = {
  brand_id: string;
  username: string;
  password: string;
};

export type SignUpParams = {
  fullName: string;
  username: string;
  password: string;
  phoneNumber: string;
  pincode: string;
  role: 'user' | 'admin';
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({
  brand_id,
  username,
  password,
}: SignInParams): Promise<void> => {
  try {
    const params = {
      brand_id,
      username,
      password,
    };

    const res = await axios.post(endpoints.auth.signIn, params);

    // Check if access token is in res.data.data or res.data
    // Support multiple field names and structures
    const accessToken =
      res.data.data?.accessToken ||
      res.data.data?.access_token ||
      res.data.data?.token ||
      res.data.accessToken ||
      res.data.access_token ||
      res.data.token;

    if (!accessToken) {
      console.error('Response structure:', JSON.stringify(res.data, null, 2));
      throw new Error('Access token not found in response');
    }

    setSession(accessToken, brand_id);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  fullName,
  username,
  password,
  phoneNumber,
  pincode,
  role = 'user',
}: SignUpParams): Promise<void> => {
  const params = {
    fullName,
    username,
    password,
    phoneNumber,
    pincode,
    role,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
