import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function TransfersEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log('Saving transfer', formData);
    router.push(paths.menu.warehouse.transfers.root);
  }, [router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'fromWarehouse', label: 'From Warehouse', type: 'text', required: true, defaultValue: '' },
      { key: 'toWarehouse', label: 'To Warehouse', type: 'text', required: true, defaultValue: '' },
      { key: 'quantity', label: 'Quantity', type: 'number', defaultValue: 0 },
      { key: 'status', label: 'Status', type: 'text', defaultValue: 'pending' },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Transfer',
    entityName: 'transfer',
    breadcrumbs: [
      { name: 'Menu', href: paths.menu.root },
      { name: 'Warehouse', href: paths.menu.warehouse.root },
      { name: 'Transfers', href: paths.menu.warehouse.transfers.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
