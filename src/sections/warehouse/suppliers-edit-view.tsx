import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function SuppliersEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log('Saving supplier', formData);
    router.push(paths.warehouse.suppliers.root);
  }, [router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, defaultValue: '' },
      { key: 'contact', label: 'Contact', type: 'text', defaultValue: '' },
      { key: 'phone', label: 'Phone', type: 'text', defaultValue: '' },
      { key: 'email', label: 'Email', type: 'text', defaultValue: '' },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Supplier',
    entityName: 'supplier',
    breadcrumbs: [
      { name: 'Menu', href: paths.warehouse.root },
      { name: 'Warehouse', href: paths.warehouse.root },
      { name: 'Suppliers', href: paths.warehouse.suppliers.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
