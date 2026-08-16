import { CONFIG } from 'src/global-config';

import { CashRegistersListView } from 'src/sections/cashbox/transaction-groups-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Transaction Groups | Dashboard - ${CONFIG.appName}` };

export default function Page() {
    return (
        <>
            <title>{metadata.title}</title>

            <CashRegistersListView />
        </>
    );
}
