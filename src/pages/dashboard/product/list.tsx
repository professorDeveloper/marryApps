import { CONFIG } from 'src/global-config';

import { ProductListView } from 'src/sections/products/departments-list-view';

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
