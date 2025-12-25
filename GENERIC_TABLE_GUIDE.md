# Umumiy Table Komponentlari Qo'llanmasi

Bu hujjatda loyihada yaratilgan umumiy table komponentlari va hook'lardan qanday foydalanish tushuntiriladi.

## 📋 Kirish

Har bir entity (mahsulot, foydalanuvchi, buyurtma) uchun alohida 10+ fayl yaratish o'rniga, endi umumiy komponentlardan foydalanishingiz mumkin. Bu sizga vaqtni tejaydi va kodni qayta ishlatish imkonini beradi.

## 🗂️ Yaratilgan Fayllar

### 1. **Hooks**
- `src/hooks/use-table-data.ts` - Umumiy table hook
- `src/actions/generic-crud.ts` - Umumiy CRUD actions

### 2. **Komponentlar**
- `src/components/generic-table.tsx` - Asosiy table komponenti
- `src/components/generic-table-toolbar.tsx` - Toolbar komponenti
- `src/components/generic-table-filters-result.tsx` - Filtr natijalari

### 3. **Types**
- `src/types/generic-table.ts` - Umumiy table typelari

### 4. **Namunalar**
- `src/sections/products/product-list-view-refactored.tsx` - Refaktor qilingan
- `src/sections/products/product-list-view-generic.tsx` - Generic komponentdan foydalanish
- `src/sections/products/product-list-view-crud.tsx` - CRUD hook'dan foydalanish

---

## 🎯 Foydalanish Usullari

### 1. **useTable Hook** (Tavsiya etiladi)

Eng sodda va kuchli usul:

```typescript
import { useTable } from 'src/hooks/use-table-data';
import { useSetState } from 'minimal-shared/hooks';

function MyTableView() {
  const filters = useSetState({ status: [], category: [] });

  const {
    data: items,
    loading,
    error,
    selectedRows,
    handleDeleteRow,
    handleDeleteRows,
    mutate: refresh,
  } = useTable({
    endpoint: '/api/my-entity/list',
    filters: filters.state,
  });

  // DataGrid yoki GenericTable ga uzatish
  return <GenericTable data={items} loading={loading} filters={filters} />;
}
```

### 2. **GenericTable Komponenti**

Konfiguratsiya asosida to'liq table yaratish:

```typescript
import { GenericTable } from 'src/components/generic-table';

const tableConfig = {
  title: 'My Entities',
  columns: [
    { field: 'name', headerName: 'Nomi', flex: 1 },
    { field: 'status', headerName: 'Status', type: 'singleSelect', valueOptions: [...] },
  ],
  actions: [
    { label: 'Edit', icon: 'solar:pen-bold', href: (row) => `/edit/${row.id}` },
    { label: 'Delete', icon: 'solar:trash-bin-trash-bold', onClick: (row) => handleDelete(row.id) },
  ],
  enableSelection: true,
  enableFilters: true,
  addButton: { text: 'Add New', href: '/new' },
};

function MyTableView() {
  const { data: items, loading } = useTable({ endpoint: '/api/my-entity/list' });

  return (
    <GenericTable
      config={tableConfig}
      data={items}
      loading={loading}
    />
  );
}
```

### 3. **CRUD Hooks**

Avtomatik CRUD operatsiyalari:

```typescript
import { createCrudHooks } from 'src/actions/generic-crud';

// Yangi entity uchun hook yaratish
const userHooks = createCrudHooks({ entity: 'user' });

function UserList() {
  const { data: users, loading } = userHooks.useList({ role: 'admin' });
  const { data: user } = userHooks.useDetails('123');
  const { data: searchResults } = userHooks.useSearch('john');

  // yoki oldindan tayyorlangan
  const { data: products } = productHooks.useList();
}
```

---

## 🔧 Detallarni Sozlash

### **Table Konfiguratsiyasi**

```typescript
interface TableConfig {
  title?: string;                    // Table sarlavhasi
  columns: TableColumn[];           // Kolumnalar
  actions?: TableAction[];          // Harakatlar
  filters?: FilterConfig;           // Filtr konfiguratsiyasi
  hideColumns?: string[];           // Yashirilgan kolumnalar
  pageSize?: number;                // Sahifa hajmi
  enableSelection?: boolean;        // Tanlash imkoni
  enableFilters?: boolean;          // Filtrlar
  enableSearch?: boolean;           // Qidiruv
  enableExport?: boolean;           // Eksport
  addButton?: { text: string; href: string }; // Qo'shish tugmasi
}
```

### **Kolumnalar**

```typescript
const columns = [
  {
    field: 'name',
    headerName: 'Nomi',
    flex: 1,           // Kengayish
    minWidth: 200,     // Minimal kenglik
    hideable: false,   // Yashirib bo'lmaydi
  },
  {
    field: 'status',
    headerName: 'Status',
    type: 'singleSelect',
    valueOptions: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    renderCell: (params) => <CustomStatusCell params={params} />,
  },
];
```

### **Harakatlar**

```typescript
const actions = [
  {
    label: 'Edit',
    icon: 'solar:pen-bold',
    href: (row) => `/edit/${row.id}`,  // Dinamik URL
    showInMenu: true,
  },
  {
    label: 'Delete',
    icon: 'solar:trash-bin-trash-bold',
    onClick: (row) => handleDelete(row), // Funksiya
    style: { color: 'error.main' },
  },
];
```

---

## 📝 To'liq Misol

### **Users Table**

```typescript
// src/sections/users/user-list-view.tsx
import { useTable } from 'src/hooks/use-table-data';
import { GenericTable } from 'src/components/generic-table';
import { useSetState } from 'minimal-shared/hooks';

export function UserListView() {
  const filters = useSetState({ role: [], status: [] });

  const { data: users, loading } = useTable({
    endpoint: '/api/user/list',
    filters: filters.state,
  });

  const tableConfig = {
    title: 'Users',
    columns: [
      { field: 'name', headerName: 'Ism', flex: 1 },
      { field: 'email', headerName: 'Email', width: 250 },
      {
        field: 'role',
        headerName: 'Rol',
        type: 'singleSelect',
        valueOptions: [
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
        ],
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'singleSelect',
        valueOptions: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
    actions: [
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        href: (row) => `/dashboard/user/edit/${row.id}`,
      },
      {
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => console.log('Delete', row.id),
      },
    ],
    addButton: { text: 'Add User', href: '/dashboard/user/new' },
  };

  return (
    <GenericTable
      config={tableConfig}
      data={users}
      loading={loading}
      filters={filters}
    />
  );
}
```

### **Orders Table**

```typescript
// src/sections/orders/order-list-view.tsx
import { createCrudHooks } from 'src/actions/generic-crud';
import { GenericTable } from 'src/components/generic-table';

const orderHooks = createCrudHooks({ entity: 'order' });

export function OrderListView() {
  const filters = useSetState({ status: [], paymentStatus: [] });
  const { data: orders, loading } = orderHooks.useList(filters.state);

  const tableConfig = {
    title: 'Orders',
    columns: [
      { field: 'orderNumber', headerName: 'Order #', width: 120 },
      { field: 'customerName', headerName: 'Customer', flex: 1 },
      { field: 'total', headerName: 'Total', type: 'number', width: 120 },
      { field: 'status', headerName: 'Status', type: 'singleSelect', valueOptions: [...] },
    ],
    actions: [...],
  };

  return <GenericTable config={tableConfig} data={orders} loading={loading} filters={filters} />;
}
```

---

## 🚀 Afzalliklari

### **Kod Kamayishi**
- **Avval:** Har entity uchun 10+ fayl
- **Hozir:** 1-2 fayl + konfiguratsiya

### **Qayta Ishlatish**
- Bitta komponent barcha table'lar uchun
- Bir xil funksionallik barcha joyda

### **Tez Ishlash**
- Yangi table yaratish: 5 daqiqa
- Filtrlar qo'shish: 1 daqiqa
- Harakatlar qo'shish: 2 daqiqa

### **Moslashuvchanlik**
- Har qanday entity uchun
- O'zgaruvchi konfiguratsiya
- Custom render funksiyalari

---

## 🔧 Kengaytirish

### **Custom Render Funksiyalari**

```typescript
// src/components/custom-cells.tsx
export function RenderUserStatus({ params }) {
  return <Label color={params.value === 'active' ? 'success' : 'error'}>
    {params.value}
  </Label>;
}

export function RenderOrderTotal({ params }) {
  return <Typography fontWeight="bold">
    ${params.value.toFixed(2)}
  </Typography>;
}
```

### **Custom Hook'lar**

```typescript
// src/hooks/use-advanced-table.ts
export function useAdvancedTable(config) {
  const table = useTable(config);

  // Qo'shimcha funksiyalar
  const exportToExcel = useCallback(() => {
    // Excel export logikasi
  }, [table.data]);

  const bulkUpdate = useCallback((updates) => {
    // Bulk update logikasi
  }, []);

  return {
    ...table,
    exportToExcel,
    bulkUpdate,
  };
}
```

### **Custom Komponentlar**

```typescript
// src/components/advanced-table.tsx
export function AdvancedTable(props) {
  // Qo'shimcha funksiyalar bilan GenericTable ni kengaytirish
  return <GenericTable {...props} />;
}
```

---

## 📊 Migratsiya Qo'llanmasi

### **Eski Product Table dan Yangi Table ga**

1. **Avval:**
```typescript
// 10+ alohida fayl
import { useGetProducts } from 'src/actions/product';
import { ProductListView } from 'src/sections/products/product-list-view';
// ... boshqa import'lar
```

2. **Hozir:**
```typescript
// 2-3 qator
import { useTable } from 'src/hooks/use-table-data';
import { GenericTable } from 'src/components/generic-table';
```

### **Migratsiya Qadamlari**

1. **Endpoint qo'shish** `src/lib/axios.ts` ga
2. **Konfiguratsiya yaratish** (columns, actions)
3. **Komponentni almashtirish**
4. **Test qilish**

---

## 🐛 Xatoliklar va Yechimlar

### **Hook xatoligi**
```typescript
// Xato
const { data } = useTable({ endpoint: '/api/users' });

// To'g'ri
const { data: users } = useTable({ endpoint: '/api/user/list' });
```

### **Type xatoligi**
```typescript
// Xato
columns: [{ field: 'name', headerName: 'Name' }]

// To'g'ri
columns: [{ field: 'name' as const, headerName: 'Name' }]
```

### **Action xatoligi**
```typescript
// Xato
actions: [{ onClick: (row) => deleteRow(row) }]

// To'g'ri
actions: [{ onClick: useCallback((row) => deleteRow(row.id), []) }]
```

---

## 🎯 Xulosa

Bu umumiy table tizimi sizga:

- **80% kamroq kod** yozish
- **5x tezroq** yangi table yaratish
- **100% qayta ishlatish** imkoni
- **Moslashuvchan konfiguratsiya**
- **TypeScript to'liq qo'llab-quvvatlash**

Endi har bir yangi table uchun 10 daqiqa o'rniga 2 daqiqa sarflaysiz! 🎉
