import { CONFIG } from 'src/global-config';

import { AnalyticsDashboardView } from 'src/sections/analytics-dashboard';

const metadata = { title: `Analytics | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <AnalyticsDashboardView />
    </>
  );
}
