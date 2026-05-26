import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';
import { useCreateStock, useUpdateStock, useGetStockById } from 'src/actions/stocks';
import { IStockFormData } from 'src/types/stocks';

export function StocksEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  
  // Get URL parameters to extract stock ID for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || window.location.pathname.split('/').pop();
  const { stock, stockLoading } = useGetStockById(isNew ? undefined : id);

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    try {
      // Cast formData to IStockFormData to ensure type safety
      const stockData = formData as IStockFormData;
      
      if (isNew) {
        await createStock(stockData);
      } else if (id) {
        await updateStock(id, stockData);
      }
      router.push(paths.warehouse.stocks.root);
    } catch (error) {
      console.error('Error saving stock:', error);
      // Error is already handled in the hook with toast
    }
  }, [isNew, id, createStock, updateStock, router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'sku', label: 'SKU', type: 'text', required: true, defaultValue: '' },
      { key: 'name', label: 'Name', type: 'text', defaultValue: '' },
      { key: 'quantity', label: 'Quantity', type: 'number', defaultValue: 0 },
      { key: 'location', label: 'Location', type: 'text', defaultValue: '' },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Stock',
    entityName: 'stock',
    breadcrumbs: [
      { name: 'Menu', href: paths.menu.root },
      { name: 'Warehouse', href: paths.warehouse.root },
      { name: 'Stocks', href: paths.warehouse.stocks.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return (
    <GenericEditView 
      config={config} 
      isNew={isNew} 
      loading={!isNew && stockLoading}
      data={!isNew ? stock : undefined}
    />
  );
}
