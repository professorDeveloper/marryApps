import type { CardSection, GenericEditViewConfig } from 'src/components/generic-edit-view';

import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GenericEditView } from 'src/components/generic-edit-view';

export function ReportsEditView({ isNew = false }: { isNew?: boolean }) {
  const router = useRouter();

  const handleSubmit = useCallback(async (formData: Record<string, any>) => {
    router.push(paths.menu.reports.root);
  }, [router]);

  const BASIC: CardSection = {
    id: 'basic',
    title: 'Basic information',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, defaultValue: '' },
      { key: 'type', label: 'Type', type: 'text', defaultValue: '' },
      { key: 'summary', label: 'Summary', type: 'textarea', rows: 4, defaultValue: '' },
    ],
  };

  const config: GenericEditViewConfig = {
    title: 'Report',
    entityName: 'report',
    breadcrumbs: [
      { name: 'Menu', href: paths.menu.root },
      { name: 'Reports', href: paths.menu.reports.root },
      { name: isNew ? 'New' : 'Edit', href: '' },
    ],
    sections: [BASIC],
    onSubmit: handleSubmit,
  };

  return <GenericEditView config={config} isNew={isNew} />;
}
