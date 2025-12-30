import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function StocksEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log('Saving stock', formData);
    router.push(paths.menu.warehouse.stocks.root);
  }, [router]);

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
      { name: 'Warehouse', href: paths.menu.warehouse.root },
      { name: 'Stocks', href: paths.menu.warehouse.stocks.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
