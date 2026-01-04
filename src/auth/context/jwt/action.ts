import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = {
  username: string;
  password: string;
  pincode: string;
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
  username,
  password,
  pincode
}: SignInParams): Promise<void> => {
  try {
    const params = {
      username,
      password,
      pincode
    };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    setSession(accessToken);
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
