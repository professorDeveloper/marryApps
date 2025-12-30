import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function SettingsEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    console.log('Saving setting', formData);
    router.push(paths.menu.settings.root);
  }, [router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'key', label: 'Key', type: 'text', required: true, defaultValue: '' },
      { key: 'label', label: 'Label', type: 'text', defaultValue: '' },
      { key: 'value', label: 'Value', type: 'text', defaultValue: '' },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Setting',
    entityName: 'setting',
    breadcrumbs: [
      { name: 'Menu', href: paths.menu.root },
      { name: 'Settings', href: paths.menu.settings.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
