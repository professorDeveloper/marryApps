import { CONFIG } from 'src/global-config';

import { CashboxReportView } from 'src/sections/cashbox/cashbox-report-view';

const metadata = { title: `Cashbox Report | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <CashboxReportView />
    </>
  );
}
