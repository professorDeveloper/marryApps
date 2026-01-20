// ----------------------------------------------------------------------
import { _id, _postTitles } from 'src/_mock/assets';

const MOCK_ID = _id[1];
const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  MENU: '/menu',
  SETTING: '/setting'
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',

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
    inventory: {
      root: `${ROOTS.MENU}/inventory`,
      new: `${ROOTS.MENU}/inventory/new`,
      details: (id: string) => `${ROOTS.MENU}/inventory/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/inventory/${id}/edit`,
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
      restaurantStaff: `${ROOTS.MENU}/user/restaurant-staff`,
      restaurantStaffNew: `${ROOTS.MENU}/user/restaurant-staff/new`,
      restaurantStaffEdit: (id: string) => `${ROOTS.MENU}/user/restaurant-staff/${id}/edit`,
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
    warehouse: {
      root: `${ROOTS.MENU}/warehouse`,
      new: `${ROOTS.MENU}/inventory/new`,
      details: (id: string) => `${ROOTS.MENU}/inventory/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/inventory/${id}/edit`,
      stocks: {
        root: `${ROOTS.MENU}/warehouse/stocks`,
        new: `${ROOTS.MENU}/warehouse/stocks/new`,
        details: (id: string) => `${ROOTS.MENU}/warehouse/stocks/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/warehouse/stocks/${id}/edit`,
      },
      transfers: {
        root: `${ROOTS.MENU}/warehouse/transfers`,
        new: `${ROOTS.MENU}/warehouse/transfers/new`,
        details: (id: string) => `${ROOTS.MENU}/warehouse/transfers/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/warehouse/transfers/${id}/edit`,
      },
      locations: {
        root: `${ROOTS.MENU}/warehouse/locations`,
        new: `${ROOTS.MENU}/warehouse/locations/new`,
        details: (id: string) => `${ROOTS.MENU}/warehouse/locations/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/warehouse/locations/${id}/edit`,
      },
      suppliers: {
        root: `${ROOTS.MENU}/warehouse/suppliers`,
        new: `${ROOTS.MENU}/warehouse/suppliers/new`,
        details: (id: string) => `${ROOTS.MENU}/warehouse/suppliers/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/warehouse/suppliers/${id}/edit`,
      },
      ingredients: {
        root: `${ROOTS.MENU}/warehouse/ingredients`,
        new: `${ROOTS.MENU}/warehouse/ingredients/new`,
        details: (id: string) => `${ROOTS.MENU}/warehouse/ingredients/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/warehouse/ingredients/${id}/edit`,
      },
    },
    reports: {
      root: `${ROOTS.MENU}/reports`,
      new: `${ROOTS.MENU}/reports/new`,
      details: (id: string) => `${ROOTS.MENU}/reports/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/reports/${id}/edit`,
      sales: {
        root: `${ROOTS.MENU}/reports/sales`,
        new: `${ROOTS.MENU}/reports/sales/new`,
        details: (id: string) => `${ROOTS.MENU}/reports/sales/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/reports/sales/${id}/edit`,
      },
      inventory: {
        root: `${ROOTS.MENU}/reports/inventory`,
        new: `${ROOTS.MENU}/reports/inventory/new`,
        details: (id: string) => `${ROOTS.MENU}/reports/inventory/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/reports/inventory/${id}/edit`,
      },
      custom: {
        root: `${ROOTS.MENU}/reports/custom`,
        new: `${ROOTS.MENU}/reports/custom/new`,
        details: (id: string) => `${ROOTS.MENU}/reports/custom/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/reports/custom/${id}/edit`,
      },
      archives: {
        root: `${ROOTS.MENU}/reports/archives`,
        new: `${ROOTS.MENU}/reports/archives/new`,
        details: (id: string) => `${ROOTS.MENU}/reports/archives/${id}`,
        edit: (id: string) => `${ROOTS.MENU}/reports/archives/${id}/edit`,
      },
    },
  },

  settings: {
    root: `${ROOTS.SETTING}`,
    general: {
      root: `${ROOTS.SETTING}/connected-device`,
    },
    profile: {
      root: `${ROOTS.SETTING}/management`,
    },
    notifications: {
      root: `${ROOTS.SETTING}/restaurant-info`,
    },
    integrations: {
      root: `${ROOTS.SETTING}/integrations`,
    },
  },

  dashboard: {
    root: '/',
  },
};
