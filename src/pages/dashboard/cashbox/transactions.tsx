import { CONFIG } from 'src/global-config';
import { TransactionsListView } from 'src/sections/cashbox/transfer-list-view';

const metadata = { title: `Transactions | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <TransactionsListView />
    </>
  );
}
