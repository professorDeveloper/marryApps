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
  STORAGE: '/storage',
  OPERATIONS: '/operations',
  CASHBOOKS: '/cashbooks',
  EMPLOYEE: '/employee',
};

// STORAGE
const storage = {
  root: ROOTS.STORAGE,
  storages: {
    root: `${ROOTS.STORAGE}/storages`,
    new: `${ROOTS.STORAGE}/storages/new`,
    details: (id: string) => `${ROOTS.STORAGE}/storages/${id}`,
    edit: (id: string) => `${ROOTS.STORAGE}/storages/${id}/edit`,
  },
  departments: {
    root: `${ROOTS.STORAGE}/departments`,
    new: `${ROOTS.STORAGE}/departments/new`,
    details: (id: string) => `${ROOTS.STORAGE}/departments/${id}`,
    edit: (id: string) => `${ROOTS.STORAGE}/departments/${id}/edit`,
  },
  categories: {
    root: `${ROOTS.STORAGE}/categories`,
    new: `${ROOTS.STORAGE}/categories/new`,
    details: (id: string) => `${ROOTS.STORAGE}/categories/${id}`,
    edit: (id: string) => `${ROOTS.STORAGE}/categories/${id}/edit`,
  },
  ingredientGroups: {
    root: `${ROOTS.STORAGE}/ingredient-groups`,
    new: `${ROOTS.STORAGE}/ingredient-groups/new`,
    details: (id: string) => `${ROOTS.STORAGE}/ingredient-groups/${id}`,
    edit: (id: string) => `${ROOTS.STORAGE}/ingredient-groups/${id}/edit`,
  },
};

// OPERATIONS
const operations = {
  root: ROOTS.OPERATIONS,
  invoices: {
    root: `${ROOTS.OPERATIONS}/invoices`,
    new: `${ROOTS.OPERATIONS}/invoices/new`,
    details: (id: string) => `${ROOTS.OPERATIONS}/invoices/${id}`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/invoices/${id}/edit`,
  },
  expenseInvoices: {
    root: `${ROOTS.OPERATIONS}/expense-invoices`,
    new: `${ROOTS.OPERATIONS}/expense-invoices/new`,
    details: (id: string) => `${ROOTS.OPERATIONS}/expense-invoices/${id}`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/expense-invoices/${id}/edit`,
  },
  separationActs: {
    root: `${ROOTS.OPERATIONS}/separation-acts`,
    new: `${ROOTS.OPERATIONS}/separation-acts/new`,
    details: (id: string) => `${ROOTS.OPERATIONS}/separation-acts/${id}`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/separation-acts/${id}/edit`,
  },
  deductions: {
    root: `${ROOTS.OPERATIONS}/deductions`,
    new: `${ROOTS.OPERATIONS}/deductions/new`,
    details: (id: string) => `${ROOTS.OPERATIONS}/deductions/${id}`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/deductions/${id}/edit`,
  },
  deductionGroups: {
    root: `${ROOTS.OPERATIONS}/deduction-groups`,
    new: `${ROOTS.OPERATIONS}/deduction-groups/new`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/deduction-groups/${id}/edit`,
  },
  transfers: {
    root: `${ROOTS.OPERATIONS}/transfers`,
    new: `${ROOTS.OPERATIONS}/transfers/new`,
    details: (id: string) => `${ROOTS.OPERATIONS}/transfers/${id}`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/transfers/${id}/edit`,
  },
  inventory: {
    root: `${ROOTS.OPERATIONS}/inventory`,
    new: `${ROOTS.OPERATIONS}/inventory/new`,
    details: (id: string) => `${ROOTS.OPERATIONS}/inventory/${id}`,
    edit: (id: string) => `${ROOTS.OPERATIONS}/inventory/${id}/edit`,
  },
};

// CASHBOOKS
const cashbooks = {
  root: ROOTS.CASHBOOKS,
  transactions: `${ROOTS.CASHBOOKS}/transactions`,
  transactionsNew: `${ROOTS.CASHBOOKS}/transactions/new`,
  transactionsEdit: (id: string) => `${ROOTS.CASHBOOKS}/transactions/${id}/edit`,
  transactionGroups: `${ROOTS.CASHBOOKS}/transaction-groups`,
  reports: `${ROOTS.CASHBOOKS}/reports`,
};

// EMPLOYEE
const employee = {
  root: ROOTS.EMPLOYEE,
  users: `${ROOTS.EMPLOYEE}/users`,
  usersNew: `${ROOTS.EMPLOYEE}/users/new`,
  usersEdit: (id: string) => `${ROOTS.EMPLOYEE}/users/${id}/edit`,
  usersRestaurantStaffNew: `${ROOTS.EMPLOYEE}/users/restaurant-staff/new`,
  usersRestaurantStaffEdit: (id: string) => `${ROOTS.EMPLOYEE}/users/restaurant-staff/${id}/edit`,
  shifts: `${ROOTS.EMPLOYEE}/shifts`,
  kpi: `${ROOTS.EMPLOYEE}/kpi`,
  salary: `${ROOTS.EMPLOYEE}/salary`,
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
    inventory: operations.inventory,
    product: storage.departments,
    category: storage.categories,
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
    ingredients_group: storage.ingredientGroups,
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
    storage: storage.storages,
    new: `${ROOTS.WAREHOUSE}/storage/new`,
    details: (id: string) => `${ROOTS.WAREHOUSE}/inventory/${id}`,
    edit: (id: string) => `${ROOTS.WAREHOUSE}/inventory/${id}/edit`,
    stocks: {
      root: `${ROOTS.WAREHOUSE}/stocks`,
      new: `${ROOTS.WAREHOUSE}/stocks/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/stocks/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/stocks/${id}/edit`,
    },
    transfers: operations.transfers,
    shipments: {
      root: `${ROOTS.WAREHOUSE}/shipments`,
      new: `${ROOTS.WAREHOUSE}/shipments/new`,
      details: (id: string) => `${ROOTS.WAREHOUSE}/shipments/${id}`,
      edit: (id: string) => `${ROOTS.WAREHOUSE}/shipments/${id}/edit`,
    },
    outgoingInvoices: operations.expenseInvoices,
    separationActs: operations.separationActs,
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
    invoiceDetails: operations.invoices,
    deductions: operations.deductions,
    deductionGroups: operations.deductionGroups,
    orders: {
      root: `${ROOTS.WAREHOUSE}/orders`,
      new: `${ROOTS.WAREHOUSE}/orders/new`,
    },
  },

  // CASHBOX (legacy aliases, see CASHBOOKS)
  cashbox: {
    root: `/cashbox`,
    cashiers: `${ROOTS.SETTING}/cashiers`,
    transactionGroups: cashbooks.transactionGroups,
    transactions: cashbooks.transactions,
    transactionsNew: cashbooks.transactionsNew,
    transactionsEdit: cashbooks.transactionsEdit,
    report: cashbooks.reports,
  },

  // SETTINGS
  settings: {
    root: `${ROOTS.SETTING}`,
    users: employee.users,
    usersNew: employee.usersNew,
    usersEdit: employee.usersEdit,
    usersRestaurantStaffNew: employee.usersRestaurantStaffNew,
    usersRestaurantStaffEdit: employee.usersRestaurantStaffEdit,
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
    cashiers: `${ROOTS.SETTING}/cashiers`,
  },

  // STAFFING (legacy aliases, see EMPLOYEE)
  staffing: {
    employees: employee.users,
    shifts: employee.shifts,
    kpi: employee.kpi,
    salary: employee.salary,
  },

  // STORAGE
  storage,

  // OPERATIONS
  operations,

  // CASHBOOKS
  cashbooks,

  // EMPLOYEE
  employee,

  dashboard: {
    root: `${ROOTS.DASHBOARD}`,
    overview: `${ROOTS.DASHBOARD}`,
    floorPlan: `/floor-plan`,
  },
};
