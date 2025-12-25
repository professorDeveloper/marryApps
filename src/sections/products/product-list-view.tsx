import { useMemo } from 'react';

import { GridColDef } from '@mui/x-data-grid';

import { useListData } from 'src/hooks/use-list-data';
import { endpoints } from 'src/lib/axios';
import { paths } from 'src/routes/paths';
import { SharedDataGrid } from 'src/sections/shared-data-grid';
import { IProductItem } from 'src/types/product';

import { RenderCellProduct, RenderCellPublish, RenderCellStock } from './product-table-row'; 

export function ProductListView() {
  const { tableData, loading } = useListData<IProductItem>(endpoints.product.list);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      minWidth: 360,
      renderCell: (params) => (
        <RenderCellProduct params={params} href={paths.menu.product.details(params.row.id)} />
      ),
    },
    // {
    //   field: 'createdAt',
    //   headerName: 'Create at',
    //   width: 160,
    //   valueFormatter: (value) => new Date(value as string).toLocaleDateString(),
    // },
     {
      field: 'publish',
      headerName: 'Publish',
      width: 110,
      renderCell: (params) => <RenderCellPublish params={params} />,
    },
    {
      field: 'inventoryType',
      headerName: 'Stock',
      width: 160,
      renderCell: (params) => <RenderCellStock params={params} />,
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 140,
      valueFormatter: (value) => `$${value}`, 
    },
  ], []);

  return (
    <SharedDataGrid
      data={tableData}
      columns={columns}
      loading={loading}
      
      heading="List"
      links={[
        { name: 'Dashboard', href: paths.menu.root },
        { name: 'Product', href: paths.menu.product.root },
        { name: 'List' },
      ]}
      createLink={paths.menu.product.new}
      createText="Add product"
    />
  );
}