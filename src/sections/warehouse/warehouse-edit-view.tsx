import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function WarehouseEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log('Saving warehouse', formData);
    router.push(paths.menu.warehouse.root);
  }, [router]);

  const handleDelete = useCallback(async () => {
    // placeholder
    router.push(paths.menu.warehouse.root);
  }, [router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, defaultValue: '' },
      { key: 'code', label: 'Code', type: 'text', defaultValue: '' },
      { key: 'location', label: 'Location', type: 'text', defaultValue: '' },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Warehouse',
    entityName: 'warehouse',
    breadcrumbs: [
      { name: 'Menu', href: paths.menu.root },
      { name: 'Warehouse', href: paths.menu.warehouse.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
    onDelete: !isNew ? handleDelete : undefined,
    showDeleteButton: !isNew,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
