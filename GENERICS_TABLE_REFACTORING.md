# Generik Table Components - Refactoring Guide

## O'zgartirilgan Komponentlar

Bu refactoring bo'yicha **product-specific** komponentlar generik versiyalarga almashtirildi va barcha pagelar uchun ishlatilishi mumkin bo'ldi.

---

## 📁 Fayl Strukturasi

### Generik Komponentlar (`src/components/generic-table-view/`)

Bu komponentlar barcha data jadvallar uchun ishlatilinadi:

1. **`generic-table-view.tsx`** - Asosiy table component
   - Props: `GenericTableConfig<T>`
   - Support: Filterlash, o'chirish, column visibility

2. **`generic-table-toolbar.tsx`** - Table toolbar
   - Props: `GenericTableToolbarProps<T extends GenericTableFilters>`
   - Support: Quick filter, export, delete selected rows

3. **`generic-table-row.tsx`** - Umumiy cell renderers
   - `RenderCellPrice` - Narx ko'rsatish
   - `RenderCellPublish` - Status ko'rsatish
   - `RenderCellStock` - Zaxira status ko'rsatish
   - `RenderCellItem` - Rasm + matn (linkli)
   - `RenderCellText` - Sodda matn
   - `RenderCellNumber` - Raqam

4. **`generic-filters-result.tsx`** - Filter ko'rsatish
   - Props: `GenericFiltersResult<T extends GenericTableFilters>`
   - Support: Dinamik filter chips

---

### Product-Specific Komponentlar (`src/sections/products/`)

1. **`product-list-view.tsx`** - Product ro'yxati
   - Type: `IProductItem`
   - Filters: `publish`, `inventoryType`
   - Table toolbar bilan generik implementatsiya

2. **`product-table-row.tsx`** - Product renderers
   - `RenderCellProduct` - Rasm + mahsulot nomi (generik `RenderCellItem` dan)
   - `RenderCellPublish` - Product status
   - `RenderCellPrice` - Narx (generik versiyadan)
   - `RenderCellStock` - Zaxira (generik versiyadan)

3. **`product-table-toolbar.tsx`** - Product toolbar
   - Generik `GenericTableToolbar` export qiladi
   - `ProductTableFiltersResult` - Custom filter view

4. **`product-table-filters-result.tsx`** - Product filters
   - Stock va publish filters
   - Generik `GenericFiltersResult` import qiladi

---

### Category-Specific Komponentlar (`src/sections/products/`)

1. **`category-list-view.tsx`** - Category ro'yxati
   - Type: `ICategory` (yangi type)
   - Filters: `status`
   - Complete implementation with custom renderers

2. **`category-table-row.tsx`** - Category renderers
   - `RenderCellCategory` - Rasm + kategoriya nomi
   - `RenderCellPublish` - Status

3. **`category-table-filters-result.tsx`** - Category filters
   - Status filter

---

### Types (`src/types/`)

1. **`product.tsx`** (Mavjud)
   - `IProductItem`
   - `IProductTableFilters`

2. **`category.tsx`** (Yangi)
   - `ICategory`
   - `ICategoryTableFilters`

---

## 🔄 Integration Pattern

### Yangi page uchun Jadval qo'shish:

```typescript
import type { GridColDef } from '@mui/x-data-grid';
import { GenericTableView } from 'src/components/generic-table-view';
import { useGenericDataTable } from 'src/hooks/use-generic-data-table';

type YourItemType = {
  id: string;
  name: string;
  status: string;
  // ... other fields
};

type YourTableFilters = {
  status: string[];
};

export function YourListView() {
  const { data, loading } = useGenericDataTable<YourItemType>({
    endpoint: endpoints.your.list,
    dataKey: 'items',
  });

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Nomi',
      flex: 1,
      renderCell: (params) => (
        <RenderCellItem
          params={params}
          href={paths.menu.your.details(params.row.id)}
          imageField="image"
          nameField="name"
        />
      ),
    },
    // ... other columns
  ];

  return (
    <GenericTableView<YourItemType>
      data={data}
      loading={loading}
      columns={columns}
      breadcrumbs={{
        heading: 'Your Items',
        links: [
          { name: 'Menu', href: paths.menu.root },
          { name: 'Your', href: paths.menu.your.root },
          { name: 'List' },
        ],
      }}
      addButton={{
        label: 'Qo\'shish',
        href: paths.menu.your.new,
      }}
      filterOptions={{
        status: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      }}
      initialFilters={{
        status: [],
      }}
      onDeleteRow={(id) => console.log('Delete:', id)}
      onDeleteRows={(ids) => console.log('Delete multiple:', ids)}
    />
  );
}
```

---

## 🎯 O'zgartirilgan Fayllar

### Yangi Fayllar:

- ✅ `src/components/generic-table-view/generic-table-row.tsx`
- ✅ `src/components/generic-table-view/generic-filters-result.tsx`
- ✅ `src/types/category.tsx`
- ✅ `src/sections/products/category-table-row.tsx`
- ✅ `src/sections/products/category-table-filters-result.tsx`

### Tahrirlangan Fayllar:

- ✅ `src/components/generic-table-view/generic-table-toolbar.tsx` - Filters support qo'shildi
- ✅ `src/components/generic-table-view/index.ts` - Yangi exports qo'shildi
- ✅ `src/sections/products/product-table-toolbar.tsx` - Generik toolbar ishlatadi
- ✅ `src/sections/products/product-table-row.tsx` - Generik renderers import qiladi
- ✅ `src/sections/products/product-table-filters-result.tsx` - Generik version import qiladi
- ✅ `src/sections/products/category-list-view.tsx` - Complete implementation

---

## 🚀 Features

### ✅ Generik Table Toolbar

- Quick search/filter
- Export data
- Delete selected rows
- Custom filter results display

### ✅ Generik Cell Renderers

- Price formatting
- Status badges
- Stock indicators
- Item with avatar
- Text/Number rendering

### ✅ Generik Filters Result

- Dynamic filter chips
- Remove individual filters
- Reset all filters

### ✅ Type Safety

- Full TypeScript support
- Generic types for flexibility
- Type-safe filter keys

---

## 📝 Usage Tips

1. **Custom Renderers** - `RenderCellItem` to'rtinchi parametrlarida `imageField` va `nameField` o'zgartirishingiz mumkin

2. **Filters** - `filterKeys` array'ida filter katalarini belgilang

3. **Delete Handlers** - `onDeleteRow` va `onDeleteRows` callbacks'lar API requests uchun

4. **Column Visibility** - `hideColumns` va `hideColumnsTogglable` orqali column management

---

## 📚 Components Summary

| Komponent            | Locatsiya                  | Type              | Purpose              |
| -------------------- | -------------------------- | ----------------- | -------------------- |
| GenericTableView     | generic-table-view.tsx     | Generic           | Main table container |
| GenericTableToolbar  | generic-table-toolbar.tsx  | Generic           | Toolbar with filters |
| GenericTableRow      | generic-table-row.tsx      | Generic           | Cell renderers       |
| GenericFiltersResult | generic-filters-result.tsx | Generic           | Filter display       |
| ProductListView      | product-list-view.tsx      | Product-specific  | Product table        |
| CategoryListView     | category-list-view.tsx     | Category-specific | Category table       |
