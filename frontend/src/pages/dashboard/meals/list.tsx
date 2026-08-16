import { CONFIG } from 'src/global-config';

import { Meals } from 'src/sections/meals/meals-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Product list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <Meals />
    </>
  );
}
