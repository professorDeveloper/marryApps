import { CONFIG } from 'src/global-config';

import { DepartmentListView as ProductListView } from 'src/sections/menu/departments';

// ----------------------------------------------------------------------

const metadata = { title: `Product list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ProductListView />
    </>
  );
}
