# Generic Table Component - To'liq Qo'llanma

## 📊 Eski vs Yangi Yondashuv

### ❌ ESKI YONDASHUV (Har bir list uchun)
```
product/
├── actions/
│   └── product.ts (useGetProducts, useGetProduct) - ~60 qator
├── view/
│   └── product-list-view.tsx - ~250 qator
├── product-table-toolbar.tsx - ~100 qator
├── product-table-filters-result.tsx - ~60 qator
└── product-table-row.tsx - ~80 qator

JAMI: ~550 qator kod
```

### ✅ YANGI YONDASHUV (Barcha listlar uchun)
```
generic-table-view/
├── generic-table-view.tsx - ~150 qator
├── generic-table-toolbar.tsx - ~60 qator
└── index.ts

hooks/
└── use-generic-data-table.ts - ~100 qator

product/
└── view/
    └── product-list-view.tsx - ~90 qator

JAMI: ~310 qator (har bir yangi list uchun faqat ~90 qator)
```

---

## 🎯 Asosiy Ustunliklar

### 1. **Kod Takrorlanishini Yo'qotish**
- 20 ta list uchun: **11,000 qator** → **2,100 qator**
- **80% kamroq kod**

### 2. **Tezkor Rivojlantirish**
- Yangi list yaratish: **1-2 soat** → **10-15 daqiqa**

### 3. **Oson Saqlash**
- Bug fix 1 joyda → barcha listlarda ishlaydi
- Feature qo'shish 1 marta

### 4. **Yagona Standart**
- Barcha listlar bir xil ko'rinadi
- UX consistency

---

## 🚀 Qanday Ishlatish

### Bosqich 1: Hook yaratish
```typescript
// src/hooks/use-generic-data-table.ts
// (Artifactdagi kodni nusxalang)
```

### Bosqich 2: Generic component yaratish
```typescript
// src/components/generic-table-view/
// - generic-table-view.tsx
// - generic-table-toolbar.tsx
// - index.ts
```

### Bosqich 3: Har bir list uchun ishlatish
```typescript
// src/sections/product/view/product-list-view.tsx

export function ProductListView() {
  // 1. Data olish
  const { data, loading } = useGenericDataTable({
    endpoint: endpoints.product.list,
    dataKey: 'products',
  });

  // 2. Columns config
  const columns = useMemo(() => [
    { field: 'name', headerName: 'Nomi', flex: 1 },
    { field: 'price', headerName: 'Narx', width: 120 },
    // ... boshqa columnlar
  ], []);

  // 3. Render
  return (
    <GenericTableView
      data={data}
      loading={loading}
      columns={columns}
      breadcrumbs={{...}}
      addButton={{...}}
    />
  );
}
```

---

## 📝 Real Misollar

### Misol 1: Oddiy List (Category)
```typescript
export function CategoryListView() {
  const { data, loading } = useGenericDataTable({
    endpoint: '/api/categories',
    dataKey: 'categories',
  });

  const columns = [
    { field: 'name', headerName: 'Nomi', flex: 1 },
    { field: 'slug', headerName: 'Slug', width: 200 },
  ];

  return (
    <GenericTableView
      data={data}
      loading={loading}
      columns={columns}
      breadcrumbs={{ heading: 'Kategoriyalar', links: [...] }}
      addButton={{ label: 'Qo\'shish', href: '/category/new' }}
    />
  );
}
```

### Misol 2: Filter bilan (Order)
```typescript
export function OrderListView() {
  const { data, loading } = useGenericDataTable({
    endpoint: '/api/orders',
    dataKey: 'orders',
  });

  return (
    <GenericTableView
      data={data}
      loading={loading}
      columns={[...]}
      filterOptions={{
        status: [
          { value: 'pending', label: 'Kutilmoqda' },
          { value: 'completed', label: 'Bajarildi' },
        ],
      }}
      initialFilters={{ status: [] }}
    />
  );
}
```

### Misol 3: Custom Cell Render (Product)
```typescript
const columns = [
  {
    field: 'name',
    headerName: 'Nomi',
    renderCell: (params) => (
      <RenderCellProduct
        params={params}
        href={`/product/${params.row.id}`}
      />
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    renderCell: (params) => (
      <Label color={params.row.status === 'active' ? 'success' : 'error'}>
        {params.row.status}
      </Label>
    ),
  },
];
```

---

## 🔧 API Ulash

### endpoints.ts
```typescript
export const endpoints = {
  product: {
    list: '/api/products',
    details: '/api/products/:id',
    search: '/api/products/search',
  },
  category: {
    list: '/api/categories',
    details: '/api/categories/:id',
  },
  order: {
    list: '/api/orders',
    details: '/api/orders/:id',
  },
  // ... boshqa endpointlar
};
```

### Backend Response Format (Muhim!)
```json
{
  "products": [...],  // yoki "categories", "orders"
  "total": 100,
  "page": 1
}
```

Yoki bitta item uchun:
```json
{
  "product": {...},  // yoki "category", "order"
}
```

---

## ⚙️ Customization

### 1. Custom Delete Handler
```typescript
const handleDelete = async (id: string) => {
  try {
    await axios.delete(`/api/products/${id}`);
    toast.success('O\'chirildi!');
    mutate(); // SWR cache yangilash
  } catch (error) {
    toast.error('Xatolik yuz berdi!');
  }
};

<GenericTableView
  onDeleteRow={handleDelete}
/>
```

### 2. Custom Toolbar
```typescript
const renderToolbar = (props) => (
  <MyCustomToolbar
    {...props}
    extraButton={<Button>Export PDF</Button>}
  />
);

<GenericTableView
  renderToolbar={renderToolbar}
/>
```

### 3. Custom ID Field
```typescript
// Agar backend 'id' emas, '_id' ishlatsa
<GenericTableView
  idField="_id"
  data={data}
/>
```

---

## 🎨 Styling Customization

### Theme bilan
```typescript
// GenericTableView ichida
import { alpha } from '@mui/material/styles';

<DataGrid
  sx={{
    '& .MuiDataGrid-row:hover': {
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
    },
    '& .MuiDataGrid-cell': {
      borderBottom: 'none',
    },
  }}
/>
```

---

## 📦 Qo'shimcha Features

### 1. Pagination Settings
```typescript
<GenericTableView
  initialState={{
    pagination: { paginationModel: { pageSize: 25 } }
  }}
/>
```

### 2. Default Sorting
```typescript
<GenericTableView
  initialState={{
    sorting: {
      sortModel: [{ field: 'createdAt', sort: 'desc' }],
    },
  }}
/>
```

### 3. Row Height
```typescript
<GenericTableView
  getRowHeight={() => 'auto'} // yoki () => 100
/>
```

---

## ✅ Xulosa

### Foydalanish uchun 3 qadam:
1. **Generic component yarating** (bir marta)
2. **Columns config yozing** (har bir list uchun)
3. **GenericTableView chaqiring** (2-3 qator)

### Natija:
- ✅ 80% kam kod
- ✅ 90% tezroq development
- ✅ Oson maintenance
- ✅ Yagona UX standart
- ✅ API o'zgarganda 1 joyda fix

---

## 🤔 Savol-Javob

**Q: Eski kodimni qanday o'zgartirsam?**
A: Bosqichma-bosqich: birinchi yangi list yarating, test qiling, keyin eskisini almashtiring.

**Q: Custom logic kerak bo'lsa?**
A: `renderToolbar`, `onDeleteRow` kabi proplar orqali customize qiling.

**Q: Backend format mos kelmasa?**
A: `dataKey` prop orqali o'zgartiring yoki hook ichida transform qiling.

**Q: Performance qanday?**
A: SWR caching + React.memo ishlatilgan, juda tez.

---

Omad! 🚀