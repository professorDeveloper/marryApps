import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function LocationsEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    router.push(paths.warehouse.locations.root);
  }, [router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, defaultValue: '' },
      { key: 'name', label: 'Name', type: 'text', defaultValue: '' },
      { key: 'capacity', label: 'Capacity', type: 'number', defaultValue: 0 },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Location',
    entityName: 'location',
    breadcrumbs: [
      { name: 'Menu', href: paths.menu.root },
      { name: 'Warehouse', href: paths.warehouse.root },
      { name: 'Locations', href: paths.warehouse.locations.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
