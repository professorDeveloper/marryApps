import { CONFIG } from 'src/global-config';

import { CategoryListView } from 'src/sections/menu/category/category-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Product list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  
  return (
    <>
      <title>{metadata.title}</title>

      <CategoryListView />

    </>
  );
}
