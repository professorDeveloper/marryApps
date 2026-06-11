// ----------------------------------------------------------------------
import { _id, _postTitles } from 'src/_mock/assets';

const MOCK_ID = _id[1];
const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  MENU: '/menu',
  SETTING: '/settings',
  WAREHOUSE: '/warehouse',
  REPORTS: '/reports',
  CASHBOX: '/cashbox',
  STAFFING: '/staffing',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  profile: '/profile',
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
      signIn: '/sign-in',
      signUp: '/sign-up',
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

  // MENU
  menu: {
    root: ROOTS.MENU,
    sign: `${ROOTS.MENU}/sign`,
    two: `${ROOTS.MENU}/two`,
    three: `${ROOTS.MENU}/three`,
    group: {
      root: `${ROOTS.MENU}/group`,
      five: `${ROOTS.MENU}/group/five`,
      six: `${ROOTS.MENU}/group/six`,
    },
    inventory: {
      root: `${ROOTS.WAREHOUSE}/inventories`,
      new: `${ROOTS.WAREHOUSE}/inventories/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/inventories/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/inventories/${id}/edit`,
    },
    product: {
      root: `${ROOTS.MENU}/departments`,
      new: `${ROOTS.MENU}/departments/new`,
      details: (id: string) => `${ROOTS.MENU}/departments/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/departments/${id}/edit`,
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
    ingredients: {
      root: `${ROOTS.MENU}/ingredients`,
      new: `${ROOTS.MENU}/ingredients/new`,
      details: (id: string) => `${ROOTS.MENU}/ingredients/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/ingredients/${id}/edit`,
    },
    ingredients_group: {
      root: `${ROOTS.MENU}/ingredient-group`,
      new: `${ROOTS.MENU}/ingredient-group/new`,
      details: (id: string) => `${ROOTS.MENU}/ingredient-group/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/ingredient-group/${id}/edit`,
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

    modifiers: {
      root: `${ROOTS.MENU}/modifiers`,
      new: `${ROOTS.MENU}/modifiers/new`,
      details: (id: string) => `${ROOTS.MENU}/modifiers/${id}`,
      edit: (id: string) => `${ROOTS.MENU}/modifiers/${id}/edit`,
    },

    reports: {
      root: `${ROOTS.REPORTS}`,
      new: `${ROOTS.REPORTS}/new`,
      details: (id: string) => `${ROOTS.REPORTS}/${id}`,
      edit: (id: string) => `${ROOTS.REPORTS}/${id}/edit`,
      bills: {
        root: `${ROOTS.REPORTS}/bills`,
        details: (id: string) => `${ROOTS.REPORTS}/bills/${id}`,
      },
      ingredients: {
        root: `${ROOTS.REPORTS}/ingredients`,
        details: (id: string) => `${ROOTS.REPORTS}/ingredients/${id}`,
      },
      goods: {
        root: `${ROOTS.REPORTS}/goods`,
        details: (id: string) => `${ROOTS.REPORTS}/goods/${id}`,
      },
    },
  },

  // WAREHOUSE
  warehouse: {
    root: `/warehouse`,
    storage: {
      root: `${ROOTS.WAREHOUSE}/storage`,
      new: `${ROOTS.WAREHOUSE}/storage/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/storage/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/storage/${id}/edit`,
    },
    new: `${ROOTS.WAREHOUSE}/storage/new`,
    details: (id: string) => `${ROOTS.WAREHOUSE}/inventory/${id}`,
    edit: (id: string) => `${ROOTS.WAREHOUSE}/inventory/${id}/edit`,
    stocks: {
      root: `${ROOTS.WAREHOUSE}/stocks`,
      new: `${ROOTS.WAREHOUSE}/stocks/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/stocks/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/stocks/${id}/edit`,
    },
    transfers: {
      root: `${ROOTS.WAREHOUSE}/transfers`,
      new: `${ROOTS.WAREHOUSE}/transfers/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/transfers/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/transfers/${id}/edit`,
    },
    shipments: {
      root: `${ROOTS.WAREHOUSE}/shipments`,
      new: `${ROOTS.WAREHOUSE}/shipments/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/shipments/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/shipments/${id}/edit`,
    },
    outgoingInvoices: {
      root: `${ROOTS.WAREHOUSE}/expenses-invoices`,
      new: `${ROOTS.WAREHOUSE}/expenses-invoices/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/expenses-invoices/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/expenses-invoices/${id}/edit`,
    },
    separationActs: {
      root: `${ROOTS.WAREHOUSE}/separations-acts`,
      new: `${ROOTS.WAREHOUSE}/separations-acts/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/separations-acts/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/separations-acts/${id}/edit`,
    },
    locations: {
      root: `${ROOTS.WAREHOUSE}/locations`,
      new: `${ROOTS.WAREHOUSE}/locations/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/locations/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/locations/${id}/edit`,
    },
    suppliers: {
      root: `${ROOTS.WAREHOUSE}/suppliers`,
      new: `${ROOTS.WAREHOUSE}/suppliers/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/suppliers/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/suppliers/${id}/edit`,
    },
    ingredientStock: {
      root: `${ROOTS.WAREHOUSE}/ingredient-stock`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/ingredient-stock/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/ingredient-stock/${id}/edit`,
    },
    invoices: {
      root: `${ROOTS.WAREHOUSE}/invoices`,
      new: `${ROOTS.WAREHOUSE}/invoices/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/invoices/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/invoices/${id}/edit`,
    },
    invoiceDetails: {
      root: `${ROOTS.WAREHOUSE}/invoice-details`,
      new: `${ROOTS.WAREHOUSE}/invoice-details/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/invoice-details/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/invoice-details/${id}/edit`,
    },
    deductions: {
      root: `${ROOTS.WAREHOUSE}/deductions`,
      new: `${ROOTS.WAREHOUSE}/deductions/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/deductions/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/deductions/${id}/edit`,
    },
    deductionGroups: {
      root: `${ROOTS.WAREHOUSE}/deduction-groups`,
      new: `${ROOTS.WAREHOUSE}/deduction-groups/new`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/deduction-groups/${id}/edit`,
    },
    orders: {
      root: `${ROOTS.WAREHOUSE}/orders`,
      new: `${ROOTS.WAREHOUSE}/orders/new`,
    },
  },

  // CASHBOX
  cashbox: {
    root: `/cashbox`,
    cashiers: `${ROOTS.CASHBOX}/cashiers`,
    transactionGroups: `${ROOTS.CASHBOX}/transaction-groups`,
    transactions: `${ROOTS.CASHBOX}/transactions`,
    transactionsNew: `${ROOTS.CASHBOX}/transactions/new`,
    transactionsEdit: (id: string) => `${ROOTS.CASHBOX}/transactions/${id}/edit`,
    report: `${ROOTS.CASHBOX}/report`,
  },

  // SETTINGS
  settings: {
    root: `${ROOTS.SETTING}`,
    users: `${ROOTS.SETTING}/users`,
    usersNew: `${ROOTS.SETTING}/users/new`,
    usersEdit: (id: string) => `${ROOTS.SETTING}/users/${id}/edit`,
    usersRestaurantStaffNew: `${ROOTS.SETTING}/users/restaurant-staff/new`,
    usersRestaurantStaffEdit: (id: string) => `${ROOTS.SETTING}/users/restaurant-staff/${id}/edit`,
    devices: `${ROOTS.SETTING}/devices`,
    general: {
      root: `${ROOTS.SETTING}/devices`,
    },
    notifications: {
      root: `${ROOTS.SETTING}/restaurant-info`,
    },
    integrations: {
      root: `${ROOTS.SETTING}/integrations`,
    },
    halls: `${ROOTS.SETTING}/halls`,
    floorPlan: (id: string) => `${ROOTS.SETTING}/halls/${id}`,
  },

  // STAFFING
  staffing: {
    employees: `${ROOTS.SETTING}/users`,
    shifts: `${ROOTS.STAFFING}/shifts`,
    kpi: `${ROOTS.STAFFING}/kpi`,
    salary: `${ROOTS.STAFFING}/salary`,
  },

  dashboard: {
    root: `${ROOTS.DASHBOARD}`,
    overview: `${ROOTS.DASHBOARD}`,
    floorPlan: `/floor-plan`,
  },
};
