import { CONFIG } from 'src/global-config';
import { CashiersListView } from 'src/sections/cashbox/cashiers-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Cashiers | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>
            <CashiersListView />
        </>
    );
}
