// ----------------------------------------------------------------------
import { _id, _postTitles } from 'src/_mock/assets';

const MOCK_ID = _id[1];
const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  MENU: '/menu',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  menu: {
    root: ROOTS.MENU,
    two: `${ROOTS.MENU}/two`,
    three: `${ROOTS.MENU}/three`,
    group: {
      root: `${ROOTS.MENU}/group`,
      five: `${ROOTS.MENU}/group/five`,
      six: `${ROOTS.MENU}/group/six`,
    },
    product: {
      root: `${ROOTS.MENU}/section`,
      new: `${ROOTS.MENU}/section/new`,
      details: (id: string) => `${ROOTS.MENU}/section/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/section/${id}/edit`,
    },
    category: {
      root: `${ROOTS.MENU}/category`,
      new: `${ROOTS.MENU}/category/new`,
      details: (id: string) => `${ROOTS.MENU}/category/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/category/${id}/edit`,
    },
    user: {
      root: `${ROOTS.MENU}/user`,
      new: `${ROOTS.MENU}/user/new`,
      details: (id: string) => `${ROOTS.MENU}/user/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/user/${id}/edit`,
    },
    semifinished: {
      root: `${ROOTS.MENU}/semifinished`,
      new: `${ROOTS.MENU}/semifinished/new`,
      details: (id: string) => `${ROOTS.MENU}/semifinished/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/semifinished/${id}/edit`,
    },
    meals: {
      root: `${ROOTS.MENU}/meals`,
      new: `${ROOTS.MENU}/meals/new`,
      details: (id: string) => `${ROOTS.MENU}/meals/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/meals/${id}/edit`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: '/',
  },
};
